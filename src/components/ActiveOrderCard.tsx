import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getLastOrder } from '../lib/orderTracking'
import { useOrderTracking } from '../hooks/useOrderTracking'
import { formatOrderNumber, isOrderActive, stepIndex, STATUS_STEPS } from '../lib/orderStatus'
import { currency } from '../lib/format'

/**
 * Live status of this device's most recent order, shown at the top of the home
 * screen. Guests have no account, so a persistent entry point like this is the
 * only thing standing between a customer and losing track of their order.
 */
export function ActiveOrderCard() {
  const last = getLastOrder()
  const { order } = useOrderTracking(last?.id, last?.token)

  if (!last || !order || !isOrderActive(order.status)) return null

  const index = stepIndex(order.status)
  const step = STATUS_STEPS[index]
  const progress = ((index + 1) / STATUS_STEPS.length) * 100

  return (
    <Link to={`/order-confirmed/${last.id}?t=${last.token}`} className="active-order fade-in-up">
      <div className="active-order__head">
        <span className="active-order__eyebrow">Deine Bestellung</span>
        <ChevronRight size={18} />
      </div>

      <strong className="active-order__status">{step?.label ?? 'Unterwegs'}</strong>
      <span className="active-order__hint">{step?.hint}</span>

      <div className="active-order__track" role="presentation">
        <span className="active-order__fill" style={{ width: `${progress}%` }} />
      </div>

      <span className="active-order__meta">
        {formatOrderNumber(order.daily_number, last.id)} · {currency.format(order.total_amount)}
      </span>
    </Link>
  )
}
