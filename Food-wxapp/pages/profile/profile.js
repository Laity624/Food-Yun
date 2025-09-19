const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userInfo: null
  },

  onLoad: function () {
    this.checkLoginAndLoad()
  },

  onShow: function () {
    this.checkLoginAndLoad()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad: function() {
    if (!app.isLoggedIn()) {
      // 未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 已登录，更新用户信息
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  // 我的菜谱
  onMyRecipes: function() {
    wx.navigateTo({
      url: '/pages/recipe-list/recipe-list?type=my'
    })
  },

  // 我的订单
  onMyOrders: function() {
    wx.navigateTo({
      url: '/pages/order-list/order-list'
    })
  },

  // 我的好友
  onMyFriends: function() {
    wx.navigateTo({
      url: '/pages/friends/friends'
    })
  },

  // 设置
  onSettings: function() {
    util.showError('设置功能开发中')
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