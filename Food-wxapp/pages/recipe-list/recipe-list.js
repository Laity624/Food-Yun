const util = require('../../utils/util')

Page({
  data: {
    recipes: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
    categories: ['全部', '家常菜', '汤品', '甜品', '素食', '海鲜'],
    currentCategory: '全部'
  },

  onLoad: function (options) {
    this.loadRecipes()
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.refreshData()
  },

  onPullDownRefresh: function () {
    this.refreshData()
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  refreshData: function() {
    this.setData({
      recipes: [],
      page: 1,
      hasMore: true,
      loading: true
    })
    this.loadRecipes()
  },

  loadRecipes: function() {
    const { page, pageSize, currentCategory } = this.data
    
    util.callCloudFunction('recipe', {
      action: 'list',
      page,
      pageSize,
      category: currentCategory === '全部' ? null : currentCategory
    }).then(res => {
      const newRecipes = res.data.recipes || []
      this.setData({
        recipes: page === 1 ? newRecipes : [...this.data.recipes, ...newRecipes],
        hasMore: newRecipes.length === pageSize,
        loading: false
      })
      wx.stopPullDownRefresh()
    }).catch(err => {
      this.setData({
        loading: false
      })
      wx.stopPullDownRefresh()
      util.showError('加载失败')
      console.error('加载菜谱列表失败', err)
    })
  },

  loadMore: function() {
    this.setData({
      page: this.data.page + 1,
      loading: true
    })
    this.loadRecipes()
  },

  onCategoryChange: function(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category
    })
    this.refreshData()
  },

  onRecipeClick: function(e) {
    const recipeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/recipe-detail/recipe-detail?id=${recipeId}`
    })
  },

  onAddClick: function() {
    wx.navigateTo({
      url: '/pages/recipe-form/recipe-form'
    })
  }
})