import type { BookingStatus } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {status}
    </span>
  )
}
