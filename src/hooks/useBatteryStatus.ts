import { useEffect, useState } from 'react'

interface BatteryManager extends EventTarget {
  charging: boolean
  level: number
  addEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void
  removeEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void
}

interface BatteryNavigator extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

export interface BatteryStatus {
  supported: boolean
  charging: boolean | null
  level: number | null
  low: boolean
}

export function useBatteryStatus(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({
    supported: false,
    charging: null,
    level: null,
    low: false,
  })

  useEffect(() => {
    let battery: BatteryManager | null = null
    let mounted = true

    const update = () => {
      if (!battery || !mounted) {
        return
      }

      setStatus({
        supported: true,
        charging: battery.charging,
        level: battery.level,
        low: battery.level <= 0.2 && !battery.charging,
      })
    }

    const batteryNavigator = navigator as BatteryNavigator
    if (!batteryNavigator.getBattery) {
      return undefined
    }

    batteryNavigator
      .getBattery()
      .then((nextBattery) => {
        if (!mounted) {
          return
        }
        battery = nextBattery
        update()
        battery.addEventListener('chargingchange', update)
        battery.addEventListener('levelchange', update)
      })
      .catch(() => undefined)

    return () => {
      mounted = false
      if (battery) {
        battery.removeEventListener('chargingchange', update)
        battery.removeEventListener('levelchange', update)
      }
    }
  }, [])

  return status
}
