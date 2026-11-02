// Card de "Runtime Log": stream de eventos com timestamp mono e badge de status.
const LEVEL_LABELS = {
  success: 'NOMINAL',
  edge: 'INFO',
  dispatch: 'DISPATCH',
  warning: 'ALERTA',
  destructive: 'LIMITE',
}

export function RuntimeLog({ title, entries = [], live = false, emptyMessage = 'Nenhum evento registrado.' }) {
  return (
    <section className="runtime-log" aria-label={title}>
      {title ? (
        <header className="runtime-log-head">
          <span className="runtime-log-title">{title}</span>
          {live ? (
            <span className="runtime-log-live">
              <i aria-hidden="true" />
              ao vivo
            </span>
          ) : null}
        </header>
      ) : null}
      {entries.length === 0 ? (
        <p className="runtime-log-empty">{emptyMessage}</p>
      ) : (
        <ol className="runtime-log-list">
          {entries.map((entry) => (
            <li key={entry.id} className="runtime-log-line">
              <span className="runtime-log-time">[{entry.time}]</span>
              <span className={`runtime-log-level ${entry.level}`}>{entry.label || LEVEL_LABELS[entry.level]}</span>
              <span className="runtime-log-msg">{entry.message}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default RuntimeLog
