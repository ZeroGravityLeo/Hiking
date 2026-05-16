import { supabase, type Json, type UserDataTable } from '@/lib/supabase'

export const USER_DATA_TABLES: UserDataTable[] = [
  'profiles',
  'activities',
  'activity_points',
  'activity_feed',
  'feed_items',
  'collected_animals',
  'trail_photos',
  'trail_reviews',
  'trail_times',
  'mission_progress',
  'gear_reviews',
  'saved_guides',
  'checklist_progress',
  'consent_logs',
  'deletion_requests',
]

export interface ExportedUserData {
  exportedAt: string
  userId: string
  email: string | null
  tables: Partial<Record<UserDataTable, Json[]>>
  unavailableTables: string[]
}

const USER_ID_COLUMNS = ['user_id', 'profile_id', 'id'] as const

async function fetchTableRows(table: UserDataTable, userId: string) {
  for (const column of USER_ID_COLUMNS) {
    const { data, error } = await supabase.from(table).select('*').eq(column, userId)

    if (!error) {
      return data
    }

    if (!/column|schema cache|does not exist|relation/i.test(error.message)) {
      throw error
    }
  }

  return null
}

export async function exportUserDataFromClient(): Promise<ExportedUserData> {
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error(userError?.message ?? 'You must be signed in to export data.')
  }

  const tables: Partial<Record<UserDataTable, Json[]>> = {}
  const unavailableTables: string[] = []

  for (const table of USER_DATA_TABLES) {
    const rows = await fetchTableRows(table, userData.user.id)
    if (rows) {
      tables[table] = rows
    } else {
      unavailableTables.push(table)
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    userId: userData.user.id,
    email: userData.user.email ?? null,
    tables,
    unavailableTables,
  }
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
