import './backgrounds.css';

/** Aurora / gradiente vivo en CSS puro. Los colores vienen del tema activo (--aurora-*). */
export default function Aurora() {
  return (
    <div className="bg-fx aurora" style={{ background: 'var(--bg)' }}>
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
    </div>
  );
}
