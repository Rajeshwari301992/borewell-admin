'use client'
import type { Booking } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { X, Printer } from 'lucide-react'

interface Props {
  booking: Booking | null
  onClose: () => void
}

export default function InvoiceModal({ booking, onClose }: Props) {
  if (!booking) return null

  const amount = booking.finalAmount || booking.estimatedAmount
  const gst = Math.round(amount * 18 / 118)
  const subtotal = amount - gst

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:inset-auto print:relative"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden print:rounded-none print:shadow-none print:max-w-none"
          onClick={e => e.stopPropagation()}
        >

          {/* Modal toolbar - hidden on print */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
            <span className="font-bold text-slate-700">Invoice Preview</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print / Download
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice content */}
          <div className="p-8" id="invoice-content">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-2xl font-bold text-slate-800">S K Borewells</div>
                <div className="text-sm text-slate-500 mt-1">+91 83100 08194</div>
                <div className="text-sm text-slate-500">GST: 29XXXXX1234Z1ZX</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-blue-600">INVOICE</div>
                <div className="text-sm text-slate-500 mt-1">#{booking.bookingId}</div>
                <div className="text-sm text-slate-500">Date: {formatDate(new Date().toISOString().split('T')[0])}</div>
              </div>
            </div>

            {/* Status badge */}
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                booking.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {booking.status === 'Completed' ? 'PAID' : 'ESTIMATED'}
              </span>
            </div>

            {/* Bill to */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Bill To</div>
                <div className="font-bold text-slate-800">{booking.customerName}</div>
                <div className="text-sm text-slate-600 mt-1">{booking.address}</div>
                <div className="text-sm text-slate-600">{booking.village}, {booking.pincode}</div>
                <div className="text-sm text-slate-600 mt-1">{booking.mobile}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Service Info</div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div><span className="font-medium">Service:</span> {booking.serviceType}</div>
                  <div><span className="font-medium">Depth:</span> {booking.finalDepth ? `${booking.finalDepth} ft` : booking.depth ? `${booking.depth} ft (est.)` : '—'}</div>
                  {booking.waterStrikeLevel && <div><span className="font-medium">Water Strike:</span> {booking.waterStrikeLevel}</div>}
                  {booking.assignedTeam && <div><span className="font-medium">Team:</span> {booking.assignedTeam}</div>}
                  <div><span className="font-medium">Booking Date:</span> {formatDate(booking.bookingDate)}</div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-slate-800 text-white text-sm">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Description</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-700">
                    6½" Borewell Drilling — {booking.finalDepth || booking.depth} ft
                    <div className="text-xs text-slate-400">Tiered rate (₹125–₹185/ft based on depth)</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(Math.round(subtotal * 0.55))}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-700">7" GI Casing Pipe "B" — {booking.finalDepth || booking.depth} ft × ₹600</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(Math.round(subtotal * 0.38))}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-700">Setting Charges + End Cap + Coupling + Welding + Water Ripple</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(Math.round(subtotal * 0.07))}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-500 text-sm">Sub Total</td>
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-slate-500 text-sm">GST (18%)</td>
                  <td className="px-4 py-2 text-right text-slate-700 font-medium">{formatCurrency(gst)}</td>
                </tr>
                <tr className="bg-slate-800 text-white">
                  <td className="px-4 py-3 font-bold rounded-bl-lg">Total Amount</td>
                  <td className="px-4 py-3 text-right font-black text-lg rounded-br-lg">{formatCurrency(amount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Notes */}
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-600 mb-1">Terms & Conditions</div>
              <div>• Payment must be made immediately after completion of work.</div>
              <div>• Cost varies depending on actual depth drilled and casing pipe installed.</div>
              <div>• If borewell goes dry: only drilling + welding + setting charges apply. Casing extracted @ ₹80/ft.</div>
              <div>• We are not responsible for the end result of the borewell (yield, texture, etc.).</div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Thank you for choosing S K Borewells · www.borewellpro.in
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

