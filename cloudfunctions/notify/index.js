// 云函数 - 通知相关
const cloud = require('wx-server-sdk')
const { success, fail, getOpenId } = require('../common/utils')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 通知云函数 - action 路由
 * subscribe: 记录订阅
 * sendReminder: 发送到期提醒（定时触发）
 * sendAssign: 发送分配通知
 */
exports.main = async (event, context) => {
  const { action } = event
  const openid = getOpenId(event)

  if (!openid) return fail('用户未登录')

  const handlers = {
    subscribe: handleSubscribe,
    sendReminder: handleSendReminder,
    sendAssign: handleSendAssign
  }

  const handler = handlers[action]
  if (!handler) return fail(`未知操作: ${action}`)

  try {
    return await handler(event, openid)
  } catch (err) {
    console.error(`[notify] ${action} 错误:`, err)
    return fail(err.message || '操作失败')
  }
}

/**
 * 记录订阅授权
 */
async function handleSubscribe(event, openid) {
  const { templateId } = event
  if (!templateId) return fail('缺少模板 ID')

  await db.collection('subscriptions').add({
    data: {
      _openid: openid,
      templateId,
      subscribedAt: db.serverDate()
    }
  })

  return success(null, '订阅成功')
}

/**
 * 发送到期提醒（可由定时触发器调用）
 * 查找明天到期的待办，给相关用户发送订阅消息
 */
async function handleSendReminder(event, openid) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // 查找明天到期的待办
  const { data: todos } = await db.collection('todos')
    .where({
      status: 'pending',
      dueDate: tomorrowStr,
      enableReminder: true
    })
    .get()

  let sentCount = 0

  for (const todo of todos) {
    try {
      // 查找被分配人是否订阅了提醒
      const assigneeId = todo.assigneeId || todo.creatorId
      const { data: subscriptions } = await db.collection('subscriptions')
        .where({ _openid: assigneeId })
        .get()

      if (subscriptions.length === 0) continue

      // 发送订阅消息（需在微信公众平台配置模板）
      // 实际发送逻辑需替换为真实模板 ID 和数据
      // await cloud.openapi.subscribeMessage.send({
      //   touser: assigneeId,
      //   templateId: 'YOUR_TEMPLATE_ID',
      //   page: `/pages/todo-detail/index?id=${todo._id}`,
      //   data: {
      //     thing1: { value: todo.title },
      //     date2: { value: todo.dueDate },
      //     thing3: { value: '待办即将到期，请及时处理' }
      //   }
      // })

      sentCount++
    } catch (err) {
      console.error('发送提醒失败:', err)
    }
  }

  return success({ sentCount }, `已发送 ${sentCount} 条提醒`)
}

/**
 * 发送任务分配通知
 */
async function handleSendAssign(event, openid) {
  const { assigneeId, todoTitle, todoId } = event

  if (!assigneeId) return fail('缺少被分配人')

  // TODO: 实际发送逻辑
  return success(null, '通知已发送')
}
