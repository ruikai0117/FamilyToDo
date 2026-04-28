// pages/index/index.js
const store = require('../../store/app-store')
const { callCloud, callCloudWithLoading, showToast, showConfirm } = require('../../utils/cloud')
const { PRIORITY_MAP, FILTER_TYPE, TODO_STATUS } = require('../../utils/constants')
const { relativeTime, isToday, isOverdue, debounce } = require('../../utils/util')

Page({
  data: {
    // 筛选
    filters: [
      { key: FILTER_TYPE.ALL, label: '全部' },
      { key: FILTER_TYPE.TODAY, label: '今天' },
      { key: FILTER_TYPE.UPCOMING, label: '即将到期' },
      { key: FILTER_TYPE.COMPLETED, label: '已完成' }
    ],
    currentFilter: FILTER_TYPE.ALL,
    // 家庭
    familyName: '',
    // 待办列表
    todoList: [],
    loading: true,
    isEmpty: false,
    // 分页
    page: 0,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    this.loadTodos()
  },

  onShow() {
    // 从其他页面返回时刷新列表
    this.refreshTodos()
  },

  onPullDownRefresh() {
    this.refreshTodos().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  /**
   * 切换筛选
   */
  onFilterTap(e) {
    const { key } = e.currentTarget.dataset
    if (key === this.data.currentFilter) return
    this.setData({ currentFilter: key, page: 0, todoList: [], hasMore: true })
    this.loadTodos()
  },

  /**
   * 加载待办列表
   */
  async loadTodos() {
    if (!store.currentFamilyId) {
      this.setData({ loading: false, isEmpty: true })
      return
    }

    this.setData({ loading: true })
    try {
      const result = await callCloud('todo', 'getList', {
        familyId: store.currentFamilyId,
        filter: this.data.currentFilter,
        page: this.data.page,
        pageSize: this.data.pageSize
      })

      const todoList = (result.list || []).map(item => ({
        ...item,
        priorityInfo: PRIORITY_MAP[item.priority] || PRIORITY_MAP[0],
        timeDesc: item.dueDate ? relativeTime(item.dueDate) : '',
        isOverdue: item.status !== TODO_STATUS.COMPLETED && item.dueDate && isOverdue(item.dueDate)
      }))

      this.setData({
        todoList: this.data.page === 0 ? todoList : [...this.data.todoList, ...todoList],
        loading: false,
        isEmpty: todoList.length === 0 && this.data.page === 0,
        hasMore: todoList.length >= this.data.pageSize
      })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  /**
   * 刷新列表
   */
  async refreshTodos() {
    this.setData({ page: 0, hasMore: true })
    await this.loadTodos()
  },

  /**
   * 加载更多
   */
  loadMore() {
    this.setData({ page: this.data.page + 1 })
    this.loadTodos()
  },

  /**
   * 完成/取消完成待办
   */
  async onToggleComplete(e) {
    const { id, completed } = e.currentTarget.dataset
    try {
      await callCloud('todo', completed ? 'uncomplete' : 'complete', { todoId: id })
      showToast(completed ? '已标记为未完成' : '已完成')
      this.refreshTodos()
    } catch (err) {
      console.error('操作失败:', err)
    }
  },

  /**
   * 左滑删除
   */
  async onDeleteTodo(e) {
    const { id } = e.currentTarget.dataset
    const confirmed = await showConfirm('确认删除', '删除后无法恢复，确定要删除这个待办吗？')
    if (!confirmed) return

    try {
      await callCloudWithLoading('todo', 'delete', { todoId: id }, '删除中...')
      showToast('已删除')
      this.refreshTodos()
    } catch (err) {
      console.error('删除失败:', err)
    }
  },

  /**
   * 点击待办 - 进入详情
   */
  onTodoTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/todo-detail/index?id=${id}` })
  },

  /**
   * 点击浮动按钮 - 新建待办
   */
  onFabTap() {
    wx.navigateTo({ url: '/pages/todo-detail/index' })
  },

  /**
   * 切换家庭
   */
  onSwitchFamily() {
    wx.navigateTo({ url: '/pages/family/index' })
  }
})
