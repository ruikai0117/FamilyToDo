/**
 * 云函数公共模块
 * 权限校验、错误处理、常量定义
 */

const ROLE = {
  ADMIN: 'admin',
  MEMBER: 'member'
}

/**
 * 统一返回格式
 */
function success(data = null, msg = '操作成功') {
  return { code: 0, data, msg }
}

function fail(msg = '操作失败', code = -1) {
  return { code, data: null, msg }
}

/**
 * 获取用户 openid
 */
function getOpenId(event) {
  return event.userInfo ? event.userInfo.openId : null
}

/**
 * 校验用户是否为指定家庭成员
 * @param {object} db - 云数据库引用
 * @param {string} familyId - 家庭 ID
 * @param {string} openid - 用户 openid
 * @returns {Promise<object|null>} 家庭成员信息
 */
async function checkFamilyMember(db, familyId, openid) {
  if (!familyId || !openid) return null

  const { data } = await db.collection('families').doc(familyId).get()
  if (!data) return null

  const member = data.members.find(m => m.openid === openid)
  return member || null
}

/**
 * 校验用户是否为家庭管理员
 */
async function checkFamilyAdmin(db, familyId, openid) {
  const member = await checkFamilyMember(db, familyId, openid)
  return member && member.role === ROLE.ADMIN
}

/**
 * 生成分页参数
 */
function parsePage(event) {
  const page = Math.max(0, parseInt(event.page) || 0)
  const pageSize = Math.min(50, Math.max(1, parseInt(event.pageSize) || 20))
  return { page, pageSize, skip: page * pageSize }
}

module.exports = {
  ROLE,
  success,
  fail,
  getOpenId,
  checkFamilyMember,
  checkFamilyAdmin,
  parsePage
}
