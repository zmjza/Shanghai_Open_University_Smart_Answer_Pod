export function qrDialogLooksOpen(info: {
  display: string
  visibility: string
  opacity: string
  width: number
  height: number
  text: string
  qrVisible: boolean
  top?: number
  left?: number
  vw?: number
  vh?: number
}): boolean {
  if (info.display === 'none' || info.visibility === 'hidden' || info.opacity === '0' || info.width <= 2 || info.height <= 2) return false
  if (info.vw != null && info.vh != null && info.top != null && info.left != null) {
    if (info.top + info.height <= 0 || info.left + info.width <= 0 || info.top >= info.vh || info.left >= info.vw) return false
  }
  const t = info.text.replace(/\s+/g, '')
  if (t.includes('微信扫码验证成功') || (t.includes('验证成功') && t.includes('进入作答'))) return false
  return t.includes('微信扫码验证') || t.includes('请使用微信扫码') || (t.includes('未扫码') && info.qrVisible)
}

export type QrSnapshotIdentity = {
  localId: string
  courseName: string
  homeworkName: string
  version: number
}

export type QrSnapshot = QrSnapshotIdentity & {
  image: string
  capturedAt: string
  appVersion: string
  status: '等待扫码'
}

export function qrSnapshotMatches(snapshot: QrSnapshotIdentity, expected: QrSnapshotIdentity): boolean {
  return snapshot.localId === expected.localId &&
    snapshot.courseName === expected.courseName &&
    snapshot.homeworkName === expected.homeworkName &&
    snapshot.version === expected.version
}

export function verificationFailure(
  kind: 'homework' | 'portal',
  state: { qrOpen: boolean; portalReady: boolean },
): string | null {
  if (kind === 'portal') return state.portalReady ? null : '登录验证尚未完成'
  return state.qrOpen ? '作业二维码仍在，请扫码后再确认' : null
}
