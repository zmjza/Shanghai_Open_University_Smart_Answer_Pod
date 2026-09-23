export function progressActionLabel(action: string, questionNo?: number, questionTotal?: number): string {
  if (!questionNo) return action
  const marker = `第 ${questionNo}/${questionTotal} 题`
  return action.includes(marker) ? action : `${action} · ${marker}`
}
