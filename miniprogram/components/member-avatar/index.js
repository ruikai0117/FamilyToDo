// components/member-avatar/index.js
Component({
  properties: {
    member: {
      type: Object,
      value: {}
    },
    size: {
      type: String,
      value: 'md' // sm / md / lg
    }
  },

  data: {
    defaultAvatar: ''
  },

  attached() {
    // 生成默认头像色
    const colors = ['#007AFF', '#34C759', '#FF9500', '#5856D6', '#FF2D55', '#5AC8FA']
    const index = this.data.member.nickName
      ? this.data.member.nickName.charCodeAt(0) % colors.length
      : 0
    this.setData({
      defaultAvatar: colors[index],
      initial: this.data.member.nickName ? this.data.member.nickName.charAt(0) : '?'
    })
  }
})
