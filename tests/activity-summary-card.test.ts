import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const componentUrl = new URL('../src/components/tracking/ActivitySummaryCard.tsx', import.meta.url)

test('activity summary card streams AI summary and supports sharing', () => {
  assert.equal(existsSync(componentUrl), true)

  const source = readFileSync(componentUrl, 'utf8')

  assert.match(source, /activity: Activity/)
  assert.match(source, /onShare\?: \(\) => void/)
  assert.match(source, /wa-section/)
  assert.match(source, /3px solid hsl\(var\(--primary\)\)/)
  assert.match(source, /useAuth\(\)/)
  assert.match(source, /formatDuration/)
  assert.match(source, /VITE_SUPABASE_URL/)
  assert.match(source, /intent: 'summary'/)
  assert.match(source, /userId: user\?\.id/)
  assert.match(source, /getReader\(\)/)
  assert.match(source, /TextDecoder/)
  assert.match(source, /navigator\.share/)
  assert.match(source, /navigator\.clipboard\.writeText/)
})
