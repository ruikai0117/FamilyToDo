// pages/stats/index.js
const store = require('../../store/app-store')
const { callCloud } = require('../../utils/cloud')

Page({
  data: {
    // 概览数据
    overview: {
      weekCompleted: 0,
      totalPending: 0,
      completionRate: 0
    },
    // 成员贡献
    memberStats: [],
    // 分类分布
    categoryStats: [],
    // 周趋势
    weekTrend: [],
    loading: true
  },

  onLoad() {
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  onPullDownRefresh() {
    this.loadStats().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    if (!store.currentFamilyId) {
      this.setData({ loading: false })
      return
    }

    this.setData({ loading: true })
    try {
      const result = await callCloud('stats', 'getDashboard', {
        familyId: store.currentFamilyId
      })

      this.setData({
        overview: result.overview || { weekCompleted: 0, totalPending: 0, completionRate: 0 },
        memberStats: result.memberStats || [],
        categoryStats: result.categoryStats || [],
        weekTrend: result.weekTrend || [],
        loading: false
      })
    } catch (err) {
      console.error('加载统计失败:', err)
      this.setData({ loading: false })
    }
  }
})
