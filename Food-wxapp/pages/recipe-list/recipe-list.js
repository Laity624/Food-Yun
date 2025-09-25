const util = require('../../utils/util')
const { 
  getSceneCategories, 
  getIngredientCategories,
  getCookingMethods,
  getFlavorTypes,
  getSceneCategoryById,
  getIngredientCategoryById,
  getPreparationTimes
} = require('../../utils/tagData')

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
    sceneCategories: [],
    ingredientCategories: [],
    cookingMethods: [],
    flavorTypes: [],
    selectedScenes: [],
    selectedIngredients: [],
    selectedOptionalTags: [],
    
    // 高级筛选
    selectedTime: '',
    
    // 制作时间选项（使用公共枚举）
    timeOptions: [],
    
    // 计算属性
    selectedFiltersCount: 0,
    hasActiveFilters: false,
    currentQuickFilterName: '',
    selectedScenesDisplay: [],
    selectedIngredientsDisplay: [],
    selectedOptionalTagsDisplay: [],
    allOptionalTags: [],
    
    // 快速筛选（场景分类）
    quickFilters: [
      { name: '全部', sceneId: null, emoji: '🍽️' },
      { name: '日常', sceneId: 'daily', emoji: '📅' },
      { name: '快手', sceneId: 'quick', emoji: '🚀' },
      { name: '宴客', sceneId: 'guest', emoji: '🎉' },
      { name: '清淡', sceneId: 'light', emoji: '🥗' },
      { name: '重口味', sceneId: 'heavy', emoji: '🔥' }
    ],
    currentQuickFilter: null
  },

  onLoad: function (options) {
    // 初始化分类数据
    this.setData({
      sceneCategories: getSceneCategories(),
      ingredientCategories: getIngredientCategories(),
      cookingMethods: getCookingMethods(),
      flavorTypes: getFlavorTypes(),
      // 初始化时间选项（在正确的this上下文中）
      timeOptions: getPreparationTimes().map(time => ({
        id: time.value,
        label: time.label,
        emoji: this.getTimeEmoji(time.value),
        value: parseInt(time.value)
      }))
    })
    this.updateComputedData()
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
    const { 
      page, 
      pageSize, 
      searchValue, 
      selectedScenes,
      selectedIngredients,
      selectedOptionalTags,
      currentQuickFilter
    } = this.data
    
    // 构建筛选参数
    let sceneCategories = [...selectedScenes]
    if (currentQuickFilter) {
      sceneCategories.push(currentQuickFilter)
    }
    
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'list',
        page,
        pageSize,
        search: searchValue,
        sceneCategories: sceneCategories.length > 0 ? sceneCategories : undefined,
        ingredientCategories: selectedIngredients.length > 0 ? selectedIngredients : undefined,
        optionalTags: selectedOptionalTags.length > 0 ? selectedOptionalTags : undefined
      }
    }).then(res => {
      console.log('菜谱列表云函数调用结果:', res)
      if (res.result.success) {
        const newRecipes = res.result.data.recipes || []
        console.log('获取到的菜谱数据:', newRecipes)
        console.log('菜谱数量:', newRecipes.length)
        if (newRecipes.length > 0) {
          console.log('第一个菜谱的ID:', newRecipes[0]._id)
        }
        this.setData({
          recipes: page === 1 ? newRecipes : [...this.data.recipes, ...newRecipes],
          hasMore: newRecipes.length === pageSize,
          loading: false
        })
      } else {
        console.error('菜谱列表加载失败:', res.result)
        this.setData({ loading: false })
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
      }
      wx.stopPullDownRefresh()
    }).catch(err => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
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

  // 快速筛选
  onQuickFilterChange: function(e) {
    const sceneId = e.currentTarget.dataset.sceneid
    this.setData({
      currentQuickFilter: sceneId,
      selectedScenes: [] // 清空场景筛选，避免冲突
    })
    this.updateComputedData()
    this.refreshData()
  },

  // 菜谱点击
  onRecipeClick: function(e) {
    const recipeId = e.currentTarget.dataset.id
    console.log('点击菜谱，recipeId:', recipeId)
    console.log('dataset:', e.currentTarget.dataset)
    wx.navigateTo({
      url: `/pages/recipe-detail/recipe-detail?id=${recipeId}`
    })
  },

  // 添加菜谱
  onAddClick: function() {
    wx.navigateTo({
      url: '/pages/recipe-form/recipe-form'
    })
  },

  // 搜索功能
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

  // 筛选功能
  onFilterClick: function() {
    this.setData({
      showFilter: !this.data.showFilter
    })
  },

  // 场景分类选择
  onSceneToggle: function(e) {
    const sceneId = e.currentTarget.dataset.id
    const selectedScenes = [...this.data.selectedScenes]
    const index = selectedScenes.indexOf(sceneId)

    // 检查是否与快速筛选冲突
    if (sceneId === this.data.currentQuickFilter) {
      wx.showToast({
        title: '该场景已在快速筛选中选择',
        icon: 'none'
      })
      return
    }

    if (index !== -1) {
      selectedScenes.splice(index, 1)
    } else {
      if (selectedScenes.length >= 3) {
        wx.showToast({
          title: '最多选择3个场景',
          icon: 'none'
        })
        return
      }
      selectedScenes.push(sceneId)
    }

    this.setData({
      selectedScenes,
      currentQuickFilter: null // 清空快速筛选
    })
    this.updateComputedData()
  },

  // 食材分类选择
  onIngredientToggle: function(e) {
    const ingredientId = e.currentTarget.dataset.id
    const selectedIngredients = [...this.data.selectedIngredients]
    const index = selectedIngredients.indexOf(ingredientId)

    if (index !== -1) {
      selectedIngredients.splice(index, 1)
    } else {
      if (selectedIngredients.length >= 3) {
        wx.showToast({
          title: '最多选择3个食材',
          icon: 'none'
        })
        return
      }
      selectedIngredients.push(ingredientId)
    }

    this.setData({
      selectedIngredients
    })
    this.updateComputedData()
  },

  // 可选标签选择
  onOptionalTagToggle: function(e) {
    const tagId = e.currentTarget.dataset.id
    const selectedOptionalTags = [...this.data.selectedOptionalTags]
    const index = selectedOptionalTags.indexOf(tagId)

    if (index !== -1) {
      selectedOptionalTags.splice(index, 1)
    } else {
      if (selectedOptionalTags.length >= 5) {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        })
        return
      }
      selectedOptionalTags.push(tagId)
    }

    this.setData({
      selectedOptionalTags
    })
    this.updateComputedData()
  },

  // 应用筛选
  onFilterConfirm: function() {
    this.setData({
      showFilter: false
    })
    this.refreshData()
  },

  // 重置筛选
  onFilterReset: function() {
    this.resetAllFilters()
  },

  // 移除选中的筛选条件
  onRemoveScene: function(e) {
    const sceneId = e.currentTarget.dataset.id
    const selectedScenes = this.data.selectedScenes.filter(id => id !== sceneId)
    this.setData({ selectedScenes })
    this.updateComputedData()
    this.refreshData()
  },

  onRemoveIngredient: function(e) {
    const ingredientId = e.currentTarget.dataset.id
    const selectedIngredients = this.data.selectedIngredients.filter(id => id !== ingredientId)
    this.setData({ selectedIngredients })
    this.updateComputedData()
    this.refreshData()
  },

  onRemoveOptionalTag: function(e) {
    const tagId = e.currentTarget.dataset.id
    const selectedOptionalTags = this.data.selectedOptionalTags.filter(id => id !== tagId)
    this.setData({ selectedOptionalTags })
    this.updateComputedData()
    this.refreshData()
  },

  onRemoveQuickFilter: function() {
    this.setData({
      currentQuickFilter: null
    })
    this.updateComputedData()
    this.refreshData()
  },

  // 移除时间筛选
  onRemoveTimeFilter: function() {
    this.setData({
      selectedTime: ''
    })
    this.updateComputedData()
    this.refreshData()
  },


  // 时间筛选
  onTimeFilterToggle: function(e) {
    const timeId = e.currentTarget.dataset.time
    const currentTime = this.data.selectedTime
    
    // 如果点击的是已选中的时间，则取消选择
    const newTime = currentTime === timeId ? '' : timeId
    
    this.setData({
      selectedTime: newTime
    })
    
    this.updateComputedData()
    
    // 获取时间选项信息用于日志
    const timeOption = this.data.timeOptions.find(t => t.id === newTime)
    console.log('时间筛选:', newTime, timeOption ? timeOption.label : '无')
  },


  // 重置所有筛选条件
  onResetAllFilters: function() {
    wx.showModal({
      title: '重置筛选',
      content: '确定要清空所有筛选条件吗？',
      confirmText: '重置',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.resetAllFilters()
        }
      }
    })
  },

  // 执行重置操作
  resetAllFilters: function() {
    this.setData({
      // 重置快速筛选
      currentQuickFilter: null,
      // 重置场景筛选
      selectedScenes: [],
      // 重置食材筛选
      selectedIngredients: [],
      // 重置可选标签筛选
      selectedOptionalTags: [],
      // 重置时间筛选
      selectedTime: '',
      // 重置搜索
      searchValue: '',
      showSearch: false,
      // 关闭筛选面板
      showFilter: false
    })
    
    // 更新计算属性
    this.updateComputedData()
    
    // 刷新数据
    this.refreshData()
    
    // 显示提示
    wx.showToast({
      title: '已重置筛选条件',
      icon: 'success',
      duration: 1500
    })
  },

  // 更新计算属性
  updateComputedData: function() {
    const { selectedScenes, selectedIngredients, selectedOptionalTags, currentQuickFilter, selectedTime, quickFilters, sceneCategories, ingredientCategories, cookingMethods, flavorTypes, timeOptions } = this.data
    let count = selectedScenes.length + selectedIngredients.length + selectedOptionalTags.length
    if (currentQuickFilter) count += 1
    if (selectedTime) count += 1
    
    // 计算当前快速筛选的名称
    let currentQuickFilterName = ''
    if (currentQuickFilter) {
      const quickFilter = quickFilters.find(f => f.sceneId === currentQuickFilter)
      currentQuickFilterName = quickFilter ? quickFilter.name : ''
    }
    
    // 计算当前时间筛选的标签
    let selectedTimeLabel = ''
    if (selectedTime) {
      const timeOption = timeOptions.find(t => t.id === selectedTime)
      selectedTimeLabel = timeOption ? timeOption.label : ''
    }
    
    // 计算选中场景的显示名称
    const selectedScenesDisplay = selectedScenes.map(sceneId => {
      const scene = sceneCategories.find(s => s.id === sceneId)
      return scene ? scene.name : ''
    })
    
    // 计算选中食材的显示名称
    const selectedIngredientsDisplay = selectedIngredients.map(ingredientId => {
      const ingredient = ingredientCategories.find(i => i.id === ingredientId)
      return ingredient ? ingredient.name : ''
    })
    
    // 计算选中可选标签的显示名称
    const allOptionalTags = [...cookingMethods, ...flavorTypes]
    const selectedOptionalTagsDisplay = selectedOptionalTags.map(tagId => {
      const tag = allOptionalTags.find(t => t.id === tagId)
      return tag ? tag.name : ''
    })
    
    this.setData({
      selectedFiltersCount: count,
      hasActiveFilters: count > 0,
      currentQuickFilterName: currentQuickFilterName,
      selectedTimeLabel: selectedTimeLabel,
      selectedScenesDisplay: selectedScenesDisplay,
      selectedIngredientsDisplay: selectedIngredientsDisplay,
      selectedOptionalTagsDisplay: selectedOptionalTagsDisplay,
      allOptionalTags: allOptionalTags
    })
  },

  // 获取选中筛选条件的总数
  getSelectedFiltersCount: function() {
    const { selectedScenes, selectedIngredients, selectedOptionalTags, currentQuickFilter } = this.data
    let count = selectedScenes.length + selectedIngredients.length + selectedOptionalTags.length
    if (currentQuickFilter) count += 1
    return count
  },

  // 检查是否有筛选条件
  hasActiveFilters: function() {
    return this.getSelectedFiltersCount() > 0
  },

  // 获取选中时间的数值（分钟）
  getSelectedTimeValue: function() {
    const { selectedTime, timeOptions } = this.data
    if (!selectedTime) return null
    
    const timeOption = timeOptions.find(t => t.id === selectedTime)
    return timeOption ? timeOption.value : null
  },

  // 根据时间值获取对应的emoji
  getTimeEmoji: function(timeValue) {
    const time = parseInt(timeValue)
    if (time <= 10) return '⏱️' // 10分钟
    if (time <= 30) return '⏰' // 30分钟
    if (time <= 60) return '🕐' // 1小时
    return '🕒' // 2小时以上
  },

  // 格式化菜谱显示数据
  formatRecipeForDisplay: function(recipe) {
    // 获取场景和食材分类的显示信息
    const sceneCategory = getSceneCategoryById(recipe.sceneCategory)
    const ingredientCategory = getIngredientCategoryById(recipe.ingredientCategory)
    
    return {
      ...recipe,
      sceneDisplay: sceneCategory ? `${sceneCategory.emoji} ${sceneCategory.name}` : '',
      ingredientDisplay: ingredientCategory ? `${ingredientCategory.emoji} ${ingredientCategory.name}` : '',
      preparationTimeDisplay: recipe.preparationTime ? recipe.preparationTime.label : '',
      difficultyDisplay: recipe.difficulty ? recipe.difficulty.label : '',
      servingSizeDisplay: recipe.servingSize ? recipe.servingSize.label : ''
    }
  }
})