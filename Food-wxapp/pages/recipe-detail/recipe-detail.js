const { 
  getSceneCategoryById, 
  getIngredientCategoryById,
  getCookingMethods,
  getFlavorTypes
} = require('../../utils/tagData')

Page({
  data: {
    // 菜谱数据
    recipe: {
      _id: '',
      name: '',
      description: '',
      images: [],
      ingredients: [],
      steps: [],
      preparationTime: {},
      difficulty: {},
      servingSize: {},
      sceneCategory: '',
      ingredientCategory: '',
      optionalTags: [],
      creator: {
        nickname: '',
        avatar: ''
      },
      createTime: ''
    },
    
    // 分类信息
    sceneCategoryInfo: {},
    ingredientCategoryInfo: {},
    optionalTagsInfo: [],
    
    // 页面状态
    loading: true,
    isFavorited: false,
    
    
    
    // 页面参数
    recipeId: ''
  },

  onLoad(options) {
    console.log('菜谱详情页加载，参数:', options)
    
    if (options.id) {
      this.setData({
        recipeId: options.id
      })
      this.loadRecipeDetail()
    } else {
      wx.showToast({
        title: '菜谱ID不能为空',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onShow() {
    // 检查收藏状态
    this.checkFavoriteStatus()
  },

  onPullDownRefresh() {
    this.loadRecipeDetail()
  },

  // 加载菜谱详情
  loadRecipeDetail() {
    if (!this.data.recipeId) return
    
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'detail',
        recipeId: this.data.recipeId
      }
    }).then(res => {
      console.log('菜谱详情加载结果:', res)
      
      if (res.result.success) {
        const recipe = res.result.data
        this.processRecipeData(recipe)
        this.setData({
          recipe: recipe,
          loading: false
        })
      } else {
        console.error('加载菜谱详情失败:', res.result)
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'error'
        })
        this.setData({ loading: false })
      }
      
      wx.stopPullDownRefresh()
    }).catch(err => {
      console.error('加载菜谱详情失败:', err)
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    })
  },

  // 处理菜谱数据
  processRecipeData(recipe) {
    // 获取场景分类信息
    const sceneCategoryInfo = getSceneCategoryById(recipe.sceneCategory) || {}
    
    // 获取食材分类信息
    const ingredientCategoryInfo = getIngredientCategoryById(recipe.ingredientCategory) || {}
    
    // 获取可选标签信息
    const cookingMethods = getCookingMethods()
    const flavorTypes = getFlavorTypes()
    const allOptionalTags = [...cookingMethods, ...flavorTypes]
    
    const optionalTagsInfo = recipe.optionalTags.map(tagId => {
      return allOptionalTags.find(tag => tag.id === tagId) || { id: tagId, name: '未知标签', emoji: '🏷️' }
    })
    
    this.setData({
      sceneCategoryInfo,
      ingredientCategoryInfo,
      optionalTagsInfo
    })
  },

  // 检查收藏状态
  checkFavoriteStatus() {
    const favorites = wx.getStorageSync('favoriteRecipes') || []
    const isFavorited = favorites.includes(this.data.recipeId)
    this.setData({ isFavorited })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 切换收藏状态
  toggleFavorite() {
    const favorites = wx.getStorageSync('favoriteRecipes') || []
    const recipeId = this.data.recipeId
    const isFavorited = this.data.isFavorited
    
    if (isFavorited) {
      // 取消收藏
      const newFavorites = favorites.filter(id => id !== recipeId)
      wx.setStorageSync('favoriteRecipes', newFavorites)
      this.setData({ isFavorited: false })
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      })
    } else {
      // 添加收藏
      favorites.push(recipeId)
      wx.setStorageSync('favoriteRecipes', favorites)
      this.setData({ isFavorited: true })
      wx.showToast({
        title: '已添加收藏',
        icon: 'success'
      })
    }
  },

  // 分享菜谱
  shareRecipe() {
    wx.showActionSheet({
      itemList: ['分享给好友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.shareToFriend()
            break
          case 1:
            this.shareToMoments()
            break
          case 2:
            this.copyLink()
            break
        }
      }
    })
  },

  // 分享给好友
  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      success: () => {
        console.log('分享给好友')
      }
    })
  },

  // 分享到朋友圈
  shareToMoments() {
    wx.showToast({
      title: '朋友圈分享功能开发中',
      icon: 'none'
    })
  },

  // 复制链接
  copyLink() {
    const link = `pages/recipe-detail/recipe-detail?id=${this.data.recipeId}`
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.current
    const urls = this.data.recipe.images
    
    wx.previewImage({
      current: urls[current],
      urls: urls
    })
  },

  // 预览步骤图片
  previewStepImage(e) {
    const index = e.currentTarget.dataset.index
    const step = this.data.recipe.steps[index]
    
    if (step && step.image) {
      wx.previewImage({
        current: step.image,
        urls: [step.image]
      })
    }
  },



  // 按场景筛选
  filterByScene(e) {
    const sceneId = e.currentTarget.dataset.scene
    wx.navigateTo({
      url: `/pages/recipe-list/recipe-list?scene=${sceneId}`
    })
  },

  // 按食材筛选
  filterByIngredient(e) {
    const ingredientId = e.currentTarget.dataset.ingredient
    wx.navigateTo({
      url: `/pages/recipe-list/recipe-list?ingredient=${ingredientId}`
    })
  },

  // 按标签筛选
  filterByTag(e) {
    const tagId = e.currentTarget.dataset.tag
    wx.navigateTo({
      url: `/pages/recipe-list/recipe-list?tag=${tagId}`
    })
  },

  // 查看创建者菜谱
  viewCreatorRecipes() {
    const creatorId = this.data.recipe.creator.id
    if (creatorId) {
      wx.navigateTo({
        url: `/pages/recipe-list/recipe-list?creator=${creatorId}`
      })
    } else {
      wx.showToast({
        title: '创建者信息不完整',
        icon: 'none'
      })
    }
  },

  // 页面分享配置
  onShareAppMessage() {
    const recipe = this.data.recipe
    return {
      title: `${recipe.name} - 家庭菜谱`,
      path: `/pages/recipe-detail/recipe-detail?id=${recipe._id}`,
      imageUrl: recipe.images[0] || '/images/default-recipe.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const recipe = this.data.recipe
    return {
      title: `${recipe.name} - 家庭菜谱`,
      imageUrl: recipe.images[0] || '/images/default-recipe.png'
    }
  }
})
