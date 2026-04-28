/**
 * 通用工具函数
 */

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期对象/时间戳/日期字符串
 * @param {string} format - 格式化模板 YYYY-MM-DD HH:mm
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 相对时间描述
 * @param {Date|string|number} date
 * @returns {string} 如"刚刚"、"5分钟前"、"今天"、"明天"、"3天后"
 */
function relativeTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const absDiff = Math.abs(diff)

  // 今天/明天/昨天
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((d.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays === 0) {
    if (absDiff < 60 * 1000) return '刚刚'
    if (absDiff < 60 * 60 * 1000) return `${Math.floor(absDiff / (60 * 1000))}分钟前`
    return `今天 ${formatDate(d, 'HH:mm')}`
  }
  if (diffDays === 1) return `明天 ${formatDate(d, 'HH:mm')}`
  if (diffDays === -1) return `昨天 ${formatDate(d, 'HH:mm')}`
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}天前`
  return formatDate(d, 'MM-DD')
}

/**
 * 判断是否为今天
 * @param {Date|string|number} date
 * @returns {boolean}
 */
function isToday(date) {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

/**
 * 判断是否过期
 * @param {Date|string|number} date
 * @returns {boolean}
 */
function isOverdue(date) {
  if (!date) return false
  return new Date(date).getTime() < Date.now()
}

/**
 * 生成随机邀请码（6位大写字母+数字）
 * @returns {string}
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去除容易混淆的字符
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * 防抖函数
 * @param {Function} fn - 目标函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 目标函数
 * @param {number} interval - 间隔时间(ms)
 * @returns {Function}
 */
function throttle(fn, interval = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 获取本周起止日期
 * @returns {{ start: Date, end: Date }}
 */
function getWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day))
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

module.exports = {
  formatDate,
  relativeTime,
  isToday,
  isOverdue,
  generateInviteCode,
  debounce,
  throttle,
  getWeekRange,
  genId
}
