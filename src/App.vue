<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useKaida } from './useKaida'
import HomeView from './views/HomeView.vue'
import SettingsView from './views/SettingsView.vue'
import BankView from './views/BankView.vue'
import AccountsView from './views/AccountsView.vue'
import type { PageId } from './types/shell'
import logoUrl from './assets/logo.svg'
import { version as appVersion } from '../package.json'

const page = ref<PageId>('home')
const { snap } = useKaida()
const machine = computed(() => snap.value?.machine)
type UpdateState = { phase: 'unavailable' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'error'; version?: string; message?: string; progress?: number }
const updateState = ref<UpdateState>({ phase: 'unavailable' })
const updateOpen = ref(false)
const updateNotice = ref('')
const updateBusy = computed(() => ['checking', 'downloading', 'installing'].includes(updateState.value.phase))
let offUpdate: (() => void) | undefined
let noticeTimer: ReturnType<typeof setTimeout> | undefined
function notifyUpdate(message: string) {
  updateNotice.value = message
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { updateNotice.value = '' }, 4500)
}
function minimizeWindow() { void window.kaida?.minimizeWindow() }
function maximizeWindow() { void window.kaida?.maximizeWindow() }
function closeWindow() { void window.kaida?.closeWindow() }
async function checkUpdates() {
  if (updateBusy.value) return
  updateOpen.value = false
  updateNotice.value = ''
  try {
    const result = await window.kaida?.checkForUpdates()
    if (!result) return
    updateState.value = result
    updateOpen.value = ['available', 'downloaded', 'error'].includes(result.phase)
    if (result.phase === 'unavailable') notifyUpdate(result.message || '当前已是最新版本')
  } catch (error) {
    updateState.value = { phase: 'error', message: error instanceof Error ? error.message : '检查更新失败' }
    updateOpen.value = true
  }
}
async function downloadUpdate() {
  updateState.value = await window.kaida?.downloadUpdate() || updateState.value
}
async function installUpdate() {
  updateState.value = await window.kaida?.installUpdate() || updateState.value
}
onMounted(async () => {
  offUpdate = window.kaida?.onUpdateStatus((state) => {
    updateState.value = state as UpdateState
    if (['available', 'downloaded'].includes(updateState.value.phase)) updateOpen.value = true
  })
  updateState.value = await window.kaida?.updateState() || updateState.value
})
onUnmounted(() => { offUpdate?.(); if (noticeTimer) clearTimeout(noticeTimer) })

function go(next: PageId) {
  // TODO(ui-shell) 仅壳内切页
  page.value = next
}
</script>

<template>
  <header class="app-shell-header fixed inset-x-0 top-0 z-[200] h-16 overflow-x-auto border-b border-indigo-100 bg-white/95 px-5 shadow-sm backdrop-blur-md select-none sm:px-8" style="-webkit-app-region: drag">
    <div class="mx-auto grid h-full min-w-max max-w-[1600px] grid-cols-[minmax(250px,1fr)_auto] items-center gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white" aria-label="开大智达舱 Logo">
          <img class="h-14 w-14 max-w-none object-contain" :src="logoUrl" alt="开大智达舱 Logo">
        </div>
        <div class="min-w-0 leading-tight"><div class="truncate text-[16px] font-bold tracking-tight text-slate-900">开大智达舱</div><div class="truncate text-[11px] font-medium tracking-wide text-slate-500">多任务智能答题工作台</div></div>
        <div class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[10px] text-slate-500" title="实时系统状态"><span>CPU {{ machine?.cpu || '--' }}</span><span>·</span><span>内存 {{ machine?.memory || '--' }}</span><span>·</span><span>本软件 {{ machine?.app || '--' }}</span><span>·</span><span>浏览器 {{ machine?.browsers ?? 0 }}</span><span>·</span><span class="flex items-center gap-1 font-sans font-semibold text-slate-700"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>压力{{ machine?.pressure || '--' }}</span></div>
      </div>
      <div class="flex min-w-0 items-center justify-end gap-3" style="-webkit-app-region: no-drag">
        <nav class="flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/60 p-1">
          <button type="button" :class="page === 'home' ? 'bg-[#4F46E5] text-white' : 'text-slate-600 hover:bg-white'" class="tactile-btn rounded-full px-4 py-1.5 text-xs font-semibold" @click="go('home')">工作台</button>
          <button type="button" :class="page === 'bank' ? 'bg-[#4F46E5] text-white' : 'text-slate-600 hover:bg-white'" class="tactile-btn rounded-full px-4 py-1.5 text-xs font-semibold" @click="go('bank')">题库</button>
          <button type="button" :class="page === 'accounts' ? 'bg-[#4F46E5] text-white' : 'text-slate-600 hover:bg-white'" class="tactile-btn rounded-full px-4 py-1.5 text-xs font-semibold" @click="go('accounts')">学生账号</button>
          <button type="button" :class="page === 'settings' ? 'bg-[#4F46E5] text-white' : 'text-slate-600 hover:bg-white'" class="tactile-btn rounded-full px-4 py-1.5 text-xs font-semibold" @click="go('settings')">设置</button>
        </nav>
        <div class="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm">
          <span class="ml-1 rounded-lg border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-2.5 py-1 font-mono text-[11px] font-bold tracking-tight text-indigo-700" :aria-label="`当前版本 ${appVersion}`">v{{ appVersion }}</span>
          <span class="h-5 w-px bg-slate-200" aria-hidden="true"></span>
          <button class="tactile-btn group flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-[#4F46E5] disabled:opacity-60" :title="updateState.phase === 'checking' ? '正在检查更新' : '检查更新'" :aria-label="updateState.phase === 'checking' ? '正在检查更新' : '检查更新'" :disabled="updateBusy" type="button" @click="checkUpdates"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px]" :class="{ 'animate-spin': updateState.phase === 'checking' }" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0-14.8-4.4L3 9"></path><path d="M3 4.5V9h4.5"></path><path d="M4 13a8.1 8.1 0 0 0 14.8 4.4L21 15"></path><path d="M21 19.5V15h-4.5"></path></svg></button>
          <span class="h-5 w-px bg-slate-200" aria-hidden="true"></span>
          <button class="tactile-btn group flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-[#4F46E5]" title="最大化" aria-label="最大化" type="button" @click="maximizeWindow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="h-[17px] w-[17px]" aria-hidden="true"><rect x="5.5" y="5.5" width="13" height="13" rx="1.5"></rect></svg></button>
          <button class="tactile-btn group flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-[#4F46E5]" title="最小化" aria-label="最小化" type="button" @click="minimizeWindow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" class="h-[17px] w-[17px]" aria-hidden="true"><path d="M5 12h14"></path></svg></button>
          <button class="tactile-btn group flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600" title="关闭程序" aria-label="关闭程序" type="button" @click="closeWindow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" class="h-[17px] w-[17px]" aria-hidden="true"><path d="M6.5 6.5l11 11"></path><path d="M17.5 6.5l-11 11"></path></svg></button>
        </div>
      </div>
    </div>
  </header>
 <HomeView v-if="page === 'home'" @go="go" />
  <BankView v-else-if="page === 'bank'" @go="go" />
 <AccountsView v-else-if="page === 'accounts'" @go="go" />
 <SettingsView v-else @go="go" />
  <div v-if="updateNotice" role="status" aria-live="polite" class="fixed right-6 top-20 z-[310] flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-xl">
    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600" aria-hidden="true">✓</span>
    <span>{{ updateNotice }}</span>
  </div>
  <div v-if="updateOpen" class="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/35 p-6" @click.self="!updateBusy && (updateOpen = false)">
    <section class="w-full max-w-lg overflow-hidden rounded-[28px] border border-indigo-100 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div class="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-7 pb-7 pt-6">
        <div class="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-indigo-100/70 blur-2xl" aria-hidden="true"></div>
        <div class="relative flex items-start justify-between gap-4">
          <span class="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700">{{ updateState.phase === 'error' ? '检查失败' : '全新版本' }}</span>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-100 bg-white text-xl text-slate-500 hover:text-slate-800 disabled:opacity-50" aria-label="关闭更新弹窗" :disabled="updateBusy" @click="updateOpen = false">×</button>
        </div>
        <div class="relative mt-4 flex items-center justify-between gap-5">
          <div><h2 id="update-title" class="text-[25px] font-bold tracking-tight text-slate-900">{{ updateState.phase === 'error' ? '更新检查遇到问题' : `发现新版本 ${updateState.version}` }}</h2><p class="mt-2 text-sm text-slate-500">开大智达舱 · 稳妥更新，继续前行</p></div>
          <img :src="logoUrl" alt="开大智达舱 Logo" class="h-24 w-24 shrink-0 rounded-3xl bg-white p-2 shadow-lg shadow-indigo-100">
        </div>
      </div>
      <div class="px-7 pb-7 pt-5">
        <div v-if="updateState.version" class="flex items-center gap-3 text-sm font-semibold"><span class="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-500">v{{ appVersion }}</span><span class="text-slate-300">→</span><span class="rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700">v{{ updateState.version }}</span></div>
        <div class="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-4"><p class="text-sm font-bold text-slate-900">{{ updateState.phase === 'error' ? '请重试检查' : updateState.phase === 'downloaded' ? '下载完成' : updateState.phase === 'downloading' ? '正在下载更新' : '新版本已准备就绪' }}</p><p role="status" class="mt-1.5 text-xs leading-5 text-slate-600">{{ updateState.message || (updateState.phase === 'downloaded' ? (snap?.running ? '任务运行中，停止任务后即可安装。' : '可以安装并重启应用。') : updateState.phase === 'downloading' ? '正在从 GitHub 下载更新文件，请稍候。' : '下载完成后由你决定何时安装。') }}</p><div v-if="updateState.phase === 'downloading'" class="mt-3"><div class="h-2 overflow-hidden rounded-full bg-indigo-100" role="progressbar" :aria-valuenow="updateState.progress ?? 0" aria-valuemin="0" aria-valuemax="100"><div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-300" :style="{ width: `${updateState.progress ?? 0}%` }"></div></div><div class="mt-1 text-right text-[11px] font-semibold text-indigo-700">{{ updateState.progress ?? 0 }}%</div></div></div>
        <div class="mt-6 flex flex-wrap gap-2"><button v-if="!updateBusy" type="button" class="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50" @click="updateOpen = false">稍后再说</button><button v-if="updateState.phase === 'available'" type="button" class="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4338CA]" @click="downloadUpdate">下载更新</button><button v-else-if="updateState.phase === 'downloaded'" type="button" class="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50" :disabled="Boolean(snap?.running)" @click="installUpdate">{{ snap?.running ? '任务运行中' : '安装并重启' }}</button><button v-else-if="updateState.phase === 'error'" type="button" class="rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white" @click="checkUpdates">重新检查</button><span v-else-if="updateBusy" class="flex items-center gap-2 text-xs font-semibold text-indigo-600"><span class="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></span>{{ updateState.phase === 'downloading' ? '正在下载…' : '正在安装…' }}</span></div>
      </div>
    </section>
  </div>
</template>
