import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const homePageSource = readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('home page source renders the Wild Alberta hiking landing sections', () => {
  assert.match(homePageSource, /Find your next Alberta adventure/)
  assert.match(homePageSource, /Search by city, park, or trail name/)
  assert.match(homePageSource, /Explore nearby trails/)
  assert.match(homePageSource, /Local favorites near Calgary/)
  assert.match(homePageSource, /Record your activities/)
  assert.match(homePageSource, /Collect wild moments/)
})

test('app source exposes expected hiking navigation routes', () => {
  assert.match(appSource, /path="\/explore"/)
  assert.match(appSource, /path="\/tracking"/)
  assert.match(appSource, /path="\/map"/)
  assert.match(appSource, /path="\/wildlife"/)
  assert.match(homePageSource, /Start recording/)
  assert.match(homePageSource, /Open map/)
})
