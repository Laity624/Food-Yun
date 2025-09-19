# 登录提示组件 - 优化版

一个美观、现代化的登录提示弹窗组件，具有流畅的动画效果和精美的UI设计，用于在用户需要登录才能使用的功能处显示登录提示。

## 样式特性

### 🎨 视觉设计
- **渐变背景**: 使用渐变色背景提升视觉层次感
- **圆角设计**: 现代化的圆角边框和按钮
- **阴影效果**: 精致的阴影提升立体感
- **图标支持**: 支持显示相关图标增强视觉效果

### ✨ 动画效果
- **淡入动画**: 弹窗出现时的平滑淡入效果
- **缩放动画**: 内容区域的缩放入场动画
- **点击反馈**: 按钮点击时的动画反馈
- **涟漪效果**: 按钮点击时的涟漪动画

### 🎯 交互体验
- **模糊背景**: 背景使用毛玻璃模糊效果
- **关闭按钮**: 精致的关闭按钮设计
- **响应式设计**: 适配不同屏幕尺寸
- **触摸反馈**: 所有交互元素都有触摸反馈

## 使用方法

### 1. 引入组件

在页面的 JSON 配置文件中引入组件：

```json
{
  "usingComponents": {
    "login-prompt": "/components/login-prompt/login-prompt"
  }
}
```

### 2. 在 WXML 中添加组件

```xml
<login-prompt 
  id="loginPrompt"
  visible="{{showLoginPrompt}}"
  content="{{promptContent}}"
  bind:close="onPromptClose"
  bind:login="onPromptLogin"
/>
```

### 3. 在 JS 中控制组件

```javascript
Page({
  data: {
    showLoginPrompt: false,
    promptContent: ''
  },

  // 需要登录的功能
  onSomeFunction: function() {
    const app = getApp()
    
    if (!app.isLoggedIn()) {
      this.setData({
        showLoginPrompt: true,
        promptContent: '请登录后使用此功能'
      })
    } else {
      // 执行正常功能
    }
  },

  // 关闭提示
  onPromptClose: function() {
    this.setData({ showLoginPrompt: false })
  },

  // 跳转到登录页
  onPromptLogin: function() {
    this.setData({ showLoginPrompt: false })
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
```

## 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | Boolean | false | 是否显示弹窗 |
| title | String | '登录提示' | 弹窗标题 |
| content | String | '您需要登录后才能使用此功能' | 提示内容 |
| description | String | '登录后可以享受完整的功能体验' | 描述文字 |

## 组件事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| close | 关闭弹窗时触发 | 无 |
| login | 点击立即登录时触发 | 无 |

## 示例

### 在预览模式下提示

```javascript
handleFunction: function() {
  const app = getApp()
  
  if (app.globalData.isPreviewMode) {
    this.setData({
      showLoginPrompt: true,
      promptContent: '此功能需要登录后使用'
    })
  }
}
```

### 自定义提示内容

```javascript
showCustomPrompt: function() {
  this.setData({
    showLoginPrompt: true,
    promptContent: '收藏功能需要登录',
    promptTitle: '收藏提示'
  })
}
```

## 最佳实践

1. **统一处理登录状态**：在所有需要登录的功能入口处使用此组件
2. **友好的提示文案**：根据具体功能提供明确的提示信息
3. **一致的交互体验**：保持弹窗样式和交互的一致性
4. **避免重复提示**：在用户已经看到提示后，不要频繁重复显示