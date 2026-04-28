/**
 * 轻量全局状态管理
 * 管理当前家庭、用户信息、分类缓存等跨页面共享数据
 */

const app = getApp()

class AppStore {
  constructor() {
    this._listeners = {}
    this._state = {
      currentFamilyId: '',
      currentFamily: null,
      userInfo: null,
      categories: [],
      familyMembers: [],
      tags: []
    }
  }

  /**
   * 获取状态
   */
  get state() {
    return this._state
  }

  /**
   * 更新状态并通知监听器
   */
  setState(partial) {
    this._state = { ...this._state, ...partial }
    this._notify()
  }

  /**
   * 订阅状态变化
   * @param {string} key - 监听器标识
   * @param {Function} callback - 回调函数
   */
  subscribe(key, callback) {
    this._listeners[key] = callback
  }

  /**
   * 取消订阅
   * @param {string} key - 监听器标识
   */
  unsubscribe(key) {
    delete this._listeners[key]
  }

  /**
   * 通知所有监听器
   */
  _notify() {
    Object.values(this._listeners).forEach(cb => {
      if (typeof cb === 'function') cb(this._state)
    })
  }

  /**
   * 初始化用户数据
   */
  async initUserData() {
    const { callCloud } = require('../utils/cloud')
    try {
      const [userInfo, categories] = await Promise.all([
        callCloud('user', 'getInfo'),
        this.currentFamilyId ? callCloud('todo', 'getCategories', {
          familyId: this.currentFamilyId
        }) : Promise.resolve([])
      ])

      this.setState({
        userInfo,
        categories: categories || [],
        currentFamilyId: app.globalData.currentFamilyId
      })

      // 缓存到本地
      wx.setStorageSync('categories', categories || [])
    } catch (err) {
      console.error('初始化用户数据失败:', err)
    }
  }

  /**
   * 切换当前家庭
   */
  async switchFamily(familyId) {
    const { callCloud } = require('../utils/cloud')
    try {
      await callCloud('user', 'switchFamily', { familyId })
      app.globalData.currentFamilyId = familyId
      wx.setStorageSync('currentFamilyId', familyId)

      // 重新加载家庭相关数据
      this.setState({ currentFamilyId, categories: [], familyMembers: [] })
      await this.initUserData()
    } catch (err) {
      console.error('切换家庭失败:', err)
      throw err
    }
  }

  /**
   * 刷新分类缓存
   */
  async refreshCategories() {
    const { callCloud } = require('../utils/cloud')
    if (!this._state.currentFamilyId) return

    try {
      const categories = await callCloud('todo', 'getCategories', {
        familyId: this._state.currentFamilyId
      })
      this.setState({ categories: categories || [] })
      wx.setStorageSync('categories', categories || [])
    } catch (err) {
      console.error('刷新分类失败:', err)
    }
  }

  get currentFamilyId() {
    return this._state.currentFamilyId
  }

  get userInfo() {
    return this._state.userInfo
  }

  get categories() {
    return this._state.categories
  }
}

// 单例导出
const store = new AppStore()
module.exports = store
