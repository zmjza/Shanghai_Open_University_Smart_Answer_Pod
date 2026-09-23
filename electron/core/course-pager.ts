export function pageCountForCourses<T>(courses: T[], pageSize: number): number {
  const size = Math.max(1, Math.floor(pageSize))
  return Math.max(1, Math.ceil(courses.length / size))
}

export function pageSlice<T>(courses: T[], pageSize: number, page: number): T[] {
  const size = Math.max(1, Math.floor(pageSize))
  const current = Math.min(Math.max(1, Math.floor(page)), pageCountForCourses(courses, size))
  return courses.slice((current - 1) * size, current * size)
}

export function pageForCourse(courses: { name: string }[] | string[], pageSize: number, name: string): number {
  const index = courses.findIndex((course) => (typeof course === 'string' ? course : course.name) === name)
  return index < 0 ? 1 : Math.floor(index / Math.max(1, Math.floor(pageSize))) + 1
}
