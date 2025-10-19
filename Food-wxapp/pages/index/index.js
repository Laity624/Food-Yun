const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    recommendRecipes: [],
    loading: true,
    showLoginPrompt: false,
    promptContent: '',
    isDataLoaded: false
  },

  onLoad: function () {
    this.checkLoginAndLoad()
  },

  onShow: function () {
    // 只在数据未加载时才检查登录和加载数据
    if (!this.data.isDataLoaded) {
      this.checkLoginAndLoad()
    }
    
    // 更新自定义tabbar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 'home'
      })
    }
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad: function() {
    // 允许预览模式访问
    if (app.globalData.isPreviewMode) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: false,
        isPreviewMode: true
      })
      this.loadRecommendRecipes()
      return
    }

    // 检查是否已登录
    if (app.isLoggedIn()) {
      // 已登录，更新用户信息并加载数据
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        isPreviewMode: false
      })
      this.loadRecommendRecipes()
    } else {
      // 未登录，检查是否有本地用户信息但没有openid的情况
      const localUserInfo = wx.getStorageSync('userInfo')
      if (localUserInfo) {
        // 有本地用户信息但没有openid，尝试重新登录
        this.setData({
          userInfo: localUserInfo,
          hasUserInfo: false,
          isPreviewMode: false,
          showLoginPrompt: true,
          promptContent: '检测到本地用户信息，需要重新登录以获取完整权限'
        })
      } else {
        // 完全没有登录信息，跳转到登录页
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    }
  },


  loadRecommendRecipes: function() {
    // 暂时使用模拟数据，等recipe云函数部署后再调用
    setTimeout(() => {
      this.setData({
        recommendRecipes: [
          {
            _id: '1',
            title: '红烧肉',
            description: '经典家常菜，肥而不腻，入口即化',
            image: '/images/红烧肉.png',
            cookTime: 60,
            rating: 4.8,
            views: '1.2k',
            isVegetarian: false
          },
          {
            _id: '2', 
            title: '番茄鸡蛋',
            description: '经典家常菜，营养丰富又美味',
            image: '/images/default-recipe.png',
            cookTime: 15,
            rating: 4.6,
            views: '856',
            isVegetarian: true
          }
        ],
        loading: false,
        isDataLoaded: true  // 数据加载完成，标记为已加载
      })
    }, 1000)
  },

  onFriendsClick: function() {
    if (!this.data.hasUserInfo) {
      this.setData({
        showLoginPrompt: true,
        promptContent: '好友功能需要登录后使用'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/friends/friends'
    })
  },

  onMoreClick: function() {
    wx.switchTab({
      url: '/pages/recipe-list/recipe-list'
    })
  },

  onRecipeClick: function(e) {
    const recipeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/recipe-detail/recipe-detail?id=${recipeId}`
    })
  },

  onSearchClick: function() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  onAddRecipeClick: function() {
    if (!this.data.hasUserInfo) {
      this.setData({
        showLoginPrompt: true,
        promptContent: '发布菜谱需要登录后使用'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/recipe-form/recipe-form'
    })
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

  onOrderClick: function() {
    wx.switchTab({
      url: '/pages/order/order'
    })
  }
})