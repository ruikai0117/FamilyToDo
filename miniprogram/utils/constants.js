/**
 * 常量定义
 * 优先级、状态枚举、默认分类等
 */

// 待办优先级
const PRIORITY = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
}

const PRIORITY_MAP = {
  [PRIORITY.NONE]: { label: '无', color: '#AEAEB2', key: 'none' },
  [PRIORITY.LOW]: { label: '低', color: '#34C759', key: 'low' },
  [PRIORITY.MEDIUM]: { label: '中', color: '#FF9500', key: 'medium' },
  [PRIORITY.HIGH]: { label: '高', color: '#FF3B30', key: 'high' }
}

// 待办状态
const TODO_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue'
}

const STATUS_MAP = {
  [TODO_STATUS.PENDING]: { label: '待完成', color: '#007AFF' },
  [TODO_STATUS.COMPLETED]: { label: '已完成', color: '#34C759' },
  [TODO_STATUS.OVERDUE]: { label: '已过期', color: '#FF3B30' }
}

// 家庭角色
const FAMILY_ROLE = {
  ADMIN: 'admin',
  MEMBER: 'member'
}

const ROLE_MAP = {
  [FAMILY_ROLE.ADMIN]: { label: '管理员', color: '#007AFF' },
  [FAMILY_ROLE.MEMBER]: { label: '成员', color: '#86868B' }
}

// 默认分类
const DEFAULT_CATEGORIES = [
  { name: '家务', icon: 'home', color: '#007AFF', sort: 0 },
  { name: '购物', icon: 'shopping-cart', color: '#FF9500', sort: 1 },
  { name: '维修', icon: 'tool', color: '#5856D6', sort: 2 },
  { name: '学习', icon: 'book', color: '#34C759', sort: 3 },
  { name: '健康', icon: 'heart', color: '#FF2D55', sort: 4 },
  { name: '财务', icon: 'coin', color: '#5AC8FA', sort: 5 },
  { name: '社交', icon: 'friends', color: '#AF52DE', sort: 6 },
  { name: '其他', icon: 'more', color: '#8E8E93', sort: 7 }
]

// 分类颜色池
const CATEGORY_COLORS = [
  '#007AFF', '#5AC8FA', '#34C759', '#FF9500',
  '#FF3B30', '#5856D6', '#FF2D55', '#AF52DE',
  '#8E8E93', '#00C7BE', '#FF6482', '#BF5AF2'
]

// 筛选类型
const FILTER_TYPE = {
  ALL: 'all',
  TODAY: 'today',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed'
}

const FILTER_MAP = {
  [FILTER_TYPE.ALL]: '全部',
  [FILTER_TYPE.TODAY]: '今天',
  [FILTER_TYPE.UPCOMING]: '即将到期',
  [FILTER_TYPE.COMPLETED]: '已完成'
}

// 订阅消息模板 ID（需在微信公众平台申请后替换）
const SUBSCRIBE_TEMPLATE = {
  TODO_REMIND: '',       // 待办到期提醒
  TODO_ASSIGNED: '',     // 任务分配通知
  TODO_COMPLETED: ''     // 任务完成通知
}

module.exports = {
  PRIORITY,
  PRIORITY_MAP,
  TODO_STATUS,
  STATUS_MAP,
  FAMILY_ROLE,
  ROLE_MAP,
  DEFAULT_CATEGORIES,
  CATEGORY_COLORS,
  FILTER_TYPE,
  FILTER_MAP,
  SUBSCRIBE_TEMPLATE
}
