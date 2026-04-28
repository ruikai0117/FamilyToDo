// 云函数 - 家庭相关
const cloud = require('wx-server-sdk')
const { success, fail, getOpenId, checkFamilyMember, checkFamilyAdmin, ROLE } = require('../common/utils')
const { generateInviteCode } = require('../../miniprogram/utils/util')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 家庭云函数 - action 路由
 * create: 创建家庭
 * join: 加入家庭
 * leave: 退出家庭
 * getFamilyInfo: 获取家庭信息
 * getMembers: 获取成员列表
 * setRole: 设置成员角色
 * removeMember: 移除成员
 */
exports.main = async (event, context) => {
  const { action } = event
  const openid = getOpenId(event)

  if (!openid) return fail('用户未登录')

  const handlers = {
    create: handleCreate,
    join: handleJoin,
    leave: handleLeave,
    getFamilyInfo: handleGetFamilyInfo,
    getMembers: handleGetMembers,
    setRole: handleSetRole,
    removeMember: handleRemoveMember
  }

  const handler = handlers[action]
  if (!handler) return fail(`未知操作: ${action}`)

  try {
    return await handler(event, openid)
  } catch (err) {
    console.error(`[family] ${action} 错误:`, err)
    return fail(err.message || '操作失败')
  }
}

/**
 * 创建家庭
 */
async function handleCreate(event, openid) {
  const { name } = event
  if (!name || !name.trim()) return fail('请输入家庭名称')

  const inviteCode = await generateUniqueCode()

  const family = {
    name: name.trim(),
    inviteCode,
    creatorId: openid,
    members: [{
      openid,
      role: ROLE.ADMIN,
      joinedAt: db.serverDate()
    }],
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const { _id } = await db.collection('families').add({ data: family })

  // 更新用户的家庭列表
  await db.collection('users')
    .where({ _openid: openid })
    .update({
      data: {
        familyIds: _.push(_id),
        defaultFamilyId: _id
      }
    })

  return success({ familyId: _id, inviteCode }, '创建成功')
}

/**
 * 生成唯一邀请码
 */
async function generateUniqueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code, exists = true

  while (exists) {
    code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const { data } = await db.collection('families')
      .where({ inviteCode: code })
      .get()
    exists = data.length > 0
  }

  return code
}

/**
 * 加入家庭
 */
async function handleJoin(event, openid) {
  const { inviteCode } = event
  if (!inviteCode) return fail('请输入邀请码')

  const { data: families } = await db.collection('families')
    .where({ inviteCode: inviteCode.toUpperCase() })
    .get()

  if (families.length === 0) return fail('邀请码无效')

  const family = families[0]

  // 检查是否已加入
  if (family.members.some(m => m.openid === openid)) {
    return fail('你已经是该家庭成员')
  }

  // 添加成员
  await db.collection('families').doc(family._id).update({
    data: {
      members: _.push({
        openid,
        role: ROLE.MEMBER,
        joinedAt: db.serverDate()
      }),
      updatedAt: db.serverDate()
    }
  })

  // 更新用户家庭列表
  await db.collection('users')
    .where({ _openid: openid })
    .update({
      data: {
        familyIds: _.push(family._id)
      }
    })

  return success({ familyId: family._id }, '加入成功')
}

/**
 * 退出家庭
 */
async function handleLeave(event, openid) {
  const { familyId } = event
  if (!familyId) return fail('缺少家庭 ID')

  const { data: family } = await db.collection('families').doc(familyId).get()
  if (!family) return fail('家庭不存在')

  const memberIndex = family.members.findIndex(m => m.openid === openid)
  if (memberIndex === -1) return fail('你不是该家庭成员')

  // 如果是最后一个管理员，不允许退出
  const adminCount = family.members.filter(m => m.role === ROLE.ADMIN).length
  if (adminCount === 1 && family.members[memberIndex].role === ROLE.ADMIN) {
    return fail('你是唯一管理员，请先转让管理员权限')
  }

  // 移除成员
  const newMembers = [...family.members]
  newMembers.splice(memberIndex, 1)

  await db.collection('families').doc(familyId).update({
    data: { members: newMembers, updatedAt: db.serverDate() }
  })

  // 更新用户家庭列表
  const { data: user } = await db.collection('users')
    .where({ _openid: openid })
    .get()

  if (user.length > 0) {
    const newFamilyIds = (user[0].familyIds || []).filter(id => id !== familyId)
    const updateData = { familyIds: newFamilyIds }
    if (user[0].defaultFamilyId === familyId) {
      updateData.defaultFamilyId = newFamilyIds[0] || ''
    }
    await db.collection('users').doc(user[0]._id).update({ data: updateData })
  }

  return success(null, '已退出')
}

/**
 * 获取家庭信息
 */
async function handleGetFamilyInfo(event, openid) {
  const { familyId } = event
  if (!familyId) return fail('缺少家庭 ID')

  const { data: family } = await db.collection('families').doc(familyId).get()
  if (!family) return fail('家庭不存在')

  // 检查权限
  const member = family.members.find(m => m.openid === openid)
  if (!member) return fail('你不是该家庭成员')

  // 获取成员详细信息
  const memberOpenids = family.members.map(m => m.openid)
  const { data: users } = await db.collection('users')
    .where({ _openid: _.in(memberOpenids) })
    .get()

  const memberDetails = family.members.map(m => {
    const user = users.find(u => u._openid === m.openid) || {}
    return {
      _id: m.openid,
      _openid: m.openid,
      nickName: user.nickName || '未知用户',
      avatarUrl: user.avatarUrl || '',
      role: m.role,
      joinedAt: m.joinedAt
    }
  })

  return success({
    family: {
      _id: family._id,
      name: family.name,
      inviteCode: family.inviteCode,
      createTime: family.createdAt,
      memberCount: family.members.length
    },
    members: memberDetails
  })
}

/**
 * 获取成员列表
 */
async function handleGetMembers(event, openid) {
  const result = await handleGetFamilyInfo(event, openid)
  if (result.code !== 0) return result
  return success({ members: result.data.members })
}

/**
 * 设置成员角色
 */
async function handleSetRole(event, openid) {
  const { familyId, memberId, role } = event

  const isAdmin = await checkFamilyAdmin(db, familyId, openid)
  if (!isAdmin) return fail('仅管理员可设置角色')

  const { data: family } = await db.collection('families').doc(familyId).get()
  const newMembers = family.members.map(m => {
    if (m.openid === memberId) {
      return { ...m, role }
    }
    return m
  })

  await db.collection('families').doc(familyId).update({
    data: { members: newMembers, updatedAt: db.serverDate() }
  })

  return success(null, '设置成功')
}

/**
 * 移除成员
 */
async function handleRemoveMember(event, openid) {
  const { familyId, memberId } = event

  const isAdmin = await checkFamilyAdmin(db, familyId, openid)
  if (!isAdmin) return fail('仅管理员可移除成员')

  const { data: family } = await db.collection('families').doc(familyId).get()
  const newMembers = family.members.filter(m => m.openid !== memberId)

  if (newMembers.length === family.members.length) {
    return fail('该成员不存在')
  }

  await db.collection('families').doc(familyId).update({
    data: { members: newMembers, updatedAt: db.serverDate() }
  })

  // 更新被移除用户的家庭列表
  const { data: users } = await db.collection('users')
    .where({ _openid: memberId })
    .get()

  if (users.length > 0) {
    const newFamilyIds = (users[0].familyIds || []).filter(id => id !== familyId)
    const updateData = { familyIds: newFamilyIds }
    if (users[0].defaultFamilyId === familyId) {
      updateData.defaultFamilyId = newFamilyIds[0] || ''
    }
    await db.collection('users').doc(users[0]._id).update({ data: updateData })
  }

  return success(null, '已移除')
}
