// components/category-picker/index.js
Component({
  properties: {
    categories: {
      type: Array,
      value: []
    },
    selected: {
      type: String,
      value: ''
    }
  },

  methods: {
    onSelect(e) {
      const { index } = e.currentTarget.dataset
      this.triggerEvent('confirm', { index })
    },

    onClose() {
      this.triggerEvent('close')
    }
  }
})
