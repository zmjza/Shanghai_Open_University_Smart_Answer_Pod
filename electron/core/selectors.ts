/** 选择器真源：docs/page-structures 与根作答页。禁止混用两条 preview 路径。 */
export const PATH = {
  iamHost: 'iam.shou.org.cn',
  learningHost: 'learning.shou.org.cn',
  studyHost: 'l.shou.org.cn',
  scenter: '/scenter',
  homeworkList: '/study/HomeWorkNew.aspx',
  catalog: '/study/learnCatalogNew.aspx',
  assignmentPreview: '/study/assignment-preview.aspx',
  assignmentAnswer: '/study/assignment/preview.aspx',
  history: '/study/assignment/history.aspx',
  continuation: '/study/assignment/continuation.aspx',
  readpreview: '/study/assignment/readpreview.aspx',
  laboratory: '/study/laboratoryInfo/preview.aspx',
} as const

export const SEL = {
  reviewedOptions: '.e-q .e-a-g:is(.e-checking-a, .e-choice-a) ul > li.e-a',
  tabCourseList: '#tab-courseList',
  paneCourseList: '#pane-courseList',
  courseItem: '#pane-courseList .course-item',
  courseLink: '.course-title a.el-link[title="点击进入学习"]',
  courseName: '.course-title a.el-link .el-link__inner',
  collectionsPane: '#pane-collections',
  courseHomeWork: 'a#courseHomeWorkNew',
  onlineHomework: '#onlineHomework',
  phasedTest: '#phasedTest',
  noDataMarker: '：暂无数据',
  previewViewLink: 'a[href*="assignment-preview.aspx"]',
  doHomework: 'a.am-btn[href*="/study/assignment/preview.aspx"]',
  doHomeworkAccessible: 'a[href*="readpreview.aspx"]',
  continueLink: 'a[href*="continuation.aspx"]',
  historyView: '#mainContent table.am-table tbody tr a[href*="history.aspx"]',
  historyTable: '#mainContent table.am-table',
  qrDialog: '#dl_qrCodeCheck',
  qrTitle: '微信扫码验证',
  submit: '#submitHomeWork',
  confirmOk: '.xcConfirm a.sgBtn.ok',
  confirmCancel: '.xcConfirm a.sgBtn.cancel',
  questionBody: '.e-q-body',
  option: 'li.e-a',
  answerInput: 'form [name=answer]',
  doneCard: '.e-selects-g a.e-item.active',
  iamUser: 'input[placeholder*="学号"], input[placeholder*="工号"], input[placeholder*="账号"]',
  iamPass: 'input[placeholder*="密码"]',
  iamSubmit: '.content_submit, button.el-button--primary',
  iamError: '.el-alert--warning, .el-alert--error',
} as const

export function isAnswerPath(pathname: string): boolean {
  return pathname.includes('/study/assignment/preview.aspx')
}

export function isPreviewPath(pathname: string): boolean {
  return pathname.includes('/study/assignment-preview.aspx') && !pathname.includes('/study/assignment/preview.aspx')
}

export function isHomeworkListPath(pathname: string): boolean {
  return pathname.toLowerCase().includes('homeworknew.aspx')
}
