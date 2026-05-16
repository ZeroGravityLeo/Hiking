import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  EMPTY_ACKNOWLEDGEMENTS,
  getDefaultChecklist,
  type PreparationAcknowledgements,
} from '@/lib/hike-preparation'
import type { ChecklistItemState } from '@/lib/types'

interface StoredPreparationState {
  checklist: ChecklistItemState[]
  acknowledgements: PreparationAcknowledgements
}

const STORAGE_PREFIX = 'wild-alberta-hike-preparation-v1'

function isAcknowledgements(value: unknown): value is PreparationAcknowledgements {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.weatherChecked === 'boolean' &&
    typeof candidate.waterPlanned === 'boolean' &&
    typeof candidate.foodPlanned === 'boolean' &&
    typeof candidate.offlineMapAcknowledged === 'boolean' &&
    typeof candidate.safetyWarningsAcknowledged === 'boolean'
  )
}

function isChecklist(value: unknown): value is ChecklistItemState[] {
  return Array.isArray(value) && value.every((item) => {
    return (
      item &&
      typeof item === 'object' &&
      typeof (item as ChecklistItemState).id === 'string' &&
      typeof (item as ChecklistItemState).checked === 'boolean'
    )
  })
}

function readStoredState(slug: string): StoredPreparationState {
  const fallback = {
    checklist: getDefaultChecklist(),
    acknowledgements: EMPTY_ACKNOWLEDGEMENTS,
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${slug}`)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as { checklist?: unknown; acknowledgements?: unknown }
    return {
      checklist: isChecklist(parsed.checklist) ? parsed.checklist : fallback.checklist,
      acknowledgements: isAcknowledgements(parsed.acknowledgements)
        ? parsed.acknowledgements
        : fallback.acknowledgements,
    }
  } catch {
    return fallback
  }
}

export function useHikePreparationState(slug: string | undefined) {
  const storageKey = useMemo(() => (slug ? `${STORAGE_PREFIX}:${slug}` : null), [slug])
  const [checklist, setChecklist] = useState<ChecklistItemState[]>(() => {
    return slug ? readStoredState(slug).checklist : getDefaultChecklist()
  })
  const [acknowledgements, setAcknowledgements] = useState<PreparationAcknowledgements>(() => {
    return slug ? readStoredState(slug).acknowledgements : EMPTY_ACKNOWLEDGEMENTS
  })

  useEffect(() => {
    if (!slug) {
      setChecklist(getDefaultChecklist())
      setAcknowledgements(EMPTY_ACKNOWLEDGEMENTS)
      return
    }

    const stored = readStoredState(slug)
    setChecklist(stored.checklist)
    setAcknowledgements(stored.acknowledgements)
  }, [slug])

  useEffect(() => {
    if (!storageKey) {
      return
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        checklist,
        acknowledgements,
      }),
    )
  }, [acknowledgements, checklist, storageKey])

  const setChecklistItem = useCallback((id: string, checked: boolean) => {
    setChecklist((current) => {
      const known = current.some((item) => item.id === id)
      if (!known) {
        return [...current, { id, checked }]
      }

      return current.map((item) => (item.id === id ? { ...item, checked } : item))
    })
  }, [])

  const setAcknowledgement = useCallback(
    (key: keyof PreparationAcknowledgements, checked: boolean) => {
      setAcknowledgements((current) => ({
        ...current,
        [key]: checked,
      }))
    },
    [],
  )

  return {
    checklist,
    acknowledgements,
    setChecklistItem,
    setAcknowledgement,
  }
}
