/**
 * Utility for persisting form data to localStorage.
 * Used to preserve form data when user gets 401 and is redirected to login.
 */

const FORM_DATA_KEY_PREFIX = 'ahadi_form_data_'

export interface FormData {
  [key: string]: unknown
}

/**
 * Save form data to localStorage
 */
export function saveFormData(formId: string, data: FormData): void {
  if (typeof localStorage === 'undefined') return
  try {
    const key = `${FORM_DATA_KEY_PREFIX}${formId}`
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn('Failed to save form data:', err)
  }
}

/**
 * Get saved form data from localStorage
 */
export function getFormData(formId: string): FormData | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const key = `${FORM_DATA_KEY_PREFIX}${formId}`
    const stored = localStorage.getItem(key)
    if (!stored) return null
    return JSON.parse(stored) as FormData
  } catch (err) {
    console.warn('Failed to get form data:', err)
    return null
  }
}

/**
 * Clear saved form data from localStorage
 */
export function clearFormData(formId: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    const key = `${FORM_DATA_KEY_PREFIX}${formId}`
    localStorage.removeItem(key)
  } catch (err) {
    console.warn('Failed to clear form data:', err)
  }
}
