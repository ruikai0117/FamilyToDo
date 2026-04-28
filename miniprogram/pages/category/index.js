// pages/category/index.js
const store = require('../../store/app-store')
const { callCloud, callCloudWithLoading, showToast, showConfirm } = require('../../utils/cloud')
const { DEFAULT_CATEGORIES, CATEGORY_COLORS } = require('../../utils/constants')

Page({
  data: {
    categories: [],
    searchKeyword: '',
    showAddCategory: false,
    newCategoryName: '',
    newCategoryColor: CATEGORY_COLORS[0],
    colorOptions: CATEGORY_COLORS
  },

  onLoad() {
    this.loadCategories()
  },

  onShow() {
    this.loadCategories()
  },

  /**
   * 加载分类列表
   */
  async loadCategories() {
    const categories = store.categories.length ? store.categories : DEFAULT_CATEGORIES
    this.setData({ categories })
  },

  /**
   * 搜索
   */
  onSearch(e) {
    this.setData({ searchKeyword: e.detail })
  },

  /**
   * 点击分类 - 查看该分类下的待办
   */
  onCategoryTap(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/index/index?categoryId=${id}&categoryName=${name}`
    })
  },

  /**
   * 长按分类 - 编辑/删除
   */
  onCategoryLongPress(e) {
    const { id, name, index } = e.currentTarget.dataset
    const itemList = ['编辑', '删除']
    wx.showActionSheet({
      itemList,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editCategory(id, name)
        } else if (res.tapIndex === 1) {
          this.deleteCategory(id, name)
        }
      }
    })
  },

  /**
   * 添加分类
   */
  onAddCategory() {
    this.setData({ showAddCategory: true, newCategoryName: '', newCategoryColor: CATEGORY_COLORS[0] })
  },

  onNewNameInput(e) {
    this.setData({ newCategoryName: e.detail })
  },

  onColorSelect(e) {
    const { color } = e.currentTarget.dataset
    this.setData({ newCategoryColor: color })
  },

  async onCategoryAddConfirm() {
    const { newCategoryName, newCategoryColor } = this.data
    if (!newCategoryName.trim()) {
      showToast('请输入分类名称', 'error')
      return
    }

    try {
      await callCloudWithLoading('todo', 'createCategory', {
        familyId: store.currentFamilyId,
        name: newCategoryName.trim(),
        color: newCategoryColor
      })
      showToast('添加成功', 'success')
      this.setData({ showAddCategory: false })
      store.refreshCategories()
      this.loadCategories()
    } catch (err) {
      console.error('添加分类失败:', err)
    }
  },

  onAddClose() {
    this.setData({ showAddCategory: false })
  },

  /**
   * 编辑分类
   */
  editCategory(id, name) {
    this.setData({
      showAddCategory: true,
      newCategoryName: name,
      editingCategoryId: id
    })
  },

  /**
   * 删除分类
   */
  async deleteCategory(id, name) {
    const confirmed = await showConfirm('确认删除', `确定要删除分类"${name}"吗？该分类下的待办不会被删除。`)
    if (!confirmed) return

    try {
      await callCloudWithLoading('todo', 'deleteCategory', { categoryId: id }, '删除中...')
      showToast('已删除')
      store.refreshCategories()
      this.loadCategories()
    } catch (err) {
      console.error('删除分类失败:', err)
    }
  }
})
