// components/stat-chart/index.js
/**
 * 统计图表组件
 * 支持饼图(pie)和折线图(line)两种类型
 * 使用 Canvas 绘制，轻量无需引入第三方库
 */

Component({
  properties: {
    type: {
      type: String,
      value: 'pie' // pie / line
    },
    data: {
      type: Array,
      value: []
    },
    height: {
      type: Number,
      value: 300
    }
  },

  observers: {
    'data': function (data) {
      if (data && data.length > 0) {
        this.drawChart()
      }
    }
  },

  data: {
    canvasId: 'statChart'
  },

  methods: {
    drawChart() {
      if (this.properties.type === 'pie') {
        this.drawPie()
      } else {
        this.drawLine()
      }
    },

    /**
     * 绘制饼图
     */
    drawPie() {
      const query = wx.createSelectorQuery().in(this)
      query.select('.chart-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = wx.getSystemInfoSync().pixelRatio
          const width = res[0].width
          const height = res[0].height
          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)

          const data = this.properties.data
          const total = data.reduce((sum, item) => sum + (item.count || item.value || 0), 0)
          if (total === 0) return

          const centerX = width / 2
          const centerY = height / 2
          const radius = Math.min(width, height) / 2 - 40

          let startAngle = -Math.PI / 2

          data.forEach((item) => {
            const value = item.count || item.value || 0
            const sliceAngle = (value / total) * 2 * Math.PI

            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
            ctx.closePath()
            ctx.fillStyle = item.color || '#007AFF'
            ctx.fill()

            // 绘制标签
            const midAngle = startAngle + sliceAngle / 2
            const labelRadius = radius * 0.7
            const labelX = centerX + Math.cos(midAngle) * labelRadius
            const labelY = centerY + Math.sin(midAngle) * labelRadius

            const percent = Math.round((value / total) * 100)
            if (percent >= 5) {
              ctx.fillStyle = '#FFFFFF'
              ctx.font = '11px PingFang SC'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(`${percent}%`, labelX, labelY)
            }

            startAngle += sliceAngle
          })

          // 中心镂空
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI)
          ctx.fillStyle = '#FFFFFF'
          ctx.fill()
        })
    },

    /**
     * 绘制折线图
     */
    drawLine() {
      const query = wx.createSelectorQuery().in(this)
      query.select('.chart-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = wx.getSystemInfoSync().pixelRatio
          const width = res[0].width
          const height = res[0].height
          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)

          const data = this.properties.data
          if (data.length === 0) return

          const padding = { top: 20, right: 30, bottom: 40, left: 40 }
          const chartWidth = width - padding.left - padding.right
          const chartHeight = height - padding.top - padding.bottom

          const maxVal = Math.max(...data.map(d => d.count || d.value || 0), 1)

          // 绘制网格线
          ctx.strokeStyle = '#F2F2F7'
          ctx.lineWidth = 1
          for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(width - padding.right, y)
            ctx.stroke()
          }

          // 绘制折线
          const points = data.map((item, index) => ({
            x: padding.left + (chartWidth / Math.max(data.length - 1, 1)) * index,
            y: padding.top + chartHeight - ((item.count || item.value || 0) / maxVal) * chartHeight,
            label: item.label || item.name || '',
            value: item.count || item.value || 0
          }))

          // 渐变填充
          const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
          gradient.addColorStop(0, 'rgba(0, 122, 255, 0.2)')
          gradient.addColorStop(1, 'rgba(0, 122, 255, 0.02)')

          ctx.beginPath()
          ctx.moveTo(points[0].x, height - padding.bottom)
          points.forEach((p) => ctx.lineTo(p.x, p.y))
          ctx.lineTo(points[points.length - 1].x, height - padding.bottom)
          ctx.closePath()
          ctx.fillStyle = gradient
          ctx.fill()

          // 线条
          ctx.beginPath()
          ctx.strokeStyle = '#007AFF'
          ctx.lineWidth = 2.5
          ctx.lineJoin = 'round'
          points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          })
          ctx.stroke()

          // 数据点和标签
          points.forEach((p) => {
            // 圆点
            ctx.beginPath()
            ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
            ctx.fillStyle = '#007AFF'
            ctx.fill()
            ctx.beginPath()
            ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI)
            ctx.fillStyle = '#FFFFFF'
            ctx.fill()

            // X轴标签
            ctx.fillStyle = '#86868B'
            ctx.font = '10px PingFang SC'
            ctx.textAlign = 'center'
            ctx.fillText(p.label, p.x, height - padding.bottom + 16)
          })
        })
    }
  }
})
