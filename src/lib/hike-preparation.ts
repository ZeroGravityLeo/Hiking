import type { ActivityPreparationSummary, ChecklistItemState, Trail } from '@/lib/types'
import type { TrailWeather } from '@/lib/weather'

export type ChecklistItemId =
  | 'water'
  | 'food'
  | 'charged-phone'
  | 'offline-map'
  | 'first-aid'
  | 'headlamp'
  | 'extra-layer'
  | 'rain-jacket'
  | 'sunscreen'
  | 'bear-spray'
  | 'whistle'
  | 'power-bank'
  | 'trekking-poles'
  | 'microspikes'
  | 'dog-leash'
  | 'kids-kit'

export interface BackpackChecklistItem {
  id: ChecklistItemId
  label: string
  essential: boolean
  optional?: boolean
  reason: string
}

export interface PreparationAcknowledgements {
  weatherChecked: boolean
  waterPlanned: boolean
  foodPlanned: boolean
  offlineMapAcknowledged: boolean
  safetyWarningsAcknowledged: boolean
}

export interface HikePreparationPlan {
  trail: Trail
  weather: TrailWeather
  estimatedCalories: {
    min: number
    max: number
  }
  recommendedWaterLiters: {
    min: number
    max: number
    electrolytes: boolean
    reason: string
  }
  foodRecommendation: {
    title: string
    items: string[]
    familyItems: string[]
  }
  clothingRecommendation: {
    baseLayer: string
    midLayer: string
    shell: string
    pants: string
    footwear: string
    accessories: string[]
    warnings: string[]
  }
  checklist: BackpackChecklistItem[]
  safetyWarnings: string[]
  readiness: {
    score: number
    missing: string[]
    checklistCompletionPercent: number
  }
  weatherSummary: string
}

const DEFAULT_USER_WEIGHT_KG = 75

const BASE_CHECKLIST: BackpackChecklistItem[] = [
  { id: 'water', label: 'Water', essential: true, reason: 'Hydration is required for every hike.' },
  { id: 'food', label: 'Food/snacks', essential: true, reason: 'Fuel prevents energy crashes.' },
  { id: 'charged-phone', label: 'Charged phone', essential: true, reason: 'Navigation and emergency access.' },
  { id: 'offline-map', label: 'Offline map', essential: true, reason: 'Signal can drop in valleys and canyons.' },
  { id: 'first-aid', label: 'First aid kit', essential: true, reason: 'Blisters and small injuries are common.' },
  { id: 'headlamp', label: 'Headlamp', essential: true, reason: 'Useful if the hike runs late.' },
  { id: 'extra-layer', label: 'Extra layer', essential: true, reason: 'Mountain weather can change fast.' },
  { id: 'rain-jacket', label: 'Rain jacket', essential: true, reason: 'Wind and rain protection.' },
  { id: 'sunscreen', label: 'Sunscreen', essential: true, reason: 'UV exposure rises with elevation.' },
  { id: 'bear-spray', label: 'Bear spray where applicable', essential: true, reason: 'Recommended in Alberta bear country.' },
  { id: 'whistle', label: 'Whistle', essential: true, reason: 'Simple emergency signal.' },
  { id: 'power-bank', label: 'Power bank', essential: true, reason: 'GPS tracking drains battery.' },
  { id: 'trekking-poles', label: 'Trekking poles optional', essential: false, optional: true, reason: 'Helpful on steep or long routes.' },
  { id: 'microspikes', label: 'Microspikes optional', essential: false, optional: true, reason: 'Useful on ice or shoulder-season snow.' },
  { id: 'dog-leash', label: 'Dog leash optional', essential: false, optional: true, reason: 'Required in many parks and safer near wildlife.' },
  { id: 'kids-kit', label: 'Kids activity kit optional', essential: false, optional: true, reason: 'Keeps younger hikers engaged.' },
]

export const EMPTY_ACKNOWLEDGEMENTS: PreparationAcknowledgements = {
  weatherChecked: false,
  waterPlanned: false,
  foodPlanned: false,
  offlineMapAcknowledged: false,
  safetyWarningsAcknowledged: false,
}

export function getDefaultChecklist(): ChecklistItemState[] {
  return BASE_CHECKLIST.map((item) => ({ id: item.id, checked: false }))
}

export function buildHikePreparationPlan({
  trail,
  weather,
  checklistState,
  acknowledgements,
  kidsMode = false,
  userWeightKg = DEFAULT_USER_WEIGHT_KG,
}: {
  trail: Trail
  weather: TrailWeather
  checklistState: ChecklistItemState[]
  acknowledgements: PreparationAcknowledgements
  kidsMode?: boolean
  userWeightKg?: number
}): HikePreparationPlan {
  const durationHours = Math.max(0.5, trail.estimated_time_minutes / 60)
  const familyFriendly = kidsMode || (trail.difficulty === 'easy' && trail.distance_km <= 5)
  const remoteTrail = isRemoteTrail(trail)
  const estimatedCalories = estimatePreHikeCalories(trail, weather, userWeightKg)
  const recommendedWaterLiters = recommendWater(trail, weather)
  const foodRecommendation = recommendFood(durationHours, familyFriendly)
  const clothingRecommendation = recommendClothing(trail, weather)
  const safetyWarnings = buildSafetyWarnings(trail, weather, remoteTrail)
  const checklist = BASE_CHECKLIST
  const readiness = calculateReadiness({
    checklist,
    checklistState,
    acknowledgements,
    safetyWarnings,
    enoughDaylight: !safetyWarnings.some((warning) => warning.includes('sunset')),
  })

  return {
    trail,
    weather,
    estimatedCalories,
    recommendedWaterLiters,
    foodRecommendation,
    clothingRecommendation,
    checklist,
    safetyWarnings,
    readiness,
    weatherSummary: `${weather.condition}, ${weather.temperatureC}C feels like ${weather.feelsLikeC}C, ${weather.windKph} km/h wind`,
  }
}

export function createPreparationSummary(plan: HikePreparationPlan): ActivityPreparationSummary {
  return {
    estimatedCalories: plan.estimatedCalories,
    recommendedWaterLiters: plan.recommendedWaterLiters,
    weatherSummary: plan.weatherSummary,
    checklistCompletionPercent: plan.readiness.checklistCompletionPercent,
    readinessScore: plan.readiness.score,
    warnings: plan.safetyWarnings,
  }
}

function estimatePreHikeCalories(trail: Trail, weather: TrailWeather, userWeightKg: number) {
  const difficultyMet = trail.difficulty === 'hard' ? 7.4 : trail.difficulty === 'moderate' ? 6.3 : 4.8
  const durationHours = Math.max(0.5, trail.estimated_time_minutes / 60)
  const elevationModifier = 1 + Math.min(0.28, trail.elevation_gain_m / 2500)
  const weatherModifier =
    weather.temperatureC >= 26 || weather.feelsLikeC <= 0 || weather.windKph >= 35 || weather.precipitationChance >= 60
      ? 1.12
      : 1
  const base = difficultyMet * userWeightKg * durationHours * elevationModifier * weatherModifier

  return {
    min: Math.round(base * 0.85),
    max: Math.round(base * 1.15),
  }
}

function recommendWater(trail: Trail, weather: TrailWeather) {
  const durationHours = Math.max(0.5, trail.estimated_time_minutes / 60)
  let liters = durationHours * 0.5

  if (weather.temperatureC >= 24 || weather.feelsLikeC >= 24) {
    liters += 0.5
  }
  if (trail.elevation_gain_m >= 400) {
    liters += 0.35
  }
  if (isRemoteTrail(trail)) {
    liters += 0.35
  }
  if (durationHours >= 4) {
    liters += 0.5
  }

  const min = roundToHalf(Math.max(0.5, liters))
  const max = roundToHalf(min + (durationHours >= 3 || weather.temperatureC >= 24 ? 0.75 : 0.5))

  return {
    min,
    max,
    electrolytes: weather.temperatureC >= 24 || durationHours >= 3,
    reason: `${durationHours.toFixed(1)}h route with ${trail.elevation_gain_m} m gain`,
  }
}

function recommendFood(durationHours: number, familyFriendly: boolean) {
  if (durationHours < 1.5) {
    return {
      title: 'Short hike snacks',
      items: ['fruit', 'granola bar', 'nuts'],
      familyItems: familyFriendly ? ['small treat', 'extra kid-friendly snack'] : [],
    }
  }

  if (durationHours < 4) {
    return {
      title: 'Medium hike fuel',
      items: ['energy bars', 'trail mix', 'fruit', 'sandwich or wrap', 'electrolytes'],
      familyItems: familyFriendly ? ['easy-to-open snacks', 'backup snack for kids'] : [],
    }
  }

  return {
    title: 'Long hike fuel',
    items: ['high-calorie snacks', 'sandwich or wrap', 'jerky', 'trail mix', 'chocolate or energy chews', 'emergency snack'],
    familyItems: familyFriendly ? ['extra kid portions', 'comfort snack'] : [],
  }
}

function recommendClothing(trail: Trail, weather: TrailWeather) {
  const accessories = ['hiking pants', 'hiking shoes or boots']
  const warnings = ['Avoid cotton on longer hikes.']
  const baseLayer = weather.feelsLikeC <= 6 ? 'warm synthetic or merino base layer' : 'light synthetic or merino base layer'
  const midLayer = weather.feelsLikeC <= 12 || trail.elevation_gain_m >= 350 ? 'pack a fleece or insulated mid-layer' : 'light mid-layer optional'
  const shell = weather.precipitationChance >= 45 || weather.condition === 'rain' || weather.condition === 'snow'
    ? 'waterproof shell required'
    : 'pack a light shell'
  const pants = weather.condition === 'snow' || weather.feelsLikeC <= 3 ? 'warm hiking pants' : 'breathable hiking pants'
  const footwear = trail.difficulty === 'hard' || trail.elevation_gain_m >= 350 ? 'supportive hiking boots' : 'grippy hiking shoes'

  if (weather.windKph >= 25) {
    accessories.push('windbreaker')
  }
  if (weather.feelsLikeC <= 4) {
    accessories.push('gloves', 'warm hat')
  }
  if (weather.uvIndex >= 6) {
    accessories.push('sunglasses', 'sunscreen', 'brimmed hat')
  }
  if (weather.condition === 'snow' || weather.feelsLikeC <= 0) {
    accessories.push('microspikes')
  }
  if (trail.difficulty !== 'easy' || trail.elevation_gain_m >= 350) {
    accessories.push('trekking poles')
    warnings.push('Mountain weather can change quickly; pack for colder wind at elevation.')
  }

  return {
    baseLayer,
    midLayer,
    shell,
    pants,
    footwear,
    accessories: [...new Set(accessories)],
    warnings,
  }
}

function buildSafetyWarnings(trail: Trail, weather: TrailWeather, remoteTrail: boolean) {
  const warnings: string[] = ['Offline map is not downloaded yet.']
  const now = new Date()
  const sunset = new Date(weather.sunset)
  const expectedFinish = new Date(now.getTime() + trail.estimated_time_minutes * 60_000)

  if (now.getHours() >= 17) {
    warnings.push('Late start: leave extra margin or choose a shorter hike.')
  }
  if (expectedFinish > sunset) {
    warnings.push('You may finish after sunset; carry a headlamp.')
  }
  if (weather.condition === 'rain' || weather.precipitationChance >= 55) {
    warnings.push('Rain likely: expect slippery roots, rock, and boardwalks.')
  }
  if (weather.condition === 'snow') {
    warnings.push('Snow possible: traction and warmer layers are recommended.')
  }
  if (weather.condition === 'storm') {
    warnings.push('Storm risk: avoid exposed ridges and check official alerts.')
  }
  if (weather.windKph >= 35) {
    warnings.push('Strong wind: exposed viewpoints may feel colder and less stable.')
  }
  if (weather.feelsLikeC >= 28) {
    warnings.push('Extreme heat: start early and carry extra water.')
  }
  if (weather.feelsLikeC <= -5) {
    warnings.push('Extreme cold: frostbite risk rises with wind and delays.')
  }
  if (weather.uvIndex >= 6) {
    warnings.push('High UV: use sunscreen, sunglasses, and a brimmed hat.')
  }
  if (weather.visibilityKm !== undefined && weather.visibilityKm < 6) {
    warnings.push('Poor visibility: navigation may be harder than usual.')
  }
  if (remoteTrail) {
    warnings.push('Remote trail: cell service may be unreliable.')
  }

  return warnings
}

function calculateReadiness({
  checklist,
  checklistState,
  acknowledgements,
  safetyWarnings,
  enoughDaylight,
}: {
  checklist: BackpackChecklistItem[]
  checklistState: ChecklistItemState[]
  acknowledgements: PreparationAcknowledgements
  safetyWarnings: string[]
  enoughDaylight: boolean
}) {
  const checkedIds = new Set(checklistState.filter((item) => item.checked).map((item) => item.id))
  const essentials = checklist.filter((item) => item.essential)
  const completedEssentials = essentials.filter((item) => checkedIds.has(item.id)).length
  const checklistCompletionPercent = Math.round((completedEssentials / essentials.length) * 100)
  const missing: string[] = []
  let score = 0

  if (acknowledgements.weatherChecked) {
    score += 12
  } else {
    missing.push('Check the weather summary.')
  }
  if (acknowledgements.waterPlanned) {
    score += 12
  } else {
    missing.push('Confirm your water plan.')
  }
  if (acknowledgements.foodPlanned) {
    score += 10
  } else {
    missing.push('Confirm your food and snacks.')
  }
  score += Math.round(checklistCompletionPercent * 0.4)

  if (acknowledgements.offlineMapAcknowledged) {
    score += 10
  } else {
    missing.push('Download or acknowledge the offline map gap.')
  }
  if (enoughDaylight) {
    score += 8
  } else {
    missing.push('Resolve the daylight warning.')
  }
  if (safetyWarnings.length === 0 || acknowledgements.safetyWarningsAcknowledged) {
    score += 8
  } else {
    missing.push('Review and acknowledge safety warnings.')
  }

  essentials
    .filter((item) => !checkedIds.has(item.id))
    .slice(0, 4)
    .forEach((item) => missing.push(`Pack ${item.label.toLowerCase()}.`))

  return {
    score: Math.min(100, score),
    missing: [...new Set(missing)],
    checklistCompletionPercent,
  }
}

function isRemoteTrail(trail: Trail) {
  return (
    trail.difficulty === 'hard' ||
    trail.distance_km >= 10 ||
    trail.region.includes('National Park') ||
    trail.safety_notes.toLowerCase().includes('avalanche')
  )
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2
}
