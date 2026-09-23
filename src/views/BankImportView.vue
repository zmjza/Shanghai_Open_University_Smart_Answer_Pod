<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PageId } from '../types/shell'
import { useKaida } from '../useKaida'

const emit = defineEmits<{ go: [PageId] }>()
function go(id: PageId) {
  // TODO(ui-shell) 仅壳内切页
  emit('go', id)
}

const fileName = ref('尚未选择 JSON')
const fileSize = ref(0)
const durationMs = ref(0)
const importing = ref(false)
const imported = ref(false)
const error = ref('')
const result = ref({ added: 0, merged: 0, conflict: 0, skipped: 0, failed: 0 })
const { snap } = useKaida()
const machine = computed(() => snap.value?.machine || { cpu: '--', memory: '--', app: '--', browsers: 0, pressure: '等待主进程' })
const total = computed(() => Object.values(result.value).reduce((sum, value) => sum + value, 0))
const hasFailures = computed(() => result.value.failed > 0)
const importStatus = computed(() => {
  if (error.value) return error.value
  if (importing.value) return '正在导入题库…'
  if (!imported.value) return '等待导入题库'
  return hasFailures.value
    ? `导入结束：存在 ${result.value.failed} 题写入失败 · 耗时 ${durationMs.value}ms`
    : `导入完成：已更新 Supabase 云端题库 · 耗时 ${durationMs.value}ms`
})
function percent(value: number) {
  return total.value ? ((value / total.value) * 100).toFixed(1) + '%' : '0%'
}

function pick() {
  void runImport()
}
function onDrop(_e: DragEvent) {
  void runImport()
}
async function runImport() {
  importing.value = true
  imported.value = false
  error.value = ''
  durationMs.value = 0
  result.value = { added: 0, merged: 0, conflict: 0, skipped: 0, failed: 0 }
  try {
    const r = await window.kaida?.importJson()
    if (!r || !r.ok) {
      error.value = r?.error || '先选择 JSON'
      return
    }
    error.value = ''
    fileName.value = r.fileName || '已选择 JSON'
    fileSize.value = r.fileSize || 0
    durationMs.value = r.durationMs || 0
    result.value = { added: r.added || 0, merged: r.merged || 0, conflict: r.conflict || 0, skipped: r.skipped || 0, failed: r.failed || 0 }
    imported.value = true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '题库导入失败'
  } finally {
    importing.value = false
  }
}

function formatBytes(size: number) {
  return size > 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + ' MB' : size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B'
}
</script>

<template>
  <div class="bg-[#F8FAFC] font-sans text-zinc-900 antialiased selection:bg-[#4F46E5] selection:text-white h-screen w-full flex flex-col justify-between relative overflow-hidden select-none">
<!-- Minimal Floating Header -->
<header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
<div class="h-14 w-full max-w-[1360px] mx-auto px-6 lg:px-10 flex items-center justify-between">
<div class="flex items-center gap-6">
<div class="flex items-center gap-2.5">
<span class="w-2.5 h-2.5 rounded-full bg-[#4F46E5] ring-4 ring-indigo-100"></span>
<span class="font-semibold text-[15px] text-zinc-900 tracking-tight select-none">开大自动答题桌面端</span>
</div>
<div class="hidden xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-zinc-200 text-zinc-500 font-mono text-[12px] select-none shadow-xs">
<span class="">CPU {{ machine.cpu }}</span>
<span class="text-zinc-300">·</span>
<span class="">内存 {{ machine.memory }}</span>
<span class="text-zinc-300">·</span>
<span class="">本软件 {{ machine.app }}</span>
<span class="text-zinc-300">·</span>
<span class="">浏览器 {{ machine.browsers }}</span>
<span class="text-zinc-300">·</span>
<span class="flex items-center gap-1.5 text-zinc-800 font-medium">
<span class="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot"></span>{{ machine.pressure }}
          </span>
</div>
</div>
<div class="flex items-center gap-5">
<nav class="flex items-center gap-1.5 bg-zinc-100/90 p-1 rounded-full">
<a href="#" @click.prevent="go('home')" class="px-3.5 py-1 rounded-full text-[13px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-white/60 transition-all duration-150">工作台</a>
<a href="#" @click.prevent="go('bank')" class="px-3.5 py-1 rounded-full text-[13px] font-semibold bg-[#4F46E5] text-white shadow-sm transition-all duration-150 cursor-default">题库</a>
<a href="#" @click.prevent="go('accounts')" class="px-3.5 py-1 rounded-full text-[13px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-white/60 transition-all duration-150">学生账号</a>
<a href="#" @click.prevent="go('settings')" class="px-3.5 py-1 rounded-full text-[13px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-white/60 transition-all duration-150">设置</a>
</nav>
</div>
</div>
</header>
<!-- Main Canvas: Neo-Minimal Centered Card -->
<main class="w-full flex-1 flex flex-col items-center justify-center pt-14 pb-4 px-4 z-10">
<div class="w-full max-w-[640px] flex flex-col items-center my-auto">
<div class="w-full bg-[#FFFFFF] rounded-3xl shadow-luminous border border-zinc-200/80 p-8 sm:p-9 flex flex-col gap-6 relative overflow-hidden transition-all duration-300 animate-fadeInUp">
<!-- File Selection Box (Interactive Dropzone) -->
<div class="flex items-center justify-between p-3.5 pl-4 rounded-2xl bg-[#F8FAFC] border-2 border-dashed border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all duration-200 cursor-pointer group" @click="pick" @dragover.prevent @drop.prevent="onDrop" id="dropzone">
<div class="flex items-center gap-3.5 min-w-0">
<div class="w-11 h-11 rounded-2xl bg-white border border-zinc-200 group-hover:border-indigo-200 flex items-center justify-center shadow-xs text-[#4F46E5] shrink-0 transition-transform duration-200 group-hover:scale-105">
<span class="material-symbols-outlined text-[24px]">description</span>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-2">
<span class="font-semibold text-[15px] text-zinc-900 truncate tracking-tight font-mono">{{ fileName }}</span>
<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[#4F46E5] font-medium font-mono text-[11px]">{{ fileName === '尚未选择 JSON' ? '等待选择' : '有效 · UTF-8 · ' + formatBytes(fileSize) }}</span>
</div>
<span class="font-mono text-[12px] text-zinc-500 mt-0.5">{{ error || (importing ? '正在导入并去重…' : fileName === '尚未选择 JSON' ? '等待选择题库文件' : '本地合法题库文件已挂载 · 支持点击重选或拖拽') }}</span>
</div>
</div>
<button class="shrink-0 px-4 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[12px] font-medium shadow-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:border-zinc-400" id="reselect-btn" @click="pick" type="button">重新选择</button>
</div>
<!-- Primary Action Button -->
<div>
<button class="btn-import w-full h-13 py-3.5 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.985] text-white font-semibold text-[15px] sm:text-[16px] tracking-wide shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35)] hover:shadow-[0_12px_28px_-4px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer" id="import-btn" :disabled="importing" @click="runImport" type="button">
<span class="material-symbols-outlined text-[20px] text-white import-icon transition-transform">file_download</span>
<span id="btn-text">{{ importing ? '正在导入…' : '开始导入' }}</span>
</button>
</div>
<!-- Status Banner -->
<div class="flex items-center justify-between px-4 py-3 rounded-full border text-zinc-900 transition-all duration-300" :class="hasFailures || error ? 'bg-rose-50/80 border-rose-200' : 'bg-indigo-50/70 border-indigo-100'" id="status-banner">
<div class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[20px] transition-transform duration-300" :class="hasFailures || error ? 'text-rose-600' : 'text-[#4F46E5]'" id="status-icon">{{ hasFailures || error ? 'error' : 'check_circle' }}</span>
<span class="text-[13px] font-semibold text-zinc-900 tracking-tight" id="status-text">{{ importStatus }}</span>
</div>
<span class="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white border shadow-xs" :class="hasFailures || error ? 'text-rose-600 border-rose-200' : 'text-[#4F46E5] border-indigo-200'">{{ error ? '导入失败' : imported ? (hasFailures ? '存在写入失败' : '已写入 Supabase 云端题库') : '等待导入' }}</span>
</div>
<!-- Four Core Metrics Cards -->
<div class="flex flex-col gap-3.5">
<div class="grid grid-cols-5 gap-2.5">
<!-- 新增 12 题 -->
<div class="flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl bg-[#F8FAFC] border border-zinc-200 hover:border-indigo-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group cursor-default">
<div class="flex items-center gap-1.5 mb-1">
<span class="w-1.5 h-1.5 rounded-full bg-[#4F46E5] group-hover:scale-125 transition-transform"></span>
<span class="text-[12px] text-zinc-800 font-medium">新增</span>
</div>
<div class="flex items-baseline gap-0.5 my-0.5">
<span id="metric-added" class="font-mono text-[24px] font-bold text-[#4F46E5] tracking-tight leading-tight">{{ result.added }}</span>
<span class="text-[11px] text-zinc-500 font-normal">题</span>
</div>
<span class="font-mono text-[10px] text-[#4F46E5] font-medium bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full mt-0.5 truncate group-hover:bg-indigo-100/70 transition-colors">独立题干</span>
</div>
<!-- 合并 4 题 -->
<div class="flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl bg-[#F8FAFC] border border-zinc-200 hover:border-indigo-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group cursor-default">
<div class="flex items-center gap-1.5 mb-1">
<span class="w-1.5 h-1.5 rounded-full bg-[#6366F1] group-hover:scale-125 transition-transform"></span>
<span class="text-[12px] text-zinc-700 font-medium">合并</span>
</div>
<div class="flex items-baseline gap-0.5 my-0.5">
<span id="metric-merged" class="font-mono text-[24px] font-bold text-zinc-900 tracking-tight leading-tight">{{ result.merged }}</span>
<span class="text-[11px] text-zinc-500 font-normal">题</span>
</div>
<span class="font-mono text-[10px] text-[#6366F1] font-medium bg-indigo-50/60 border border-indigo-100 px-1.5 py-0.5 rounded-full mt-0.5 truncate group-hover:bg-indigo-100/70 transition-colors">打乱选项集合并</span>
</div>
<!-- 冲突 1 题 -->
<div class="flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl bg-[#F8FAFC] border border-zinc-200 hover:border-amber-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group cursor-default">
<div class="flex items-center gap-1.5 mb-1">
<span class="w-1.5 h-1.5 rounded-full bg-[#F59E0B] pulse-dot"></span>
<span class="text-[12px] text-zinc-700 font-medium">冲突</span>
</div>
<div class="flex items-baseline gap-0.5 my-0.5">
<span id="metric-conflict" class="font-mono text-[24px] font-bold text-zinc-900 tracking-tight leading-tight">{{ result.conflict }}</span>
<span class="text-[11px] text-zinc-500 font-normal">题</span>
</div>
<span class="font-mono text-[10px] text-[#D97706] font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mt-0.5 truncate group-hover:bg-amber-100/70 transition-colors">需人工复核</span>
</div>
<!-- 缺字段跳过 2 题 -->
<div class="flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl bg-[#F8FAFC] border border-zinc-200 hover:border-zinc-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group cursor-default">
<div class="flex items-center gap-1.5 mb-1">
<span class="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:scale-125 transition-transform"></span>
<span class="text-[12px] text-zinc-700 font-medium">缺字段跳过</span>
</div>
<div class="flex items-baseline gap-0.5 my-0.5">
<span id="metric-skipped" class="font-mono text-[24px] font-bold text-zinc-900 tracking-tight leading-tight">{{ result.skipped }}</span>
<span class="text-[11px] text-zinc-500 font-normal">题</span>
</div>
<span class="font-mono text-[10px] text-zinc-600 font-medium bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full mt-0.5 truncate group-hover:bg-zinc-200/70 transition-colors">格式缺失跳过</span>
</div>
<div class="flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl bg-[#FFF7F7] border border-rose-200 hover:border-rose-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group cursor-default">
<div class="flex items-center gap-1.5 mb-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span><span class="text-[12px] text-zinc-700 font-medium">写入失败</span></div>
<div class="flex items-baseline gap-0.5 my-0.5"><span id="metric-failed" class="font-mono text-[24px] font-bold text-rose-600 tracking-tight leading-tight">{{ result.failed }}</span><span class="text-[11px] text-zinc-500 font-normal">题</span></div>
<span class="font-mono text-[10px] text-rose-600 font-medium bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full mt-0.5 truncate">请求或回读失败</span>
</div>
</div>
<!-- Segmented Import Progress Bar with Continuous Shimmer Wave -->
<div class="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden flex p-0.5 gap-1 border border-zinc-200/60 shimmer-track" id="progress-bar-container">
<div class="bg-[#4F46E5] h-full rounded-full transition-all duration-700" id="bar-added" :style="{ width: percent(result.added) }" :title="'新增 ' + percent(result.added)"></div>
<div class="bg-[#6366F1] h-full rounded-full transition-all duration-700" id="bar-merged" :style="{ width: percent(result.merged) }" :title="'合并 ' + percent(result.merged)"></div>
<div class="bg-[#F59E0B] h-full rounded-full transition-all duration-700" id="bar-conflict" :style="{ width: percent(result.conflict) }" :title="'冲突 ' + percent(result.conflict)"></div>
<div class="bg-zinc-300 h-full rounded-full transition-all duration-700" id="bar-skipped" :style="{ width: percent(result.skipped) }" :title="'缺字段跳过 ' + percent(result.skipped)"></div>
<div class="bg-rose-500 h-full rounded-full transition-all duration-700" id="bar-failed" :style="{ width: percent(result.failed) }" :title="'写入失败 ' + percent(result.failed)"></div>
</div>
</div>
<!-- Footer Helper Info -->
<div class="flex flex-col gap-2 pt-1 border-t border-zinc-100">
<div class="flex items-center justify-between text-zinc-500 text-[12px]">
<div class="flex items-center gap-1.5">
<span class="material-symbols-outlined text-[16px] text-[#4F46E5] shrink-0">info</span>
<span>去重机制：按题干加排序后选项集合，选项顺序打乱仍合并 · 仅支持本地合法 JSON 标准格式</span>
</div>
<span class="font-mono text-[11px] text-zinc-600 font-medium bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full shrink-0">v2.4 合并策略</span>
</div>
<div class="flex items-center gap-1.5 text-[11px] text-zinc-400 pl-5">
<span>·</span>
<span>从开大自动上号抽题不在本页，请回到工作台学生卡切换「提取题库」模式。</span>
</div>
</div>
</div>
</div>
</main>
  </div>
</template>
