const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false
  },

  onLoad: function () {
    // 检查是否支持新的getUserProfile接口
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }

    // 检查是否已经登录
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function() {
    if (app.globalData.userInfo && app.globalData.openid) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },

  // 获取用户信息（新版本）
  getUserProfile: function(e) {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.login(res.userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败', err)
        util.showError('获取用户信息失败')
      }
    })
  },

  // 获取用户信息（旧版本）
  getUserInfo: function(e) {
    if (e.detail.userInfo) {
      this.login(e.detail.userInfo)
    } else {
      util.showError('需要授权才能使用完整功能')
    }
  },

  // 登录
  login: function(userInfo) {
    util.showLoading('登录中...')
    
    app.login(userInfo).then(res => {
      this.setData({
        userInfo: res.userInfo,
        hasUserInfo: true
      })
      util.hideLoading()
      
      // 登录成功后直接跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      })
    }).catch(err => {
      util.hideLoading()
      util.showError('登录失败')
      console.error('登录失败', err)
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
        
        // 更新页面状态
        this.setData({
          userInfo: null,
          hasUserInfo: false
        })
        
        util.showSuccess('已退出登录')
      }
    })
  },

  // 进入应用（重新登录但不更新用户信息）
  enterApp: function() {
    util.showLoading('登录中...')
    
    // 重新登录但不传入用户信息，避免覆盖自定义头像
    app.login(null).then(res => {
      this.setData({
        userInfo: res.userInfo,
        hasUserInfo: true
      })
      util.hideLoading()
      
      // 登录成功后直接跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      })
    }).catch(err => {
      util.hideLoading()
      util.showError('登录失败')
      console.error('登录失败', err)
    })
  },

  // 进入预览模式
  enterPreviewMode: function() {
    const app = getApp()
    app.globalData.isPreviewMode = true
    
    // 跳转到首页
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})