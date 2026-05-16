import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const userDataTables = [
  'profiles',
  'activities',
  'activity_points',
  'activity_feed',
  'feed_items',
  'activity_photos',
  'feed_likes',
  'feed_comments',
  'collected_animals',
  'trail_photos',
  'trail_reviews',
  'points_ledger',
  'trail_times',
  'mission_progress',
  'gear_reviews',
  'saved_guides',
  'checklist_progress',
  'consent_logs',
  'deletion_requests',
] as const

const userIdColumns = ['user_id', 'profile_id', 'id'] as const

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authorization = request.headers.get('Authorization')

    if (!supabaseUrl || !serviceRoleKey || !authorization) {
      return jsonResponse({ error: 'Missing Supabase configuration or authorization.' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const token = authorization.replace('Bearer ', '')
    const { data: userData, error: userError } = await adminClient.auth.getUser(token)

    if (userError || !userData.user) {
      return jsonResponse({ error: userError?.message ?? 'Unauthorized.' }, 401)
    }

    const tables: Record<string, unknown[]> = {}
    const unavailableTables: string[] = []

    for (const table of userDataTables) {
      const rows = await fetchRows(adminClient, table, userData.user.id)
      if (rows) {
        tables[table] = rows
      } else {
        unavailableTables.push(table)
      }
    }

    return jsonResponse({
      exportedAt: new Date().toISOString(),
      userId: userData.user.id,
      email: userData.user.email ?? null,
      tables,
      unavailableTables,
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected export error.' },
      500,
    )
  }
})

async function fetchRows(
  adminClient: ReturnType<typeof createClient>,
  table: string,
  userId: string,
) {
  for (const column of userIdColumns) {
    const { data, error } = await adminClient.from(table).select('*').eq(column, userId)
    if (!error) {
      return data ?? []
    }
    if (!/column|schema cache|does not exist|relation/i.test(error.message)) {
      throw error
    }
  }

  return null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
