export type BrowserBounds = {
  windowState?: string
  left?: number
  top?: number
  width?: number
  height?: number
}

export function browserBoundsVisible(bounds: BrowserBounds) {
  if (bounds.windowState === 'minimized') return false
  const right = Number(bounds.left || 0) + Number(bounds.width || 1)
  const bottom = Number(bounds.top || 0) + Number(bounds.height || 1)
  return right > 0 && bottom > 0
}

export function browserVisibilityFromNativeState(hidden: boolean | null, bounds: BrowserBounds) {
  return hidden === null ? browserBoundsVisible(bounds) : !hidden
}
