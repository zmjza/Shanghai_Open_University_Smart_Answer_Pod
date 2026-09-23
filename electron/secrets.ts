import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export function assertNoSecretKey(value: string) {
  const v = String(value || '')
  if (/sb_secret/i.test(v) || /service_role/i.test(v)) {
    throw new Error('禁止使用 Supabase Secret / service role')
  }
}

export function encryptToFile(filePath: string, json: unknown): { ok: boolean; error?: string } {
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: '本机加密不可用，拒绝写明文' }
  }
  try {
    const buf = safeStorage.encryptString(JSON.stringify(json))
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, buf)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '加密失败' }
  }
}

export function decryptFromFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback
  if (!safeStorage.isEncryptionAvailable()) return fallback
  try {
    const raw = readFileSync(filePath)
    const text = safeStorage.decryptString(raw)
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}
