export function canClickDoHomework(verified: boolean, unverifiedClicks: number): boolean {
  if (verified) return true
  return unverifiedClicks < 1
}
