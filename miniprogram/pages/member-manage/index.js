// pages/member-manage/index.js
const store = require('../../store/app-store')
const { callCloud, callCloudWithLoading, showToast, showConfirm } = require('../../utils/cloud')
const { FAMILY_ROLE, ROLE_MAP } = require('../../utils/constants')

Page({
  data: {
    members: [],
    isAdmin: false,
    roleMap: ROLE_MAP
  },

  onLoad() {
    this.loadMembers()
  },

  /**
   * 加载成员列表
   */
  async loadMembers() {
    try {
      const result = await callCloud('family', 'getMembers', {
        familyId: store.currentFamilyId
      })
      const currentUser = result.members.find(m => m._openid === store.userInfo._openid)
      this.setData({
        members: result.members || [],
        isAdmin: currentUser && currentUser.role === FAMILY_ROLE.ADMIN
      })
    } catch (err) {
      console.error('加载成员失败:', err)
    }
  },

  /**
   * 复制邀请码
   */
  onCopyInviteCode() {
    // 从家庭信息获取邀请码
    wx.setClipboardData({
      data: store.currentFamilyId, // 实际应从家庭信息获取邀请码
      success: () => {
        showToast('邀请码已复制', 'success')
      }
    })
  },

  /**
   * 设置管理员
   */
  async onSetAdmin(e) {
    const { id } = e.currentTarget.dataset
    const confirmed = await showConfirm('设置管理员', '确定要将该成员设为管理员吗？')
    if (!confirmed) return

    try {
      await callCloudWithLoading('family', 'setRole', {
        familyId: store.currentFamilyId,
        memberId: id,
        role: FAMILY_ROLE.ADMIN
      })
      showToast('设置成功', 'success')
      this.loadMembers()
    } catch (err) {
      console.error('设置管理员失败:', err)
    }
  },

  /**
   * 移除成员
   */
  async onRemoveMember(e) {
    const { id, name } = e.currentTarget.dataset
    const confirmed = await showConfirm('移除成员', `确定要将"${name}"移出家庭吗？`)
    if (!confirmed) return

    try {
      await callCloudWithLoading('family', 'removeMember', {
        familyId: store.currentFamilyId,
        memberId: id
      }, '移除中...')
      showToast('已移除')
      this.loadMembers()
    } catch (err) {
      console.error('移除成员失败:', err)
    }
  }
})
