App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true
      })
    }

    // 获取系统信息用于适配
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
    this.globalData.navBarHeight = systemInfo.statusBarHeight + 44
    this.globalData.screenWidth = systemInfo.screenWidth
    this.globalData.screenHeight = systemInfo.screenHeight

    // 检查登录状态
    this.checkLoginStatus()
  },

  /**
   * 检查登录状态，若无用户信息则自动登录
   */
  async checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo) {
        await this.autoLogin()
      } else {
        this.globalData.userInfo = userInfo
        this.globalData.currentFamilyId = wx.getStorageSync('currentFamilyId') || ''
      }
    } catch (err) {
      console.error('检查登录状态失败:', err)
    }
  },

  /**
   * 自动登录（调用云函数获取 openid）
   */
  async autoLogin() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'user',
        data: { action: 'login' }
      })
      if (result.code === 0) {
        this.globalData.userInfo = result.data
        this.globalData.currentFamilyId = result.data.defaultFamilyId || ''
        wx.setStorageSync('userInfo', result.data)
        wx.setStorageSync('currentFamilyId', result.data.defaultFamilyId || '')
      }
    } catch (err) {
      console.error('自动登录失败:', err)
    }
  },

  globalData: {
    userInfo: null,
    currentFamilyId: '',
    statusBarHeight: 20,
    navBarHeight: 64,
    screenWidth: 375,
    screenHeight: 812
  }
})
