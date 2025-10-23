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
    isMyRecipe: false, // 是否为当前用户的菜谱
    
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
    
    // 判断是否为当前用户的菜谱
    const app = getApp()
    const currentOpenid = app.globalData.openid || wx.getStorageSync('openid')
    const isMyRecipe = currentOpenid && recipe.creatorId === currentOpenid
    
    this.setData({
      sceneCategoryInfo,
      ingredientCategoryInfo,
      optionalTagsInfo,
      isMyRecipe
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
  },

  // 编辑菜谱
  editRecipe() {
    const recipeId = this.data.recipeId
    wx.navigateTo({
      url: `/pages/recipe-form/recipe-form?id=${recipeId}`
    })
  },

  // 删除菜谱
  deleteRecipe() {
    const recipe = this.data.recipe
    wx.showModal({
      title: '删除菜谱',
      content: `确定要删除菜谱"${recipe.name}"吗？删除后无法恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmDeleteRecipe()
        }
      }
    })
  },

  // 确认删除菜谱
  confirmDeleteRecipe() {
    wx.showLoading({ title: '删除中...' })
    
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'delete',
        recipeId: this.data.recipeId
      }
    }).then(res => {
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        
        // 延迟返回上一页，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '删除失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('删除菜谱失败:', err)
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    })
  },

  // 发布菜谱
  publishRecipe() {
    const recipe = this.data.recipe
    wx.showModal({
      title: '发布菜谱',
      content: `确定要发布菜谱"${recipe.name}"吗？发布后其他用户将可以看到此菜谱。`,
      confirmText: '发布',
      confirmColor: '#3b82f6',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmPublishRecipe()
        }
      }
    })
  },

  // 确认发布菜谱
  confirmPublishRecipe() {
    wx.showLoading({ title: '发布中...' })
    
    // 获取当前菜谱数据，只更新状态和公开性
    const recipe = this.data.recipe
    const updateData = {
      name: recipe.name,
      description: recipe.description,
      images: recipe.images,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      preparationTime: recipe.preparationTime,
      difficulty: recipe.difficulty,
      servingSize: recipe.servingSize,
      sceneCategory: recipe.sceneCategory,
      ingredientCategory: recipe.ingredientCategory,
      optionalTags: recipe.optionalTags,
      isPublic: true,
      status: 'published'
    }
    
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'update',
        recipeId: this.data.recipeId,
        data: updateData
      }
    }).then(res => {
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        })
        
        // 更新本地数据
        this.setData({
          'recipe.status': 'published',
          'recipe.isPublic': true
        })
        
        // 延迟返回上一页，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '发布失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('发布菜谱失败:', err)
      wx.showToast({
        title: '发布失败',
        icon: 'error'
      })
    })
  }
})
