// 云函数 - 统计相关
const cloud = require('wx-server-sdk')
const { success, fail, getOpenId, checkFamilyMember } = require('../common/utils')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 统计云函数 - action 路由
 * getDashboard: 获取看板数据
 */
exports.main = async (event, context) => {
  const { action } = event
  const openid = getOpenId(event)

  if (!openid) return fail('用户未登录')

  const handlers = {
    getDashboard: handleGetDashboard
  }

  const handler = handlers[action]
  if (!handler) return fail(`未知操作: ${action}`)

  try {
    return await handler(event, openid)
  } catch (err) {
    console.error(`[stats] ${action} 错误:`, err)
    return fail(err.message || '操作失败')
  }
}

/**
 * 获取看板数据
 */
async function handleGetDashboard(event, openid) {
  const { familyId } = event
  if (!familyId) return fail('缺少家庭 ID')

  const member = await checkFamilyMember(db, familyId, openid)
  if (!member) return fail('你不是该家庭成员')

  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() || 7) + 1)
  weekStart.setHours(0, 0, 0, 0)

  // 并行查询各维度数据
  const [weekCompletedResult, totalPendingResult, memberStatsResult, categoryStatsResult, weekTrendResult] = await Promise.all([
    // 本周已完成
    db.collection('todos')
      .where({
        familyId,
        status: 'completed',
        completedAt: _.gte(weekStart)
      })
      .count(),

    // 待完成总数
    db.collection('todos')
      .where({ familyId, status: 'pending' })
      .count(),

    // 成员统计（需获取成员列表后再分别查询）
    getMemberStats(familyId),

    // 分类统计
    getCategoryStats(familyId),

    // 周趋势
    getWeekTrend(familyId)
  ])

  const weekCompleted = weekCompletedResult.total
  const totalPending = totalPendingResult.total
  const completionRate = weekCompleted + totalPending > 0
    ? Math.round((weekCompleted / (weekCompleted + totalPending)) * 100)
    : 0

  return success({
    overview: {
      weekCompleted,
      totalPending,
      completionRate
    },
    memberStats: memberStatsResult,
    categoryStats: categoryStatsResult,
    weekTrend: weekTrendResult
  })
}

/**
 * 获取成员贡献统计
 */
async function getMemberStats(familyId) {
  const { data: family } = await db.collection('families').doc(familyId).get()
  if (!family) return []

  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() || 7) + 1)
  weekStart.setHours(0, 0, 0, 0)

  const memberStats = []
  const colors = ['#007AFF', '#34C759', '#FF9500', '#5856D6', '#FF2D55', '#5AC8FA']

  for (let i = 0; i < family.members.length; i++) {
    const m = family.members[i]

    // 获取用户信息
    const { data: users } = await db.collection('users')
      .where({ _openid: m.openid })
      .get()
    const user = users[0] || {}

    // 本周完成数
    const { total: completedCount } = await db.collection('todos')
      .where({
        familyId,
        assigneeId: m.openid,
        status: 'completed',
        completedAt: _.gte(weekStart)
      })
      .count()

    memberStats.push({
      _id: m.openid,
      _openid: m.openid,
      nickName: user.nickName || '未知用户',
      avatarUrl: user.avatarUrl || '',
      role: m.role,
      completedCount,
      color: colors[i % colors.length]
    })
  }

  // 计算百分比
  const maxCount = Math.max(...memberStats.map(m => m.completedCount), 1)
  memberStats.forEach(m => {
    m.percentage = Math.round((m.completedCount / maxCount) * 100)
  })

  // 按完成数排序
  memberStats.sort((a, b) => b.completedCount - a.completedCount)

  return memberStats
}

/**
 * 获取分类统计
 */
async function getCategoryStats(familyId) {
  const { data: categories } = await db.collection('categories')
    .where({ familyId })
    .get()

  const stats = []
  for (const cat of categories) {
    const { total } = await db.collection('todos')
      .where({ familyId, categoryId: cat._id })
      .count()

    if (total > 0) {
      stats.push({
        name: cat.name,
        value: total,
        color: cat.color
      })
    }
  }

  return stats
}

/**
 * 获取周趋势数据
 */
async function getWeekTrend(familyId) {
  const now = new Date()
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const trend = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const dayIndex = date.getDay() || 7

    const { total } = await db.collection('todos')
      .where({
        familyId,
        status: 'completed',
        completedAt: _.gte(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
          .and(_.lt(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)))
      })
      .count()

    trend.push({
      label: days[dayIndex - 1],
      value: total
    })
  }

  return trend
}
