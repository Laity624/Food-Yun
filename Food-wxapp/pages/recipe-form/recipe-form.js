const app = getApp()
const {
  getSceneCategories,
  getIngredientCategories,
  getCookingMethods,
  getFlavorTypes,
  getPreparationTimes,
  getDifficultyLevels,
  getServingSizes,
  getSceneCategoryById,
  getIngredientCategoryById,
  validateRequiredFields
} = require('../../utils/tagData')

Page({
  data: {
    loading: false,
    inputDebounceTimer: null,
    formData: {
      images: [],
      name: '',
      description: '',
      sceneCategory: '', // 必选：场景分类ID
      ingredientCategory: '', // 必选：食材分类ID
      preparationTimeIndex: 0,
      difficultyIndex: 0,
      servingSizeIndex: 0,
      optionalTags: [], // 可选标签：烹饪方式和口味特色
      ingredients: [
        { id: 'ing_1', name: '', amount: '' },
        { id: 'ing_2', name: '', amount: '' }
      ],
      steps: [
        { id: 'step_1', content: '', image: '' },
        { id: 'step_2', content: '', image: '' }
      ],
      isPublic: true
    },
    // 枚举数据
    sceneCategories: [],
    ingredientCategories: [],
    cookingMethods: [],
    flavorTypes: [],
    preparationTimes: [],
    difficultyLevels: [],
    servingSizes: [],
    // UI状态
    showMoreTags: false
  },

  onLoad(options) {
    // 初始化所有枚举数据
    this.setData({
      sceneCategories: getSceneCategories(),
      ingredientCategories: getIngredientCategories(),
      cookingMethods: getCookingMethods(),
      flavorTypes: getFlavorTypes(),
      preparationTimes: getPreparationTimes(),
      difficultyLevels: getDifficultyLevels(),
      servingSizes: getServingSizes()
    })
    
    // 如果有编辑模式，可以在这里初始化数据
    if (options.id) {
      this.loadRecipeData(options.id)
    }
  },

  onUnload() {
    // 页面卸载时的清理工作
    if (this.data.inputDebounceTimer) {
      clearTimeout(this.data.inputDebounceTimer)
    }
  },

  // 加载菜谱数据（编辑模式）
  loadRecipeData(recipeId) {
    wx.showLoading({ title: '加载中...' })
    
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'getById',
        recipeId: recipeId
      },
      success: (res) => {
        if (res.result.success) {
          const recipe = res.result.data
          this.setData({
            formData: {
              ...this.data.formData,
              images: recipe.images || [],
              name: recipe.name || '',
              description: recipe.description || '',
              sceneCategory: recipe.sceneCategory || '',
              ingredientCategory: recipe.ingredientCategory || '',
              optionalTags: recipe.optionalTags || [],
              ingredients: recipe.ingredients || [{ id: 'ing_1', name: '', amount: '' }],
              steps: recipe.steps || [{ id: 'step_1', content: '', image: '' }],
              isPublic: recipe.isPublic !== false
            }
          })
        }
      },
      fail: (err) => {
        console.error('加载菜谱失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 检查表单是否有未保存的数据
  isFormDirty() {
    const { formData } = this.data
    return formData.images.length > 0 ||
           formData.name.trim() ||
           formData.description.trim() ||
           formData.sceneCategory ||
           formData.ingredientCategory ||
           formData.optionalTags.length > 0 ||
           formData.ingredients.some(ing => ing && ing.name && ing.amount && (ing.name.trim() || ing.amount.trim())) ||
           formData.steps.some(step => step && step.content && step.content.trim())
  },

  // 检查表单脏数据并确认
  checkFormDirty(callback) {
    if (this.isFormDirty()) {
      wx.showModal({
        title: '提示',
        content: '您有未保存的数据，确定要离开吗？',
        success: (res) => {
          if (res.confirm) {
            callback && callback()
          }
        }
      })
    } else {
      callback && callback()
    }
  },

  // 返回上一页
  onBack() {
    this.checkFormDirty(() => {
      wx.navigateBack()
    })
  },

  // 保存草稿
  onSave() {
    this.saveRecipe(false)
  },

  // 提交表单
  onSubmit() {
    this.saveRecipe(true)
  },

  // 保存菜谱
  saveRecipe(isPublish) {
    // 使用统一的验证函数
    const errors = validateRequiredFields(this.data.formData)
    if (errors.length > 0) {
      wx.showToast({
        title: errors[0],
        icon: 'none'
      })
      return
    }

    // 发布时的额外验证
    if (isPublish && !this.validateForPublish()) {
      return
    }

    this.setData({ loading: true })

    const formData = this.prepareFormData(isPublish)
    
    // 调用云函数保存菜谱
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'create',
        data: formData
      },
      success: (res) => {
        wx.showToast({
          title: isPublish ? '创建成功' : '保存成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      },
      fail: (err) => {
        console.error('保存菜谱失败:', err)
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 发布时的额外验证
  validateForPublish() {
    const { formData } = this.data

    if (formData.images.length === 0) {
      wx.showToast({
        title: '请至少上传一张菜谱图片',
        icon: 'none'
      })
      return false
    }

    // 验证所有步骤都有内容
    for (let i = 0; i < formData.steps.length; i++) {
      if (!formData.steps[i].content.trim()) {
        wx.showToast({
          title: `第${i + 1}个步骤不能为空`,
          icon: 'none'
        })
        return false
      }
    }

    return true
  },

  // 准备表单数据
  prepareFormData(isPublish) {
    const { formData, preparationTimes, difficultyLevels, servingSizes } = this.data
    
    // 过滤空食材
    const ingredients = formData.ingredients.filter(item => 
      item && item.name && item.amount && 
      item.name.trim() && item.amount.trim()
    )

    // 过滤空步骤
    const steps = formData.steps.filter(step => 
      step && step.content && step.content.trim()
    ).map(step => ({
      content: step.content.trim(),
      image: step.image || ''
    }))

    return {
      images: formData.images,
      name: formData.name.trim(),
      description: formData.description.trim(),
      sceneCategory: formData.sceneCategory,
      ingredientCategory: formData.ingredientCategory,
      preparationTime: preparationTimes[formData.preparationTimeIndex],
      difficulty: difficultyLevels[formData.difficultyIndex],
      servingSize: servingSizes[formData.servingSizeIndex],
      optionalTags: formData.optionalTags,
      ingredients: ingredients,
      steps: steps,
      isPublic: formData.isPublic,
      status: isPublish ? 'published' : 'draft'
    }
  },

  // 场景分类选择
  onSceneCategorySelect(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      'formData.sceneCategory': categoryId
    })
  },

  // 食材分类选择
  onIngredientCategorySelect(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      'formData.ingredientCategory': categoryId
    })
  },

  // 切换更多标签显示
  toggleMoreTags() {
    this.setData({
      showMoreTags: !this.data.showMoreTags
    })
  },

  // 可选标签选择/取消
  onOptionalTagToggle(e) {
    const tagId = e.currentTarget.dataset.id
    const optionalTags = [...this.data.formData.optionalTags]
    const index = optionalTags.indexOf(tagId)

    if (index !== -1) {
      // 标签已存在，移除
      optionalTags.splice(index, 1)
    } else {
      // 标签不存在，添加（限制最多8个标签）
      if (optionalTags.length >= 8) {
        wx.showToast({
          title: '最多只能选择8个标签',
          icon: 'none'
        })
        return
      }
      optionalTags.push(tagId)
    }

    this.setData({
      'formData.optionalTags': optionalTags
    })
  },

  // 表单字段变化处理
  onNameChange(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onDescriptionChange(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  onPreparationTimeChange(e) {
    this.setData({
      'formData.preparationTimeIndex': e.detail.value
    })
  },

  onDifficultyChange(e) {
    this.setData({
      'formData.difficultyIndex': e.detail.value
    })
  },

  onServingSizeChange(e) {
    this.setData({
      'formData.servingSizeIndex': e.detail.value
    })
  },

  onPrivacyChange(e) {
    this.setData({
      'formData.isPublic': e.detail.value
    })
  },

  // 图片上传
  onImageUpload() {
    const currentCount = this.data.formData.images.length
    const maxCount = 5 - currentCount

    if (maxCount <= 0) {
      wx.showToast({
        title: '最多只能上传5张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath)
        this.uploadMultipleImages(tempFiles)
      }
    })
  },

  // 上传多张图片到云存储
  uploadMultipleImages(filePaths) {
    wx.showLoading({ title: `上传中(0/${filePaths.length})...` })

    const uploadPromises = filePaths.map((filePath, index) => {
      return new Promise((resolve, reject) => {
        const cloudPath = `recipes/${Date.now()}-${index}-${Math.random().toString(36).slice(-6)}.jpg`

        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: (res) => {
            wx.showLoading({ title: `上传中(${index + 1}/${filePaths.length})...` })
            resolve(res.fileID)
          },
          fail: (err) => reject(err)
        })
      })
    })

    Promise.all(uploadPromises)
      .then(fileIDs => {
        const currentImages = [...this.data.formData.images]
        const newImages = currentImages.concat(fileIDs)

        this.setData({
          'formData.images': newImages
        })

        wx.hideLoading()
        wx.showToast({
          title: `上传成功${fileIDs.length}张图片`,
          icon: 'success'
        })
      })
      .catch(err => {
        console.error('上传图片失败:', err)
        wx.hideLoading()
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        })
      })
  },

  // 删除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.formData.images]
    images.splice(index, 1)
    this.setData({
      'formData.images': images
    })
  },

  // 食材相关操作
  onIngredientNameInput(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    this.setData({
      [`formData.ingredients[${index}].name`]: value
    })
  },

  onIngredientAmountInput(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    this.setData({
      [`formData.ingredients[${index}].amount`]: value
    })
  },

  addIngredient() {
    const ingredients = [...this.data.formData.ingredients]
    const newId = `ing_${Date.now()}`
    ingredients.push({ 
      id: newId, 
      name: '', 
      amount: '' 
    })
    this.setData({
      'formData.ingredients': ingredients
    })
  },

  removeIngredient(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    if (ingredients.length > 1) {
      ingredients.splice(index, 1)
      this.setData({
        'formData.ingredients': ingredients
      })
    }
  },

  // 步骤相关操作
  onStepContentChange(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    this.setData({
      [`formData.steps[${index}].content`]: value
    })
  },

  addStep() {
    const steps = [...this.data.formData.steps]
    const newId = `step_${Date.now()}`
    steps.push({ id: newId, content: '', image: '' })
    this.setData({
      'formData.steps': steps
    })
  },

  removeStep(e) {
    const index = e.currentTarget.dataset.index
    const steps = [...this.data.formData.steps]
    if (steps.length > 1) {
      steps.splice(index, 1)
      this.setData({
        'formData.steps': steps
      })
    }
  },

  // 步骤图片上传
  onStepImageUpload(e) {
    const index = e.currentTarget.dataset.index
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadStepImage(tempFilePath, index)
      }
    })
  },

  // 上传步骤图片到云存储
  uploadStepImage(tempFilePath, stepIndex) {
    wx.showLoading({ title: '上传图片中...' })

    const cloudPath = `steps/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`

    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
      success: (res) => {
        this.setData({
          [`formData.steps[${stepIndex}].image`]: res.fileID
        })
        wx.hideLoading()
        wx.showToast({
          title: '图片上传成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('上传步骤图片失败:', err)
        wx.hideLoading()
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        })
      }
    })
  },

  // 删除步骤图片
  removeStepImage(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      [`formData.steps[${index}].image`]: ''
    })
  }
})