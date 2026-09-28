export interface DeviceSettings { savePhotos: boolean; dailyReminder: boolean; reportNotice: boolean }
export const defaultSettings: DeviceSettings = { savePhotos: false, dailyReminder: false, reportNotice: true }
export interface Favorite { id: string; name: string; description?: string; type: string; properties?: Record<string, string | string[]> }
export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw) } catch { return fallback }
}
export function writeLocal(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event('deviceDataUpdated')); return true } catch { return false }
}
export function getSettings(): DeviceSettings { return { ...defaultSettings, ...readLocal<Partial<DeviceSettings>>('bencao_settings', {}) } }
export function getFavorites(): Favorite[] { const items = readLocal<Favorite[]>('bencao_favorites', []); return Array.isArray(items) ? items : [] }
export function toggleFavorite(item: Favorite): boolean {
  const items = getFavorites()
  return writeLocal('bencao_favorites', items.some(old => old.id === item.id) ? items.filter(old => old.id !== item.id) : [item, ...items])
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function exportDeviceData() {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith('bencao_')) data[key] = readLocal(key, null) }
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = `本草知音备份-${localDate()}.json`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
