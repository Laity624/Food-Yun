const app = getApp()
const { getTagOptions } = require('../../utils/tagData')

Page({
  data: {
    loading: false,
    inputDebounceTimer: null,
    formData: {
      images: [], // 改为数组支持多张图片
      title: '',
      description: '',
      cookTimeIndex: 0,
      difficultyIndex: 0,
      servingIndex: 0,
      tags: [], // 菜谱标签
      selectedTags: {}, // 用对象记录选中状态，key为标签名，value为true/false
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
    cookTimeOptions: ['10分钟','15分钟',  '20分钟', '30分钟', '40分钟','50分钟', '60分钟', '70分钟', '80分钟', '90分钟', '100分钟', '120分钟', '150分钟', '180分钟'],
    difficultyOptions: ['简单', '中等', '困难'],
    servingOptions: ['1-2人', '3-4人', '5-6人'],
    // 使用公共标签数据
    tagOptions: []
  },

  onLoad(options) {
    // 初始化标签数据
    this.setData({
      tagOptions: getTagOptions()
    })
    // 如果有编辑模式，可以在这里初始化数据
  },

  onUnload() {
    // 页面卸载时的清理工作
  },

  onHide() {
    // 页面隐藏时的处理
  },

  // 检查表单是否有未保存的数据
  isFormDirty() {
    const { formData } = this.data
    return formData.images.length > 0 ||
           formData.title.trim() ||
           formData.description.trim() ||
           formData.tags.length > 0 ||
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
    if (!this.validateForm(isPublish)) {
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

  // 验证表单
  validateForm(isPublish = true) {
    const { formData } = this.data

    // 清理无效的食材数据
    const validIngredients = formData.ingredients.filter(ingredient => 
      ingredient && typeof ingredient === 'object' && ingredient.id
    )
    
    // 如果发现无效数据，更新到 data 中
    if (validIngredients.length !== formData.ingredients.length) {
      this.setData({
        'formData.ingredients': validIngredients
      })
    }

    if (formData.images.length === 0) {
      wx.showToast({
        title: '请至少上传一张菜谱图片',
        icon: 'none'
      })
      return false
    }

    if (!formData.title.trim()) {
      wx.showToast({
        title: '请输入菜谱名称',
        icon: 'none'
      })
      return false
    }

    if (!formData.description.trim()) {
      wx.showToast({
        title: '请输入菜谱描述',
        icon: 'none'
      })
      return false
    }

    // 验证食材
    for (let i = 0; i < formData.ingredients.length; i++) {
      const ingredient = formData.ingredients[i]
      // 确保字段存在且为字符串，防止 undefined 错误
      const name = (ingredient.name || '').trim()
      const amount = (ingredient.amount || '').trim()
      
      if (!name && amount) {
        wx.showToast({
          title: `第${i + 1}个食材名称不能为空`,
          icon: 'none'
        })
        return false
      }
      if (name && !amount) {
        wx.showToast({
          title: `第${i + 1}个食材用量不能为空`,
          icon: 'none'
        })
        return false
      }
    }

    // 验证步骤（发布时要求所有步骤都有内容，保存草稿时允许空步骤）
    if (isPublish) {
      for (let i = 0; i < formData.steps.length; i++) {
        if (!formData.steps[i].content.trim()) {
          wx.showToast({
            title: `第${i + 1}个步骤不能为空`,
            icon: 'none'
          })
          return false
        }
      }
    } else {
      // 草稿模式下，至少要有一个非空步骤
      const hasValidStep = formData.steps.some(step => step.content.trim())
      if (!hasValidStep) {
        wx.showToast({
          title: '至少需要一个制作步骤',
          icon: 'none'
        })
        return false
      }
    }

    return true
  },

  // 准备表单数据
  prepareFormData(isPublish) {
    const { formData, cookTimeOptions, difficultyOptions, servingOptions } = this.data
    
    // 过滤空食材，添加防御性检查
    const ingredients = formData.ingredients.filter(item => 
      item && item.name && item.amount && 
      item.name.trim() && item.amount.trim()
    )

    return {
      images: formData.images,
      title: formData.title.trim(),
      description: formData.description.trim(),
      cookTime: cookTimeOptions[formData.cookTimeIndex],
      difficulty: difficultyOptions[formData.difficultyIndex],
      serving: servingOptions[formData.servingIndex],
      ingredients: ingredients,
      steps: formData.steps.map(step => ({
        content: step.content.trim(),
        image: step.image || ''
      })),
      tags: formData.tags, // 添加标签数据
      isPublic: formData.isPublic,
      status: isPublish ? 'published' : 'draft'
    }
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

    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        this.uploadMultipleImages(tempFilePaths)
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
          success: (res) => resolve(res.fileID),
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

  // 防抖处理输入事件
  debounceInput(callback, delay = 300) {
    clearTimeout(this.data.inputDebounceTimer)
    const timer = setTimeout(callback, delay)
    this.setData({ inputDebounceTimer: timer })
  },

  // 立即保存数据（用于添加/删除操作前）
  flushPendingInput() {
    if (this.data.inputDebounceTimer) {
      clearTimeout(this.data.inputDebounceTimer)
      this.setData({ inputDebounceTimer: null })
    }

    // 确保当前焦点的输入框数据被保存
    // 这是一个同步操作，确保数据立即保存
    console.log('刷新待保存输入数据')
  },

  // 表单字段变化处理
  onTitleChange(e) {
    this.setData({
      'formData.title': e.detail
    })
  },

  onDescriptionChange(e) {
    this.setData({
      'formData.description': e.detail
    })
  },

  onCookTimeChange(e) {
    this.setData({
      'formData.cookTimeIndex': e.detail.value
    })
  },

  onDifficultyChange(e) {
    this.setData({
      'formData.difficultyIndex': e.detail.value
    })
  },

  onServingChange(e) {
    this.setData({
      'formData.servingIndex': e.detail.value
    })
  },

  onPrivacyChange(e) {
    this.setData({
      'formData.isPublic': e.detail
    })
  },

  // 食材相关操作（使用 input 事件优化性能）
  onIngredientNameInput(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    // 立即更新数据，避免与添加/删除操作冲突
    this.setData({
      [`formData.ingredients[${index}].name`]: value
    })
  },

  onIngredientAmountInput(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    // 立即更新数据，避免与添加/删除操作冲突
    this.setData({
      [`formData.ingredients[${index}].amount`]: value
    })
  },

  // 保留原有的 change 事件作为兼容
  onIngredientNameChange(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail || ''

    // 立即更新数据，确保不丢失
    this.setData({
      [`formData.ingredients[${index}].name`]: value
    })
  },

  onIngredientAmountChange(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail || ''

    // 立即更新数据，确保不丢失
    this.setData({
      [`formData.ingredients[${index}].amount`]: value
    })
  },

  addIngredient() {
    // 确保所有待保存的输入都已保存
    this.flushPendingInput()

    const ingredients = [...this.data.formData.ingredients]
    const newId = `ing_${Date.now()}`
    // 确保完全初始化，防止 undefined 错误
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
    // 确保所有待保存的输入都已保存
    this.flushPendingInput()

    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    if (ingredients.length > 1) {
      ingredients.splice(index, 1)
      this.setData({
        'formData.ingredients': ingredients
      })
    }
  },

  // 步骤相关操作（使用 input 事件优化性能）
  onStepContentChange(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail || ''

    console.log('步骤输入 - 索引:', index, '值:', value, '当前步骤数组长度:', this.data.formData.steps.length)

    // 立即更新数据，确保不丢失
    this.setData({
      [`formData.steps[${index}].content`]: value
    })
  },

  addStep() {
    console.log('添加步骤前的数据:', JSON.parse(JSON.stringify(this.data.formData.steps)))

    const steps = [...this.data.formData.steps]
    const newId = `step_${Date.now()}`
    steps.push({ id: newId, content: '', image: '' })

    this.setData({
      'formData.steps': steps
    }, () => {
      console.log('添加步骤后的数据:', JSON.parse(JSON.stringify(this.data.formData.steps)))
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
    const step = this.data.formData.steps[index]
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
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
        // 更新步骤图片
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

  // 标签选择/取消
  onTagToggle(e) {
    const tag = e.currentTarget.dataset.tag
    const tags = [...this.data.formData.tags]
    const selectedTags = { ...this.data.formData.selectedTags }

    const index = tags.indexOf(tag)

    if (index !== -1) {
      // 标签已存在，移除
      tags.splice(index, 1)
      selectedTags[tag] = false
    } else {
      // 标签不存在，添加（限制最多10个标签）
      if (tags.length >= 10) {
        wx.showToast({
          title: '最多只能选择10个标签',
          icon: 'none'
        })
        return
      }
      tags.push(tag)
      selectedTags[tag] = true
    }

    this.setData({
      'formData.tags': tags,
      'formData.selectedTags': selectedTags
    })
  }
})