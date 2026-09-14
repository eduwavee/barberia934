/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Muestreados de la referencia de diseño (src/assets/referencia.jpg)
        negro: '#0A0A0A',
        panel: '#141414',
        borde: '#2E2A24', // hairline cálido, como en la referencia
        dorado: {
          DEFAULT: '#C9AE8C', // arena: botones, chips activos, acentos
          claro: '#E2D3BC',
          oscuro: '#9B836B',
        },
        crema: '#EDE7DC', // texto sobre fondo oscuro
        papel: '#DFD8C6', // tarjetas claras (próximos turnos, medios de pago)
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        dorado: '0 0 24px -6px rgba(201, 174, 140, 0.45)',
        sello: '0 10px 30px -12px rgba(0, 0, 0, 0.9)',
        tarjeta: '0 14px 34px -18px rgba(0, 0, 0, 1)',
      },
      keyframes: {
        aparecer: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        aparecerEscala: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        entrarDerecha: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        sello: {
          '0%': { opacity: '0', transform: 'scale(1.35) rotate(-12deg)' },
          '60%': { opacity: '1', transform: 'scale(0.97) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        brillo: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        latido: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 174, 140, 0.45)' },
          '50%': { boxShadow: '0 0 0 9px rgba(201, 174, 140, 0)' },
        },
        destello: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.12)' },
        },
        flotar: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        girar: {
          '100%': { transform: 'rotate(360deg)' },
        },
        tijeretazo: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '35%': { transform: 'rotate(-16deg)' },
          '70%': { transform: 'rotate(9deg)' },
        },
        temblor: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        marcar: {
          '0%': { strokeDashoffset: '48' },
          '100%': { strokeDashoffset: '0' },
        },
        rebote: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '40%': { transform: 'translateY(-4px) scale(1.14)' },
          '70%': { transform: 'translateY(0) scale(0.96)' },
        },
        revelar: {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        entrarPantalla: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.995)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        subirPanel: {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        onda: {
          '0%': { opacity: '0.35', transform: 'scale(0)' },
          '100%': { opacity: '0', transform: 'scale(2.6)' },
        },
        derivaLenta: {
          '0%': { transform: 'scale(1.06) translate3d(0, 0, 0)' },
          '100%': { transform: 'scale(1.14) translate3d(-1.5%, -1.5%, 0)' },
        },
        acercarFoto: {
          '0%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        aparecer: 'aparecer 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'aparecer-escala': 'aparecerEscala 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'entrar-derecha': 'entrarDerecha 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        sello: 'sello 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        brillo: 'brillo 2.6s linear infinite',
        latido: 'latido 2.2s ease-out infinite',
        destello: 'destello 4s ease-in-out infinite',
        flotar: 'flotar 4.5s ease-in-out infinite',
        girar: 'girar 0.8s linear infinite',
        tijeretazo: 'tijeretazo 0.6s ease-in-out',
        temblor: 'temblor 0.35s ease-in-out',
        marcar: 'marcar 0.5s ease-out both',
        rebote: 'rebote 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        revelar: 'revelar 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'entrar-pantalla': 'entrarPantalla 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'subir-panel': 'subirPanel 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        onda: 'onda 0.6s ease-out forwards',
        deriva: 'derivaLenta 18s ease-in-out infinite alternate',
        'acercar-foto': 'acercarFoto 8s ease-out both',
      },
    },
  },
  plugins: [],
}
