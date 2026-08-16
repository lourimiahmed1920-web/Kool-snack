export type StaffRole = 'inhaber' | 'manager' | 'mitarbeiter' | 'kueche'

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  inhaber: 'Inhaber',
  manager: 'Manager',
  mitarbeiter: 'Mitarbeiter',
  kueche: 'Küche',
}

export interface StaffProfile {
  id: string
  restaurant_id: string | null
  full_name: string | null
  phone: string | null
  role: StaffRole | 'kunde'
  is_active: boolean
  loyalty_points: number
}
