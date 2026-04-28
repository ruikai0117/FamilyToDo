// 云函数 - 待办相关
const cloud = require('wx-server-sdk')
const { success, fail, getOpenId, checkFamilyMember, parsePage } = require('../common/utils')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 待办云函数 - action 路由
 * create: 创建待办
 * update: 更新待办
 * delete: 删除待办
 * complete: 完成待办
 * uncomplete: 取消完成
 * getList: 获取待办列表
 * getDetail: 获取待办详情
 * createCategory: 创建分类
 * deleteCategory: 删除分类
 * getCategories: 获取分类列表
 */
exports.main = async (event, context) => {
  const { action } = event
  const openid = getOpenId(event)

  if (!openid) return fail('用户未登录')

  const handlers = {
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    complete: handleComplete,
    uncomplete: handleUncomplete,
    getList: handleGetList,
    getDetail: handleGetDetail,
    createCategory: handleCreateCategory,
    deleteCategory: handleDeleteCategory,
    getCategories: handleGetCategories
  }

  const handler = handlers[action]
  if (!handler) return fail(`未知操作: ${action}`)

  try {
    return await handler(event, openid)
  } catch (err) {
    console.error(`[todo] ${action} 错误:`, err)
    return fail(err.message || '操作失败')
  }
}

/**
 * 创建待办
 */
async function handleCreate(event, openid) {
  const { familyId, title, description, categoryId, tags, priority, dueDate, dueTime, assigneeId, enableReminder } = event

  if (!familyId) return fail('缺少家庭 ID')
  if (!title || !title.trim()) return fail('请输入待办标题')

  // 校验家庭成员
  const member = await checkFamilyMember(db, familyId, openid)
  if (!member) return fail('你不是该家庭成员')

  const todo = {
    familyId,
    title: title.trim(),
    description: description || '',
    categoryId: categoryId || '',
    tags: tags || [],
    priority: priority || 0,
    dueDate: dueDate || '',
    dueTime: dueTime || '',
    assigneeId: assigneeId || '',
    enableReminder: enableReminder || false,
    status: 'pending',
    creatorId: openid,
    completedAt: null,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const { _id } = await db.collection('todos').add({ data: todo })
  return success({ _id, ...todo }, '创建成功')
}

/**
 * 更新待办
 */
async function handleUpdate(event, openid) {
  const { todoId, title, description, categoryId, tags, priority, dueDate, dueTime, assigneeId, enableReminder, familyId } = event

  if (!todoId) return fail('缺少待办 ID')

  // 校验家庭成员
  const member = await checkFamilyMember(db, familyId, openid)
  if (!member) return fail('你不是该家庭成员')

  const updateData = { updatedAt: db.serverDate() }
  if (title !== undefined) updateData.title = title.trim()
  if (description !== undefined) updateData.description = description
  if (categoryId !== undefined) updateData.categoryId = categoryId
  if (tags !== undefined) updateData.tags = tags
  if (priority !== undefined) updateData.priority = priority
  if (dueDate !== undefined) updateData.dueDate = dueDate
  if (dueTime !== undefined) updateData.dueTime = dueTime
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId
  if (enableReminder !== undefined) updateData.enableReminder = enableReminder

  await db.collection('todos').doc(todoId).update({ data: updateData })
  return success(null, '更新成功')
}

/**
 * 删除待办
 */
async function handleDelete(event, openid) {
  const { todoId } = event
  if (!todoId) return fail('缺少待办 ID')

  const { data: todo } = await db.collection('todos').doc(todoId).get()
  if (!todo) return fail('待办不存在')

  // 校验权限
  const member = await checkFamilyMember(db, todo.familyId, openid)
  if (!member) return fail('无权操作')

  await db.collection('todos').doc(todoId).remove()
  return success(null, '删除成功')
}

/**
 * 完成待办
 */
async function handleComplete(event, openid) {
  const { todoId } = event
  if (!todoId) return fail('缺少待办 ID')

  const { data: todo } = await db.collection('todos').doc(todoId).get()
  if (!todo) return fail('待办不存在')

  await db.collection('todos').doc(todoId).update({
    data: {
      status: 'completed',
      completedAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  })

  return success(null, '已完成')
}

/**
 * 取消完成
 */
async function handleUncomplete(event, openid) {
  const { todoId } = event
  if (!todoId) return fail('缺少待办 ID')

  await db.collection('todos').doc(todoId).update({
    data: {
      status: 'pending',
      completedAt: null,
      updatedAt: db.serverDate()
    }
  })

  return success(null, '已标记为未完成')
}

/**
 * 获取待办列表
 */
async function handleGetList(event, openid) {
  const { familyId, filter } = event
  if (!familyId) return fail('缺少家庭 ID')

  const member = await checkFamilyMember(db, familyId, openid)
  if (!member) return fail('你不是该家庭成员')

  const { page, pageSize, skip } = parsePage(event)

  // 构建查询条件
  let query = { familyId }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  switch (filter) {
    case 'today':
      query.status = 'pending'
      query.dueDate = _.gte(todayStart.toISOString().split('T')[0])
        .and(_.lt(todayEnd.toISOString().split('T')[0]))
      break
    case 'upcoming':
      query.status = 'pending'
      query.dueDate = _.gte(now.toISOString().split('T')[0])
      break
    case 'completed':
      query.status = 'completed'
      break
    default:
      query.status = _.neq('completed')
  }

  const { data: list } = await db.collection('todos')
    .where(query)
    .orderBy('priority', 'desc')
    .orderBy('dueDate', 'asc')
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  return success({ list })
}

/**
 * 获取待办详情
 */
async function handleGetDetail(event, openid) {
  const { todoId } = event
  if (!todoId) return fail('缺少待办 ID')

  const { data: todo } = await db.collection('todos').doc(todoId).get()
  if (!todo) return fail('待办不存在')

  const member = await checkFamilyMember(db, todo.familyId, openid)
  if (!member) return fail('无权查看')

  return success(todo)
}

/**
 * 创建分类
 */
async function handleCreateCategory(event, openid) {
  const { familyId, name, icon, color } = event
  if (!familyId || !name) return fail('缺少必要参数')

  const member = await checkFamilyMember(db, familyId, openid)
  if (!member) return fail('你不是该家庭成员')

  const category = {
    familyId,
    name: name.trim(),
    icon: icon || 'label-o',
    color: color || '#007AFF',
    sort: event.sort || 0,
    createdAt: db.serverDate()
  }

  const { _id } = await db.collection('categories').add({ data: category })
  return success({ _id, ...category }, '创建成功')
}

/**
 * 删除分类
 */
async function handleDeleteCategory(event, openid) {
  const { categoryId } = event
  if (!categoryId) return fail('缺少分类 ID')

  const { data: category } = await db.collection('categories').doc(categoryId).get()
  if (!category) return fail('分类不存在')

  const member = await checkFamilyMember(db, category.familyId, openid)
  if (!member) return fail('无权操作')

  await db.collection('categories').doc(categoryId).remove()
  return success(null, '删除成功')
}

/**
 * 获取分类列表
 */
async function handleGetCategories(event, openid) {
  const { familyId } = event
  if (!familyId) return success([])

  const { data: categories } = await db.collection('categories')
    .where({ familyId })
    .orderBy('sort', 'asc')
    .get()

  // 获取各分类下的待办计数
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const { total } = await db.collection('todos')
        .where({ familyId, categoryId: cat._id, status: 'pending' })
        .count()
      return { ...cat, count: total }
    })
  )

  return success(categoriesWithCount)
}
