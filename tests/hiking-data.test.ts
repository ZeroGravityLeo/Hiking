import assert from 'node:assert/strict'
import test from 'node:test'

import { DEMO_MISSIONS, DEMO_TRAILS, DEMO_WILDLIFE } from '../src/lib/demo-data'

test('demo hiking trails have stable slugs and planning data', () => {
  assert.ok(DEMO_TRAILS.length >= 4)

  const slugs = new Set(DEMO_TRAILS.map((trail) => trail.slug))
  assert.equal(slugs.size, DEMO_TRAILS.length)
  assert.ok(DEMO_TRAILS.every((trail) => trail.distance_km > 0))
  assert.ok(DEMO_TRAILS.every((trail) => trail.estimated_time_minutes > 0))
})

test('demo missions and wildlife collections support the hiking loop', () => {
  assert.ok(DEMO_MISSIONS.some((mission) => mission.type === 'first_hike'))
  assert.ok(DEMO_MISSIONS.some((mission) => mission.type === 'wildlife_count'))
  assert.ok(DEMO_WILDLIFE.some((animal) => animal.name === 'Black Bear'))
})
