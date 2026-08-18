/**
 * Значок Google Colab: две дуги, повёрнутые навстречу друг другу.
 * Нарисован инлайновым SVG, чтобы не тянуть картинку из интернета —
 * сайт должен работать и без внешних запросов.
 */
export default function ColabIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 24"
      width="1.6em"
      height="1.05em"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round">
        <path d="M13.6 6.8a7.4 7.4 0 1 0 0 10.4" />
        <path d="M22.4 17.2a7.4 7.4 0 1 0 0-10.4" />
      </g>
    </svg>
  );
}
