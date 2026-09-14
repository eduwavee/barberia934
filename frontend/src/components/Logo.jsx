import logo from '../assets/logo.jpeg';

/**
 * Sello de la marca. Con `halo` se le agrega un anillo punteado que gira
 * despacio alrededor, como el filete del logo original.
 */
export default function Logo({ size = 72, halo = false, className = '' }) {
  const lado = halo ? size * 1.28 : size;

  return (
    <div
      className={`relative inline-flex items-center justify-center animate-sello ${className}`}
      style={{ width: lado, height: lado }}
    >
      {halo && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-dorado/45"
          style={{ animation: 'girar 18s linear infinite' }}
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 7"
            strokeLinecap="round"
          />
        </svg>
      )}
      <img
        src={logo}
        alt="Barbería 9 ¾"
        style={{ width: size, height: size }}
        className="rounded-full object-cover shadow-sello"
      />
    </div>
  );
}
