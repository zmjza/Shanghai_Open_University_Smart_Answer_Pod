export type RuntimeLogLevel = 'info' | 'running' | 'success' | 'warning' | 'error'

export function runtimeLogLevel(action: string): RuntimeLogLevel {
  if (/失败|错误|异常|停止/.test(action)) return 'error'
  if (/等待|跳过|未完成|需验证|限流/.test(action)) return 'warning'
  if (/完成|成功|已提交|已登录|已检测/.test(action)) return 'success'
  if (/正在|读取|检测|答题|回填|提交|校对|提取|启动/.test(action)) return 'running'
  return 'info'
}

export function sanitizeRuntimeLogText(text: string): string {
  return String(text)
    .replace(/https?:\/\/\S+/gi, '[地址已隐藏]')
    .replace(/(?:xhtoken|token|cookie|password|secret|key)\s*[=:]\s*[^\s·；]+/gi, '[敏感信息已隐藏]')
    .replace(/(?:sk|sb_(?:secret|publishable))[-_][A-Za-z0-9_-]+/gi, '[密钥已隐藏]')
    .trim()
}
