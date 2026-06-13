export function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-[18px] border border-line bg-panel shadow-card ${className}`}
    >
      {children}
    </section>
  );
}
