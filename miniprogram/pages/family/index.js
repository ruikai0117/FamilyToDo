// pages/family/index.js
const store = require('../../store/app-store')
const { callCloud, callCloudWithLoading, showToast, showConfirm } = require('../../utils/cloud')
const { ROLE_MAP } = require('../../utils/constants')
const { formatDate, generateInviteCode } = require('../../utils/util')

Page({
  data: {
    currentFamily: null,
    members: [],
    familyList: [],
    // 弹窗控制
    showCreateFamily: false,
    showJoinFamily: false,
    newFamilyName: '',
    inviteCode: '',
    // 角色
    roleMap: ROLE_MAP
  },

  onLoad() {
    this.loadFamilyData()
  },

  onShow() {
    this.loadFamilyData()
  },

  /**
   * 加载家庭数据
   */
  async loadFamilyData() {
    try {
      const result = await callCloud('family', 'getFamilyInfo', {
        familyId: store.currentFamilyId
      })

      this.setData({
        currentFamily: result.family,
        members: result.members || [],
        familyList: result.familyList || []
      })
    } catch (err) {
      console.error('加载家庭数据失败:', err)
    }
  },

  /**
   * 创建家庭
   */
  onCreateFamily() {
    this.setData({ showCreateFamily: true, newFamilyName: '' })
  },

  onNewFamilyNameInput(e) {
    this.setData({ newFamilyName: e.detail })
  },

  async onCreateConfirm() {
    const { newFamilyName } = this.data
    if (!newFamilyName.trim()) {
      showToast('请输入家庭名称', 'error')
      return
    }

    try {
      const result = await callCloudWithLoading('family', 'create', {
        name: newFamilyName.trim()
      }, '创建中...')
      showToast('创建成功', 'success')
      this.setData({ showCreateFamily: false })
      await store.switchFamily(result.familyId)
      this.loadFamilyData()
    } catch (err) {
      console.error('创建家庭失败:', err)
    }
  },

  onCreateClose() {
    this.setData({ showCreateFamily: false })
  },

  /**
   * 加入家庭
   */
  onJoinFamily() {
    this.setData({ showJoinFamily: true, inviteCode: '' })
  },

  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail.toUpperCase() })
  },

  async onJoinConfirm() {
    const { inviteCode } = this.data
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      showToast('请输入6位邀请码', 'error')
      return
    }

    try {
      await callCloudWithLoading('family', 'join', {
        inviteCode: inviteCode.trim()
      }, '加入中...')
      showToast('加入成功', 'success')
      this.setData({ showJoinFamily: false })
      this.loadFamilyData()
    } catch (err) {
      console.error('加入家庭失败:', err)
    }
  },

  onJoinClose() {
    this.setData({ showJoinFamily: false })
  },

  /**
   * 复制邀请码
   */
  onCopyInviteCode() {
    const code = this.data.currentFamily.inviteCode
    wx.setClipboardData({
      data: code,
      success: () => {
        showToast('邀请码已复制', 'success')
      }
    })
  },

  /**
   * 成员管理
   */
  onManageMembers() {
    wx.navigateTo({ url: '/pages/member-manage/index' })
  },

  /**
   * 切换家庭
   */
  async onSwitchFamily(e) {
    const { id } = e.currentTarget.dataset
    if (id === store.currentFamilyId) return

    try {
      await store.switchFamily(id)
      showToast('已切换', 'success')
      this.loadFamilyData()
    } catch (err) {
      console.error('切换家庭失败:', err)
    }
  },

  /**
   * 退出家庭
   */
  async onLeaveFamily() {
    const confirmed = await showConfirm('确认退出', '退出后将无法查看该家庭的待办，确定退出吗？')
    if (!confirmed) return

    try {
      await callCloudWithLoading('family', 'leave', {
        familyId: store.currentFamilyId
      }, '退出中...')
      showToast('已退出')
      this.loadFamilyData()
    } catch (err) {
      console.error('退出家庭失败:', err)
    }
  }
})
