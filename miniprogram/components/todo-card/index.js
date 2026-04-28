// components/todo-card/index.js
const { PRIORITY_MAP, TODO_STATUS } = require('../../utils/constants')
const { relativeTime, isOverdue } = require('../../utils/util')

Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  observers: {
    'item': function (item) {
      if (!item) return
      const priorityInfo = PRIORITY_MAP[item.priority] || PRIORITY_MAP[0]
      const isCompleted = item.status === TODO_STATUS.COMPLETED
      const isOverdueItem = !isCompleted && item.dueDate && isOverdue(item.dueDate)
      const timeDesc = item.dueDate ? relativeTime(item.dueDate) : ''

      this.setData({
        priorityInfo,
        isCompleted,
        isOverdue: isOverdueItem,
        timeDesc
      })
    }
  },

  data: {
    priorityInfo: {},
    isCompleted: false,
    isOverdue: false,
    timeDesc: ''
  },

  methods: {
    /**
     * 切换完成状态
     */
    onToggleComplete(e) {
      e.stopPropagation()
      const { id } = this.data.item
      const isCompleted = this.data.isCompleted
      this.triggerEvent('toggle', { id, completed: isCompleted })
    },

    /**
     * 点击卡片
     */
    onCardTap() {
      const { _id } = this.data.item
      this.triggerEvent('tap', { id: _id })
    }
  }
})
