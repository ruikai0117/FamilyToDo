// 云函数 - 用户相关
const cloud = require('wx-server-sdk')
const { success, fail, getOpenId } = require('../common/utils')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 用户云函数 - action 路由
 * login: 自动登录/注册
 * getInfo: 获取用户信息
 * updateInfo: 更新用户信息
 * switchFamily: 切换默认家庭
 */
exports.main = async (event, context) => {
  const { action } = event
  const openid = getOpenId(event)

  if (!openid) return fail('用户未登录')

  const handlers = {
    login: handleLogin,
    getInfo: handleGetInfo,
    updateInfo: handleUpdateInfo,
    switchFamily: handleSwitchFamily
  }

  const handler = handlers[action]
  if (!handler) return fail(`未知操作: ${action}`)

  try {
    return await handler(event, openid)
  } catch (err) {
    console.error(`[user] ${action} 错误:`, err)
    return fail(err.message || '操作失败')
  }
}

/**
 * 登录/注册
 */
async function handleLogin(event, openid) {
  const { data: user } = await db.collection('users')
    .where({ _openid: openid })
    .get()

  if (user.length > 0) {
    // 更新最后登录时间
    await db.collection('users').doc(user[0]._id).update({
      data: { lastLoginAt: db.serverDate() }
    })
    return success(user[0])
  }

  // 新用户注册
  const newUser = {
    _openid: openid,
    nickName: event.nickName || '新用户',
    avatarUrl: event.avatarUrl || '',
    familyIds: [],
    defaultFamilyId: '',
    createdAt: db.serverDate(),
    lastLoginAt: db.serverDate()
  }

  const { _id } = await db.collection('users').add({ data: newUser })
  return success({ ...newUser, _id })
}

/**
 * 获取用户信息
 */
async function handleGetInfo(event, openid) {
  const { data } = await db.collection('users')
    .where({ _openid: openid })
    .get()

  if (data.length === 0) return fail('用户不存在')
  return success(data[0])
}

/**
 * 更新用户信息
 */
async function handleUpdateInfo(event, openid) {
  const { nickName, avatarUrl } = event
  const updateData = { updatedAt: db.serverDate() }

  if (nickName) updateData.nickName = nickName
  if (avatarUrl) updateData.avatarUrl = avatarUrl

  const { data } = await db.collection('users')
    .where({ _openid: openid })
    .get()

  if (data.length === 0) return fail('用户不存在')

  await db.collection('users').doc(data[0]._id).update({ data: updateData })
  return success(null, '更新成功')
}

/**
 * 切换默认家庭
 */
async function handleSwitchFamily(event, openid) {
  const { familyId } = event
  if (!familyId) return fail('缺少家庭 ID')

  const { data } = await db.collection('users')
    .where({ _openid: openid })
    .get()

  if (data.length === 0) return fail('用户不存在')

  const user = data[0]
  if (!user.familyIds || !user.familyIds.includes(familyId)) {
    return fail('你不是该家庭成员')
  }

  await db.collection('users').doc(user._id).update({
    data: { defaultFamilyId: familyId }
  })

  return success(null, '切换成功')
}
