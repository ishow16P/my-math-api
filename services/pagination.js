export function parsePagination(query) {
  const pageNum = Math.max(1, parseInt(query.page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(query.limit) || 10))
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum }
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
