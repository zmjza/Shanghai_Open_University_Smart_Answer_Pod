/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface KaidaShell {
  version: string
}

declare global {
  interface Window {
    kaidaShell?: KaidaShell
  }
}

export {}
