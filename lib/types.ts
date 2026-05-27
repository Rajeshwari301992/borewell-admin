export type BookingStatus =
  | 'Booking Received'
  | 'Team Assigned'
  | 'Confirmed & Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'

export interface Booking {
  id: string
  bookingId: string
  customerName: string
  mobile: string
  altMobile?: string
  address: string
  village: string
  pincode: string
  serviceType: string
  depth: number
  estimatedAmount: number
  bookingDate: string
  requiredDate?: string
  status: BookingStatus
  notes?: string
  // job details (filled by admin)
  assignedTeam?: string
  assignedOperator?: string
  assignedVehicle?: string
  scheduledDate?: string
  scheduledTime?: string
  finalDepth?: number
  waterStrikeLevel?: string
  finalAmount?: number
  jobNotes?: string
  totalPVC?: string
}

export interface Notification {
  id: string
  type: 'new_booking' | 'cancelled' | 'completed'
  message: string
  bookingId: string
  timestamp: string
  read: boolean
}
