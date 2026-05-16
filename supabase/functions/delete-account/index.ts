import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ownedDataTables = [
  'feed_items',
  'activity_feed',
  'activity_points',
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
  'activities',
  'consent_logs',
] as const

const userIdColumns = ['user_id', 'profile_id'] as const

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

    const user = userData.user
    const requestMetadata = await safeJson(request)

    await adminClient.from('deletion_requests').insert({
      user_id: user.id,
      requested_email: user.email ?? null,
      status: 'processing',
      metadata: requestMetadata,
    })

    for (const table of ownedDataTables) {
      await deleteOwnedRows(adminClient, table, user.id)
    }

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      await adminClient
        .from('deletion_requests')
        .update({
          status: 'pending_admin_review',
          metadata: {
            ...requestMetadata,
            authDeleteError: authDeleteError.message,
          },
        })
        .eq('user_id', user.id)
        .eq('status', 'processing')

      return jsonResponse({ error: authDeleteError.message, fallback: 'pending_admin_review' }, 500)
    }

    await adminClient.from('profiles').delete().eq('id', user.id)

    return jsonResponse({
      deleted: true,
      userId: user.id,
      deletedAt: new Date().toISOString(),
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected deletion error.' },
      500,
    )
  }
})

async function deleteOwnedRows(
  adminClient: ReturnType<typeof createClient>,
  table: string,
  userId: string,
) {
  for (const column of userIdColumns) {
    const { error } = await adminClient.from(table).delete().eq(column, userId)
    if (!error) {
      return
    }
    if (!/column|schema cache|does not exist|relation/i.test(error.message)) {
      throw error
    }
  }
}

async function safeJson(request: Request) {
  try {
    const body = await request.json()
    return typeof body === 'object' && body !== null ? body : {}
  } catch {
    return {}
  }
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
