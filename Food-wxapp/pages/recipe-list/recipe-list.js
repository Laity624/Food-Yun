const util = require('../../utils/util')
const { getTagOptions, getAllTags } = require('../../utils/tagData')

Page({
  data: {
    recipes: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
    // 搜索相关
    searchValue: '',
    showSearch: false,
    // 筛选相关
    showFilter: false,
    tagOptions: [],
    selectedTags: [],
    // 快速筛选分类（基于标签）
    quickFilters: [
      { name: '全部', tag: null },
      { name: '家常菜', tag: '家常菜' },
      { name: '川菜', tag: '川菜' },
      { name: '素食', tag: '素食' },
      { name: '快手菜', tag: '快手菜' },
      { name: '下饭菜', tag: '下饭菜' },
      { name: '宴客菜', tag: '宴客菜' }
    ],
    currentQuickFilter: null
  },

  onLoad: function (options) {
    // 初始化标签数据
    this.setData({
      tagOptions: getTagOptions()
    })
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
    const { page, pageSize, currentQuickFilter, searchValue, selectedTags } = this.data
    
    // 合并快速筛选和标签筛选
    let allTags = [...selectedTags]
    if (currentQuickFilter) {
      allTags.push(currentQuickFilter)
    }
    
    util.callCloudFunction('recipe', {
      action: 'list',
      page,
      pageSize,
      search: searchValue,
      tags: allTags
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

  onQuickFilterChange: function(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({
      currentQuickFilter: tag
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
  },

  // 搜索相关方法
  onSearchClick: function() {
    this.setData({
      showSearch: !this.data.showSearch
    })
  },

  onSearchInput: function(e) {
    this.setData({
      searchValue: e.detail.value
    })
  },

  onSearchConfirm: function() {
    this.refreshData()
  },

  onSearchClear: function() {
    this.setData({
      searchValue: '',
      showSearch: false
    })
    this.refreshData()
  },

  // 筛选相关方法
  onFilterClick: function() {
    this.setData({
      showFilter: !this.data.showFilter
    })
  },

  onTagToggle: function(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tag)

    // 检查是否与当前快速筛选冲突
    if (tag === this.data.currentQuickFilter) {
      wx.showToast({
        title: '该标签已在快速筛选中选择',
        icon: 'none'
      })
      return
    }

    if (index !== -1) {
      selectedTags.splice(index, 1)
    } else {
      if (selectedTags.length >= 5) {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        })
        return
      }
      selectedTags.push(tag)
    }

    this.setData({
      selectedTags
    })
  },

  onFilterConfirm: function() {
    this.setData({
      showFilter: false
    })
    this.refreshData()
  },

  onFilterReset: function() {
    this.setData({
      selectedTags: [],
      currentQuickFilter: null
    })
  },

  // 移除选中的标签
  onRemoveTag: function(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = this.data.selectedTags.filter(t => t !== tag)
    this.setData({
      selectedTags
    })
    this.refreshData()
  },

  // 检查标签是否已被选择（包括快速筛选）
  isTagSelected: function(tag) {
    return this.data.selectedTags.includes(tag) || this.data.currentQuickFilter === tag
  }
})