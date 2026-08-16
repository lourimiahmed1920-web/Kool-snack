export interface TimeEntryBreak {
  id: string
  time_entry_id: string
  break_start: string
  break_end: string | null
}

export interface TimeEntry {
  id: string
  profile_id: string
  restaurant_id: string
  clock_in: string
  clock_out: string | null
  breaks: TimeEntryBreak[]
}
