// pages/todo-detail/index.js
const { callCloud, callCloudWithLoading, showToast, showConfirm } = require('../../utils/cloud')
const { PRIORITY, PRIORITY_MAP, DEFAULT_CATEGORIES } = require('../../utils/constants')
const store = require('../../store/app-store')

Page({
  data: {
    isEdit: false,
    todoId: '',
    // 表单数据
    form: {
      title: '',
      description: '',
      categoryId: '',
      tags: [],
      priority: PRIORITY.NONE,
      dueDate: '',
      dueTime: '',
      assigneeId: '',
      enableReminder: false
    },
    // 选项
    categories: [],
    members: [],
    priorityOptions: [
      { value: PRIORITY.NONE, label: '无', color: '#AEAEB2' },
      { value: PRIORITY.LOW, label: '低', color: '#34C759' },
      { value: PRIORITY.MEDIUM, label: '中', color: '#FF9500' },
      { value: PRIORITY.HIGH, label: '高', color: '#FF3B30' }
    ],
    // 弹窗控制
    showCategoryPicker: false,
    showMemberPicker: false,
    showDatePicker: false,
    showTimePicker: false,
    // 当前日期
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    currentTime: '09:00'
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, todoId: options.id })
      this.loadTodoDetail(options.id)
    }
    this.loadOptions()
  },

  /**
   * 加载待办详情
   */
  async loadTodoDetail(id) {
    try {
      const todo = await callCloudWithLoading('todo', 'getDetail', { todoId: id })
      this.setData({
        form: {
          title: todo.title || '',
          description: todo.description || '',
          categoryId: todo.categoryId || '',
          tags: todo.tags || [],
          priority: todo.priority || PRIORITY.NONE,
          dueDate: todo.dueDate || '',
          dueTime: todo.dueTime || '',
          assigneeId: todo.assigneeId || '',
          enableReminder: todo.enableReminder || false
        }
      })
    } catch (err) {
      console.error('加载详情失败:', err)
    }
  },

  /**
   * 加载分类和成员选项
   */
  async loadOptions() {
    const categories = store.categories.length ? store.categories : DEFAULT_CATEGORIES
    // TODO: 从 store 加载成员
    this.setData({ categories })
  },

  // 表单输入
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail })
  },

  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value || e.detail })
  },

  // 优先级选择
  onPrioritySelect(e) {
    const { value } = e.currentTarget.dataset
    this.setData({ 'form.priority': value })
  },

  // 分类选择
  onCategoryTap() {
    this.setData({ showCategoryPicker: true })
  },

  onCategoryConfirm(e) {
    const { index } = e.detail
    const category = this.data.categories[index]
    this.setData({
      'form.categoryId': category._id || category.name,
      showCategoryPicker: false
    })
  },

  onCategoryClose() {
    this.setData({ showCategoryPicker: false })
  },

  // 日期选择
  onDateTap() {
    this.setData({ showDatePicker: true })
  },

  onDateConfirm(e) {
    const date = new Date(e.detail)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    this.setData({ 'form.dueDate': dateStr, showDatePicker: false })
  },

  onDateClose() {
    this.setData({ showDatePicker: false })
  },

  // 时间选择
  onTimeTap() {
    this.setData({ showTimePicker: true })
  },

  onTimeConfirm(e) {
    this.setData({ 'form.dueTime': e.detail, showTimePicker: false })
  },

  onTimeClose() {
    this.setData({ showTimePicker: false })
  },

  // 成员选择
  onMemberTap() {
    this.setData({ showMemberPicker: true })
  },

  onMemberSelect(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ 'form.assigneeId': id, showMemberPicker: false })
  },

  onMemberClose() {
    this.setData({ showMemberPicker: false })
  },

  // 提醒开关
  onReminderChange(e) {
    const enabled = e.detail
    if (enabled) {
      // 请求订阅消息授权
      wx.requestSubscribeMessage({
        tmplIds: [''],
        success: () => {
          this.setData({ 'form.enableReminder': true })
        },
        fail: () => {
          showToast('需要授权才能接收提醒')
        }
      })
    } else {
      this.setData({ 'form.enableReminder': false })
    }
  },

  // 保存
  async onSave() {
    const { form, isEdit, todoId } = this.data
    if (!form.title.trim()) {
      showToast('请输入待办标题', 'error')
      return
    }

    try {
      const action = isEdit ? 'update' : 'create'
      const params = isEdit
        ? { todoId, ...form, familyId: store.currentFamilyId }
        : { ...form, familyId: store.currentFamilyId }

      await callCloudWithLoading('todo', action, params, isEdit ? '保存中...' : '创建中...')
      showToast(isEdit ? '保存成功' : '创建成功', 'success')

      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (err) {
      console.error('保存失败:', err)
    }
  },

  // 删除
  async onDelete() {
    const confirmed = await showConfirm('确认删除', '删除后无法恢复，确定要删除这个待办吗？')
    if (!confirmed) return

    try {
      await callCloudWithLoading('todo', 'delete', { todoId: this.data.todoId }, '删除中...')
      showToast('已删除')
      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (err) {
      console.error('删除失败:', err)
    }
  }
})
