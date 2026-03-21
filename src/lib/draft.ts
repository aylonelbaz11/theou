const DRAFT_KEY = 'theou_intake_draft'

export type DraftState = {
  step: number
  scanDataUri?: string
  driverSignatureUri?: string
  receiverSignatureUri?: string
  conditionStatus: 'normal' | 'defective'
  photoDataUris: string[]
  defectDescription?: string
  supplierId?: string
  supplierName?: string
  deliveryNoteNumber?: string
  receivedByName?: string
  savedAt: string
}

export function saveDraft(draft: Omit<DraftState, 'savedAt'>): void {
  try {
    const full: DraftState = { ...draft, savedAt: new Date().toISOString() }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(full))
  } catch {}
}

export function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DraftState
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY) } catch {}
}

export function hasDraft(): boolean {
  try { return localStorage.getItem(DRAFT_KEY) !== null } catch { return false }
}
