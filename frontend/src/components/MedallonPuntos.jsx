import Contador from './Contador';

/**
 * Medallón de puntos: reproduce el sello de la marca con el texto curvado
 * alrededor y el saldo en el centro.
 */
export default function MedallonPuntos({ puntos = 0 }) {
  return (
    <div className="relative mx-auto w-[210px] h-[210px] animate-aparecer-escala">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id="arco-superior" d="M100,100 m-78,0 a78,78 0 0,1 156,0" fill="none" />
          <path id="arco-inferior" d="M100,100 m-72,0 a72,72 0 0,0 144,0" fill="none" />
        </defs>

        <circle cx="100" cy="100" r="98" fill="#141414" />
        <circle cx="100" cy="100" r="92" fill="none" stroke="#C9AE8C" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="66" fill="#0A0A0A" stroke="#C9AE8C" strokeWidth="1" opacity="0.55" />

        <text
          fill="#C9AE8C"
          fontSize="15"
          fontFamily="'Playfair Display', serif"
          letterSpacing="4.5"
        >
          <textPath href="#arco-superior" startOffset="50%" textAnchor="middle">
            BARBERÍA
          </textPath>
        </text>
        <text
          fill="#C9AE8C"
          fontSize="13"
          fontFamily="'Playfair Display', serif"
          letterSpacing="4"
          opacity="0.75"
        >
          <textPath href="#arco-inferior" startOffset="50%" textAnchor="middle">
            JACOB RUIZ
          </textPath>
        </text>

        <circle cx="16" cy="100" r="2.2" fill="#C9AE8C" />
        <circle cx="184" cy="100" r="2.2" fill="#C9AE8C" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Contador valor={puntos} className="font-display text-[46px] leading-none text-crema" />
        <p className="text-[10px] tracking-[0.3em] text-dorado mt-2">PUNTOS</p>
      </div>
    </div>
  );
}
