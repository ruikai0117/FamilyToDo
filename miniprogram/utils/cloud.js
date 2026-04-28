/**
 * 云函数调用封装
 * 统一错误处理和返回格式
 */

/**
 * 调用云函数
 * @param {string} name - 云函数名称
 * @param {string} action - 操作类型
 * @param {object} data - 业务数据
 * @returns {Promise<object>} 云函数返回结果
 */
function callCloud(name, action, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data: {
        action,
        ...data
      }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        resolve(res.result.data)
      } else {
        const errMsg = (res.result && res.result.msg) || '操作失败'
        reject(new Error(errMsg))
      }
    }).catch(err => {
      console.error(`云函数 [${name}] 调用失败:`, err)
      reject(new Error(err.errMsg || '网络异常，请稍后重试'))
    })
  })
}

/**
 * 调用云函数（带 Loading）
 * @param {string} name - 云函数名称
 * @param {string} action - 操作类型
 * @param {object} data - 业务数据
 * @param {string} loadingText - Loading 文字
 * @returns {Promise<object>}
 */
async function callCloudWithLoading(name, action, data = {}, loadingText = '加载中...') {
  wx.showLoading({ title: loadingText, mask: true })
  try {
    const result = await callCloud(name, action, data)
    wx.hideLoading()
    return result
  } catch (err) {
    wx.hideLoading()
    showToast(err.message, 'error')
    throw err
  }
}

/**
 * 显示 Toast 提示
 * @param {string} message - 提示文字
 * @param {string} type - 类型 success/error/none
 */
function showToast(message, type = 'none') {
  wx.showToast({
    title: message,
    icon: type === 'error' ? 'none' : type,
    duration: 2000
  })
}

/**
 * 显示确认弹窗
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {Promise<boolean>}
 */
function showConfirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmColor: '#007AFF',
      success(res) {
        resolve(res.confirm)
      }
    })
  })
}

module.exports = {
  callCloud,
  callCloudWithLoading,
  showToast,
  showConfirm
}
