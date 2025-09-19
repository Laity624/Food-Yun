const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    recommendRecipes: [],
    loading: true
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

    // 已登录，更新用户信息并加载数据
    this.setData({
      userInfo: app.globalData.userInfo,
      hasUserInfo: true
    })
    
    this.loadRecommendRecipes()
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
        loading: false
      })
    }, 1000)
  },

  onFriendsClick: function() {
    if (!this.data.hasUserInfo) {
      util.showError('请先登录')
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
      util.showError('请先登录')
      return
    }
    wx.navigateTo({
      url: '/pages/recipe-form/recipe-form'
    })
  },

  onOrderClick: function() {
    wx.switchTab({
      url: '/pages/order/order'
    })
  }
})