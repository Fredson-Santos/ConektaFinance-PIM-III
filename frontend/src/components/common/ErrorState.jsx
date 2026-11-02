import { WifiOff, RotateCcw } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <WifiOff size={30} strokeWidth={1.5} color="var(--ds-red-700)" />
      <h3 style={{ fontSize: 14.5 }}>Não foi possível carregar</h3>
      <p style={{ fontSize: 12.5, color: 'var(--ds-foreground-muted)', maxWidth: 320 }}>
        {message || 'Verifique sua conexão e tente novamente.'}
      </p>
      {onRetry ? (
        <Button variant="secondary" icon={RotateCcw} onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}

export default ErrorState
