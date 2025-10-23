const TagData = require('../../utils/tagData')
const cartManager = require('../../utils/cartManager')

/**
 * 订单详情页面
 */
Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    showActionSheet: false,
    userInfo: null
  },

  onLoad: function(options) {
    const { orderId } = options
    if (orderId) {
      this.setData({ orderId })
      this.loadOrderDetail(orderId)
    } else {
      wx.showToast({
        title: '订单ID错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
    this.getUserInfo()
  },

   // 获取用户信息
   getUserInfo: function() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({
          userInfo: userInfo
        })
        console.log('获取用户信息成功:', userInfo)
      } else {
        console.log('未找到用户信息')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  // 加载订单详情
  loadOrderDetail: function(orderId) {
    wx.showLoading({
      title: '加载中...'
    })

    wx.cloud.callFunction({
      name: 'order',
      data: {
        action: 'getOrderDetail',
        orderId: orderId
      }
    }).then(res => {
      wx.hideLoading()
      console.log('订单详情云函数调用结果:', res)
      
      if (res.result.success) {
        this.setData({
          order: res.result.data,
          loading: false
        })
      } else {
        console.error('订单详情加载失败:', res.result)
        this.setData({ loading: false })
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
        // 加载失败时返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }).catch(err => {
      wx.hideLoading()
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      console.error('加载订单详情失败', err)
      // 加载失败时返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    })
  },

  // 获取状态样式
  getStatusStyle: function(status) {
    return TagData.getOrderStatusStyle(status)
  },

  // 获取餐次图标
  getMealTypeIcon: function(mealType) {
    const icons = {
      breakfast: '🌅',
      lunch: '🌞',
      dinner: '🌙'
    }
    return icons[mealType] || '🍽️'
  },

  // 显示操作菜单
  onShowActions: function() {
    const { order } = this.data
    if (!order) return

    const actions = []
    
    if (order.status === 'pending') {
      actions.push('开始制作')
      actions.push('取消订单')
    } else if (order.status === 'processing') {
      actions.push('完成制作')
      actions.push('取消订单')
    } else if (order.status === 'completed') {
      actions.push('再次点餐')
      actions.push('评价订单')
    }

    if (actions.length === 0) return

    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const action = actions[res.tapIndex]
        this.handleAction(action)
      }
    })
  },

  // 处理操作
  handleAction: function(action) {
    const { order } = this.data
    
    switch (action) {
      case '开始制作':
        this.startCooking()
        break
      case '完成制作':
        this.completeCooking()
        break
      case '取消订单':
        this.cancelOrder()
        break
      case '再次点餐':
        this.reorder()
        break
      case '评价订单':
        this.rateOrder()
        break
    }
  },

  // 开始制作
  startCooking: function() {
    wx.showModal({
      title: '确认开始制作',
      content: '确定要开始制作这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus('processing')
        }
      }
    })
  },

  // 完成制作
  completeCooking: function() {
    wx.showModal({
      title: '确认完成制作',
      content: '确定已经完成制作了吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus('completed')
        }
      }
    })
  },

  // 取消订单
  cancelOrder: function() {
    wx.showModal({
      title: '确认取消订单',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus('cancelled')
        }
      }
    })
  },

  // 再次点餐
  reorder: function() {
    const { order } = this.data
    if (!order || !order.recipes || order.recipes.length === 0) {
      wx.showToast({
        title: '订单中没有菜谱',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '添加到购物车...'
    })

    let successCount = 0
    let failCount = 0
    const totalCount = order.recipes.length

    // 将订单中的菜谱添加到购物车
    order.recipes.forEach((recipe, index) => {
      try {
        // 转换订单菜谱数据为购物车格式
        const cartRecipe = this.convertOrderRecipeToCartFormat(recipe)
        
        // 添加到购物车
        const result = cartManager.addToCart(cartRecipe)
        
        if (result.success) {
          successCount++
          console.log('成功添加到购物车:', recipe.recipeName)
        } else {
          failCount++
          console.error('添加到购物车失败:', recipe.recipeName, result.message)
        }
      } catch (error) {
        failCount++
        console.error('处理菜谱时出错:', recipe.recipeName, error)
      }
    })

    wx.hideLoading()

    // 显示结果反馈
    if (successCount > 0) {
      if (failCount === 0) {
        wx.showToast({
          title: `已添加${successCount}道菜到购物车`,
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: `成功添加${successCount}道菜，${failCount}道添加失败`,
          icon: 'none',
          duration: 3000
        })
      }
    } else {
      wx.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      })
      return
    }
    
    // 跳转到点餐页面
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/diancan/diancan'
      })
    }, 1500)
  },

  // 将订单菜谱数据转换为购物车格式
  convertOrderRecipeToCartFormat: function(orderRecipe) {
    return {
      _id: orderRecipe.recipeId,
      name: orderRecipe.recipeName,
      creatorId: orderRecipe.authorId,
      creator: {
        nickname: orderRecipe.authorName,
        avatar: orderRecipe.authorAvatar
      },
      images: orderRecipe.image ? [orderRecipe.image] : ['/images/default-recipe.png'],
      preparationTime: {
        label: orderRecipe.preparationTime || '30分钟'
      },
      difficulty: {
        label: orderRecipe.difficulty || '简单'
      },
      servingSize: {
        label: orderRecipe.servingSize || '2-3人份'
      }
    }
  },

  // 评价订单
  rateOrder: function() {
    wx.showToast({
      title: '评价功能开发中',
      icon: 'none'
    })
  },

  // 更新订单状态
  updateOrderStatus: function(newStatus) {
    wx.showLoading({
      title: '更新中...'
    })

    wx.cloud.callFunction({
      name: 'order',
      data: {
        action: 'updateOrderStatus',
        orderId: this.data.orderId,
        status: newStatus
      }
    }).then(res => {
      wx.hideLoading()
      console.log('订单状态更新结果:', res)
      
      if (res.result.success) {
        // 重新加载订单详情
        this.loadOrderDetail(this.data.orderId)
        wx.showToast({
          title: '状态更新成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '更新失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
      console.error('更新订单状态失败', err)
    })
  },

  // 查看菜谱详情
  onViewRecipe: function(e) {
    const recipeId = e.currentTarget.dataset.recipeId
    wx.navigateTo({
      url: `/pages/recipe-detail/recipe-detail?id=${recipeId}`
    })
  },

  // 返回订单列表
  onGoBack: function() {
    wx.navigateBack()
  }
})
