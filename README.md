# 🏠 家待办 - 家庭待办事项管理小程序

一款面向家庭的待办事项管理微信小程序，支持多成员协作完成家庭日常任务。

## ✨ 功能特性

- **待办管理** — 创建/编辑/删除/完成待办，支持优先级、截止日期
- **家庭协作** — 创建家庭空间，邀请码邀请，多成员分配任务
- **分类标签** — 自定义分类和标签体系，按分类/标签筛选
- **提醒通知** — 微信订阅消息实现到期提醒
- **数据看板** — 完成率统计、成员贡献排行、趋势图表
- **多家庭切换** — 支持同时加入多个家庭，快速切换

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生开发 (WXML/WXSS/JS) |
| UI 组件 | Vant Weapp |
| 后端 | 微信云开发 (云数据库 + 云函数) |
| 图表 | Canvas 自绘 (轻量无需第三方库) |

## 📁 项目结构

```
family-todo/
├── cloudfunctions/           # 云函数
│   ├── common/               # 公共模块（权限校验、错误处理）
│   ├── user/                 # 用户相关（登录、信息、切换家庭）
│   ├── family/               # 家庭相关（创建、加入、成员管理）
│   ├── todo/                 # 待办相关（CRUD、分类管理）
│   ├── stats/                # 统计相关（看板数据聚合）
│   └── notify/               # 通知相关（订阅消息、到期提醒）
├── miniprogram/              # 小程序前端
│   ├── app.js                # 入口，云开发初始化
│   ├── app.json              # 全局配置
│   ├── app.wxss              # 全局样式
│   ├── components/           # 自定义组件
│   │   ├── todo-card/        # 待办卡片
│   │   ├── category-picker/  # 分类选择器
│   │   ├── member-avatar/    # 成员头像
│   │   ├── empty-state/      # 空状态占位
│   │   └── stat-chart/       # 统计图表
│   ├── pages/                # 页面
│   │   ├── index/            # 待办列表（首页）
│   │   ├── todo-detail/      # 待办详情/编辑
│   │   ├── category/         # 分类管理
│   │   ├── stats/            # 数据统计
│   │   ├── family/           # 家庭管理
│   │   └── member-manage/    # 成员管理
│   ├── store/                # 状态管理
│   ├── utils/                # 工具函数
│   └── styles/               # 样式变量
└── README.md
```

## 🚀 快速开始

### 1. 环境准备

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新版
- 微信小程序 AppID（在 [微信公众平台](https://mp.weixin.qq.com/) 注册获取）

### 2. 导入项目

1. 打开微信开发者工具
2. 选择「导入项目」
3. 目录选择 `family-todo`
4. 填入你的 AppID
5. 点击确定

### 3. 开通云开发

1. 在微信开发者工具中，点击「云开发」按钮
2. 开通云开发环境，记录环境 ID
3. 在 `app.js` 中的 `wx.cloud.init()` 填入环境 ID（可选，默认自动匹配）

### 4. 创建数据库集合

在云开发控制台创建以下集合：

| 集合名 | 说明 |
|--------|------|
| users | 用户信息 |
| families | 家庭空间 |
| todos | 待办事项 |
| categories | 分类定义 |
| tags | 标签定义 |
| subscriptions | 订阅记录 |

> 建议为每个集合设置权限规则：**仅创建者可读写**

### 5. 部署云函数

1. 在微信开发者工具中，右键点击 `cloudfunctions` 目录下的每个云函数
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

### 6. 安装 Vant Weapp

```bash
cd miniprogram
npm init -y
npm i @vant/weapp -S --production
```

然后在微信开发者工具中：
1. 菜单 → 工具 → 构建 npm
2. 构建完成后即可使用 Vant 组件

### 7. 配置订阅消息（可选）

1. 在微信公众平台 → 订阅消息 → 添加模板
2. 将模板 ID 填入 `utils/constants.js` 的 `SUBSCRIBE_TEMPLATE`

## 🎨 设计风格

采用简洁现代风格，参考 Apple Reminders 的极简设计理念：
- 白色/浅灰主背景
- 蓝色主色调 (#007AFF)
- 圆角卡片式布局
- 清爽留白，视觉层次分明

## 📄 许可

MIT License
