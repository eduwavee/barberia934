import Contador from './Contador';

/**
 * Medallón de puntos: reproduce el sello de la marca —texto curvado apenas
 * marcado sobre el fondo, como grabado— con el saldo en el centro.
 */
export default function MedallonPuntos({ puntos = 0 }) {
  return (
    <div className="relative mx-auto w-[224px] h-[224px] animate-aparecer-escala">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id="arco-superior" d="M100,100 m-72,0 a72,72 0 0,1 144,0" fill="none" />
          <path id="arco-inferior" d="M100,100 m-82,0 a82,82 0 0,0 164,0" fill="none" />
          {/*
            En coordenadas reales (no en % del contenedor) para poder ubicar el
            marrón claro justo en el anillo visible: el disco interior tapa todo
            lo que está por dentro del 62% del radio, así que un degradado que
            aclare el centro no se vería.
          */}
          <radialGradient id="disco" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="99">
            <stop offset="0%" stopColor="#1B1610" />
            <stop offset="55%" stopColor="#2E241A" />
            <stop offset="78%" stopColor="#5C462E" />
            <stop offset="100%" stopColor="#0E0C09" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="99" fill="url(#disco)" />
        <circle cx="100" cy="100" r="93" fill="none" stroke="#C9AE8C" strokeWidth="0.9" opacity="0.5" />

        {/*
          El disco interior va antes que el texto: pintado después le tapaba las
          letras de abajo, y "JACOB RUIZ" se veía cortado.
        */}
        <circle cx="100" cy="100" r="61" fill="#0A0A0A" stroke="#C9AE8C" strokeWidth="1.4" opacity="0.9" />

        {/* Texto del sello, en el anillo entre los dos círculos */}
        <text fill="#C9AE8C" fontSize="15" fontFamily="'Playfair Display', serif" letterSpacing="4.5" opacity="0.92">
          <textPath href="#arco-superior" startOffset="50%" textAnchor="middle">
            BARBERÍA
          </textPath>
        </text>
        <text fill="#C9AE8C" fontSize="13" fontFamily="'Playfair Display', serif" letterSpacing="4" opacity="0.85">
          <textPath href="#arco-inferior" startOffset="50%" textAnchor="middle">
            JACOB RUIZ
          </textPath>
        </text>

        <circle cx="26" cy="100" r="2" fill="#C9AE8C" opacity="0.5" />
        <circle cx="174" cy="100" r="2" fill="#C9AE8C" opacity="0.5" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Contador valor={puntos} className="text-[46px] font-bold leading-none tracking-tight" />
        <p className="text-[11px] tracking-[0.28em] text-crema/75 mt-1.5">PUNTOS</p>
      </div>
    </div>
  );
}
