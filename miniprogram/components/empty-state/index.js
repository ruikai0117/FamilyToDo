// components/empty-state/index.js
Component({
  properties: {
    type: {
      type: String,
      value: 'todo' // todo / family / stats
    }
  },

  data: {
    config: {
      todo: {
        icon: 'todo-list-o',
        title: '暂无待办',
        desc: '点击右下角按钮添加第一个待办吧'
      },
      family: {
        icon: 'home-o',
        title: '还没有家庭',
        desc: '创建或加入一个家庭开始协作'
      },
      stats: {
        icon: 'chart-trending-o',
        title: '暂无数据',
        desc: '完成一些待办后即可查看统计'
      }
    }
  }
})
