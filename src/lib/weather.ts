import type { Trail } from '@/lib/types'

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'wind'

export interface TrailWeather {
  temperatureC: number
  feelsLikeC: number
  condition: WeatherCondition
  windKph: number
  precipitationChance: number
  uvIndex: number
  sunrise: string
  sunset: string
  visibilityKm?: number
}

export interface WeatherProvider {
  getTrailWeather(trail: Trail): Promise<TrailWeather>
}

function dayTimeIso(hours: number, minutes: number) {
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function conditionForTrail(trail: Trail): WeatherCondition {
  if (trail.slug.includes('six-glaciers')) {
    return 'snow'
  }
  if (trail.slug.includes('lake-agnes')) {
    return 'wind'
  }
  if (trail.slug.includes('johnston')) {
    return 'rain'
  }
  return 'clear'
}

export const mockWeatherProvider: WeatherProvider = {
  async getTrailWeather(trail) {
    const condition = conditionForTrail(trail)
    const alpineModifier = trail.elevation_gain_m > 350 ? -4 : 0
    const baseTemperature = trail.difficulty === 'hard' ? 8 : trail.difficulty === 'moderate' ? 12 : 16
    const windKph = condition === 'wind' ? 38 : condition === 'snow' ? 24 : trail.difficulty === 'hard' ? 22 : 12
    const precipitationChance =
      condition === 'rain' ? 68 : condition === 'snow' ? 55 : condition === 'storm' ? 82 : 18
    const temperatureC = baseTemperature + alpineModifier
    const feelsLikeC = Math.round(temperatureC - Math.max(0, windKph - 10) / 8)

    return {
      temperatureC,
      feelsLikeC,
      condition,
      windKph,
      precipitationChance,
      uvIndex: trail.slug.includes('grassi') ? 7 : trail.difficulty === 'hard' ? 5 : 4,
      sunrise: dayTimeIso(6, 18),
      sunset: dayTimeIso(20, 57),
      visibilityKm: condition === 'snow' ? 5 : condition === 'rain' ? 8 : 18,
    }
  },
}
