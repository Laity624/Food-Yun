const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    showLoginPrompt: false,
    promptContent: ''
  },

  onLoad: function () {
    this.checkLoginAndLoad()
  },

  onShow: function () {
    this.checkLoginAndLoad()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad: function() {
    const app = getApp()
    
    // 允许预览模式访问
    if (!app.isLoggedIn() && !app.globalData.isPreviewMode) {
      // 未登录且不是预览模式，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 已登录或预览模式，更新用户信息
    this.setData({
      userInfo: app.globalData.userInfo,
      isPreviewMode: app.globalData.isPreviewMode
    })
    
    // 如果是预览模式，显示欢迎信息
    if (app.globalData.isPreviewMode) {
      this.setData({
        userInfo: {
          nickname: '预览用户',
          avatar: '/images/default-avatar.png'
        }
      })
    }
  },

  // 处理预览模式提示和功能跳转
  handlePreviewMode: function(message, callback) {
    const app = getApp()
    
    if (app.globalData.isPreviewMode || !app.isLoggedIn()) {
      this.setData({
        showLoginPrompt: true,
        promptContent: message
      })
    } else {
      // 已登录，执行相应的功能
      callback && callback()
    }
  },

  // 关闭提示弹窗
  onPromptClose: function() {
    this.setData({ showLoginPrompt: false })
  },

  // 点击立即登录
  onPromptLogin: function() {
    this.setData({ showLoginPrompt: false })
    wx.navigateTo({ url: '/pages/login/login' })
  },

  // 我的菜谱
  onMyRecipes: function() {
    this.handlePreviewMode('查看菜谱需要登录后使用', () => {
      wx.navigateTo({
        url: '/pages/recipe-list/recipe-list?type=my'
      })
    })
  },

  // 我的订单
  onMyOrders: function() {
    this.handlePreviewMode('查看订单需要登录后使用', () => {
      wx.navigateTo({
        url: '/pages/order-list/order-list'
      })
    })
  },

  // 我的好友
  onMyFriends: function() {
    this.handlePreviewMode('好友功能需要登录后使用', () => {
      wx.navigateTo({
        url: '/pages/friends/friends'
      })
    })
  },

  // 设置
  onSettings: function() {
    this.handlePreviewMode('设置功能需要登录后使用', () => {
      util.showError('设置功能开发中')
    })
  },

  // 退出登录
  logout: function() {
    util.showConfirm('确定要退出登录吗？').then(confirm => {
      if (confirm) {
        // 清除全局数据
        app.globalData.userInfo = null
        app.globalData.openid = null
        
        // 清除本地存储
        wx.removeStorageSync('userInfo')
        
        util.showSuccess('已退出登录')
        
        // 跳转到登录页
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    })
  }
})