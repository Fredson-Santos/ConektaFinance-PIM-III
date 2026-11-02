export function Placeholder({ title }) {
  return (
    <div className="ds-card" style={{ padding: 40, textAlign: 'center' }}>
      <h2 style={{ fontSize: 16 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--ds-foreground-muted)', marginTop: 6 }}>
        Esta tela será implementada na próxima fase.
      </p>
    </div>
  )
}

export default Placeholder
