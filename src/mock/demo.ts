import type { CourseRow, HomeworkGroup, HomeworkRow, MachineStatus, StudentCard } from '../types/shell'

export const machine: MachineStatus = {
  cpu: '18%',
  memory: '42%',
  app: '180MB',
  browsers: 1,
  pressure: '正常',
}

export const courses: CourseRow[] = [
  { name: '社区管理实践', status: '已检测' },
  { name: '社会保障理论与实务', status: '回填中 12/40' },
  { name: '形势与政策 (1)', status: '已检测' },
  { name: '社会工作实务', status: '无作业' },
  { name: '社区矫治基础', status: '待检测' },
]

export const extractCourses: CourseRow[] = [
  { name: '社区管理实践', status: '已提取' },
  { name: '社会保障理论与实务', status: '提取中' },
  { name: '形势与政策 (1)', status: '已提取' },
  { name: '社会工作实务', status: '无作业' },
  { name: '社区矫治基础', status: '待提取' },
]

export const homeworks: HomeworkRow[] = [
  {
    name: '记分作业一',
    status: '已检测',
    questions: [
      { no: 12, stem: '盈利性…', source: '题库' },
      { no: 13, stem: '技术密集…', source: 'AI' },
      { no: 14, stem: '未知题型…', source: '空过' },
    ],
  },
  {
    name: '记分作业二',
    status: '回填中',
    questions: [
      { no: 1, stem: '客观题示例甲', source: '题库' },
      { no: 2, stem: '客观题示例乙', source: 'AI' },
    ],
  },
]

export const extractHomeworks: HomeworkRow[] = [
  {
    name: '记分作业一',
    status: '已提取',
    questions: [
      { no: 12, stem: '盈利性…', source: '题库' },
      { no: 13, stem: '技术密集…', source: '题库' },
    ],
  },
  {
    name: '记分作业二',
    status: '提取中',
    questions: [
      { no: 1, stem: '客观题示例甲', source: '题库' },
    ],
  },
]

export const homeworkGroups: HomeworkGroup[] = [
  { title: '网上记分作业', rows: homeworks },
  { title: '阶段性测验', rows: [{ name: '暂无数据', status: '无作业', questions: [] }] },
]

export const extractHomeworkGroups: HomeworkGroup[] = [
  { title: '网上记分作业', rows: extractHomeworks },
  { title: '阶段性测验', rows: [{ name: '暂无数据', status: '无作业', questions: [] }] },
]

export const students: StudentCard[] = [
  {
    name: '张同学',
    studentNo: '0000****0001',
    major: '行政管理',
    campus: '市区综合分校',
    mode: 'answer',
    accountParallel: 2,
    courseParallel: 2,
    displayMode: 'headless',
    headline: '需验证 · 等你扫码',
    bankCount: 8,
    aiCount: 2,
    extractTotals: { added: 0, merged: 0, skipped: 0, conflict: 0, failed: 0 },
    needsVerify: true,
    queued: false,
    logs: ['打开课程', '点形考作业', '读网上记分作业', '预览记分作业一'],
  },
  {
    name: '李同学',
    studentNo: '0000****0002',
    major: '社会工作',
    campus: '浦东学习中心',
    mode: 'answer',
    accountParallel: 2,
    courseParallel: 2,
    displayMode: 'headless',
    headline: '排队中 · 等待浏览器名额',
    bankCount: 0,
    aiCount: 0,
    extractTotals: { added: 0, merged: 0, skipped: 0, conflict: 0, failed: 0 },
    needsVerify: false,
    queued: true,
    logs: [],
  },
]
