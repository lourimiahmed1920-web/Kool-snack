import { Minus, Plus, Trash2 } from 'lucide-react'
import { haptic } from '../lib/native'

interface QuantityStepperProps {
  quantity: number
  onAdd: () => void
  onRemove: () => void
  /**
   * Lowest reachable value. 0 (the default) lets the minus button empty the line
   * — the cart shows a trash icon at 1 to make that outcome explicit. Pass 1
   * where removal isn't meaningful, e.g. the quantity picker inside a sheet.
   */
  min?: number
}

export function QuantityStepper({ quantity, onAdd, onRemove, min = 0 }: QuantityStepperProps) {
  const removesLine = min === 0 && quantity <= 1
  const canRemove = quantity > min

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__btn"
        onClick={() => {
          haptic('light')
          onRemove()
        }}
        disabled={!canRemove}
        aria-label={removesLine ? 'Entfernen' : 'Weniger'}
      >
        {removesLine ? <Trash2 size={16} /> : <Minus size={16} />}
      </button>

      <span className="stepper__value" aria-live="polite">
        {quantity}
      </span>

      <button
        type="button"
        className="stepper__btn"
        onClick={() => {
          haptic('light')
          onAdd()
        }}
        aria-label="Mehr"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
