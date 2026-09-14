"""
Prepara los assets de la app a partir de la hoja de diseño `src/assets/image.png`.

Los recortes de la hoja son chicos (la hoja entera mide 1024 px de ancho), así que
se agrandan con super-resolución EDSR x4 en vez de un reescalado común: sobre
fotos da bastante menos ruido y bordes más limpios que LANCZOS.

Requisitos:
    python -m pip install pillow opencv-contrib-python qrcode
    # modelo EDSR x4 (38 MB), dejarlo en scripts/modelos/EDSR_x4.pb
    curl -sSL -o scripts/modelos/EDSR_x4.pb \
      https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb

Uso:
    python scripts/preparar-assets.py
"""
import os

import cv2
import numpy as np
import qrcode
from PIL import Image, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(AQUI, "..", "src", "assets")
HOJA = os.path.join(ASSETS, "image.png")
MODELO = os.path.join(AQUI, "modelos", "EDSR_x4.pb")

DORADO = (201, 174, 140)

# A dónde apunta el QR de la pantalla de Ubicación. Cambiar por la URL de la app
# publicada; se regenera corriendo este script.
URL_APP = "https://github.com/eduwavee/barberia934"

hoja = Image.open(HOJA).convert("RGB")
_sr = None


def superescalar(im):
    """Agranda x4 con EDSR (cachea el modelo entre llamadas)."""
    global _sr
    if _sr is None:
        if not os.path.exists(MODELO):
            raise SystemExit(f"Falta el modelo EDSR en {MODELO} (ver encabezado)")
        _sr = cv2.dnn_superres.DnnSuperResImpl_create()
        _sr.readModel(MODELO)
        _sr.setModel("edsr", 4)
    arr = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    return Image.fromarray(cv2.cvtColor(_sr.upsample(arr), cv2.COLOR_BGR2RGB))


def recortar_blancos(im, umbral=215):
    """Saca las filas y columnas del borde que son el papel blanco de la hoja."""
    w, h = im.size

    def claro(pixeles):
        return sum(sum(p) / 3 for p in pixeles) / len(pixeles) > umbral

    izq, der, arr, aba = 0, w, 0, h
    while izq < der and claro([im.getpixel((izq, y)) for y in range(arr, aba, 4)]):
        izq += 1
    while der > izq + 1 and claro([im.getpixel((der - 1, y)) for y in range(arr, aba, 4)]):
        der -= 1
    while arr < aba and claro([im.getpixel((x, arr)) for x in range(izq, der, 4)]):
        arr += 1
    while aba > arr + 1 and claro([im.getpixel((x, aba - 1)) for x in range(izq, der, 4)]):
        aba -= 1
    return im.crop((izq + 1, arr + 1, der - 1, aba - 1))


def ajustar(im, ancho):
    """Lleva la imagen al ancho pedido; si hay que achicar, afila apenas."""
    if im.width == ancho:
        return im
    alto = round(im.height * ancho / im.width)
    achicando = ancho < im.width
    im = im.resize((ancho, alto), Image.LANCZOS)
    if achicando:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=3))
    return im


def sin_fondo_blanco(im, umbral=232):
    """Vuelve transparente el fondo blanco de las fotos de producto."""
    im = im.convert("RGBA")
    px = im.load()
    mascara = Image.new("L", im.size, 0)
    mp = mascara.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            mp[x, y] = 0 if (r > umbral and g > umbral and b > umbral) else 255
    mascara = mascara.filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(mascara)
    caja = im.split()[3].getbbox()
    return im.crop(caja) if caja else im


def sin_fondo_por_inundacion(im, umbral=228):
    """
    Vuelve transparente sólo el fondo blanco *conectado al borde*. A diferencia
    de sin_fondo_blanco, respeta los blancos internos del dibujo (por ejemplo
    las manos del logo de Mercado Pago).
    """
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    def es_claro(p):
        return p[0] > umbral and p[1] > umbral and p[2] > umbral

    fondo = bytearray(w * h)
    pila = [(x, y) for x in range(w) for y in (0, h - 1)]
    pila += [(x, y) for y in range(h) for x in (0, w - 1)]
    while pila:
        x, y = pila.pop()
        i = y * w + x
        if fondo[i] or not es_claro(px[x, y]):
            continue
        fondo[i] = 1
        if x > 0:
            pila.append((x - 1, y))
        if x < w - 1:
            pila.append((x + 1, y))
        if y > 0:
            pila.append((x, y - 1))
        if y < h - 1:
            pila.append((x, y + 1))

    mascara = Image.frombytes("L", (w, h), bytes(255 if not b else 0 for b in fondo))
    mascara = mascara.filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(mascara)
    caja = im.split()[3].getbbox()
    return im.crop(caja) if caja else im


def tenir_claros(im, umbral=150):
    """El mapa trae un pin blanco grabado: lo pasa al dorado de la marca."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if sum(px[x, y]) / 3 > umbral:
                px[x, y] = DORADO
    return im


def guardar(im, nombre, calidad=92):
    ruta = os.path.join(ASSETS, nombre)
    if nombre.endswith(".jpg"):
        im.convert("RGB").save(ruta, quality=calidad, optimize=True, subsampling=0)
    else:
        im.save(ruta, optimize=True)
    print(f"  {nombre:24} {im.size[0]}x{im.size[1]}  {os.path.getsize(ruta)//1024} KB")


print("Fotos de ambiente")
# Foto del local: fondo del login a pantalla completa y ambiente en Pagos
guardar(superescalar(recortar_blancos(hoja.crop((256, 58, 518, 350)))), "barberia-local.jpg")

# Banner del inicio: solo la máquina, sin el texto grabado (se compone en vivo).
# Una sola pasada: encadenar dos le alisa la textura del cuero y queda plano.
banner = superescalar(hoja.crop((668, 66, 772, 199)))
guardar(ajustar(banner, 900), "banner-maquina.jpg")

# Mapa de Ubicación
mapa = superescalar(recortar_blancos(hoja.crop((518, 382, 788, 546))))
guardar(ajustar(tenir_claros(mapa), 1200), "mapa.jpg")

print("Logos de pago")
# Acá NO se usa recortar_blancos: son letras oscuras sobre blanco y el recorte
# automático se come las columnas del borde que tienen poca tinta.
# El fondo se saca por inundación desde el borde, así los blancos internos
# (las manos de Mercado Pago) quedan intactos.
for nombre, caja in {
    "pago-mercadopago.png": (16, 274, 243, 347),
    "pago-naranjax.png": (16, 352, 243, 411),
}.items():
    guardar(ajustar(sin_fondo_por_inundacion(superescalar(hoja.crop(caja))), 520), nombre)

print("Productos canjeables")
# Primero se agranda con la foto entera y recién después se saca el fondo:
# el recorte sale mucho más limpio a esta resolución.
for nombre, caja in {
    "producto-cera.png": (258, 380, 358, 509),
    "producto-polvo.png": (358, 372, 442, 509),
    "producto-aceite.png": (440, 368, 516, 509),
}.items():
    grande = superescalar(superescalar(hoja.crop(caja)))
    guardar(ajustar(sin_fondo_blanco(grande), 360), nombre)

print("Código QR")
# El QR de la hoja es decorativo: no codifica nada. Se genera uno real.
qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,  # tolera el sello al centro
    box_size=20,
    border=2,
)
qr.add_data(URL_APP)
qr.make(fit=True)
img = qr.make_image(fill_color="#0A0A0A", back_color="white").convert("RGB")

# Sello de la marca en el centro, como en la referencia
sello = Image.open(os.path.join(ASSETS, "logo.jpeg")).convert("RGB")
lado = img.width // 5
sello = sello.resize((lado, lado), Image.LANCZOS)
redondo = Image.new("L", (lado, lado), 0)
from PIL import ImageDraw  # noqa: E402

ImageDraw.Draw(redondo).ellipse((0, 0, lado - 1, lado - 1), fill=255)
pos = ((img.width - lado) // 2, (img.height - lado) // 2)
ImageDraw.Draw(img).ellipse(
    (pos[0] - 8, pos[1] - 8, pos[0] + lado + 8, pos[1] + lado + 8), fill="white"
)
img.paste(sello, pos, redondo)
guardar(ajustar(img, 900), "qr.png")

print("\nListo.")
