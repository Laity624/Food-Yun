const cartManager = require('../../utils/cartManager')
const tagData = require('../../utils/tagData')

Page({
  data: {
    // 购物车数据
    cartItems: [],
    cartStats: {
      totalCount: 0,
      selectedCount: 0,
      hasItems: false,
      hasSelected: false
    },
    
    // 订单配置
    selectedFriend: null,
    selectedFriendId: '',
    selectedDate: '',
    selectedTime: '',
    selectedTimeLabel: '', // 时间显示标签
    orderNotes: '',
    
    // 时间选项
    timeOptions: [],
    
    // 选择器状态
    showFriendSelector: false,
    showTimeSelector: false,
    
    // 计算属性
    canCreateOrder: false
  },

  onLoad: function() {
    // 初始化时间选项
    const timeOptions = tagData.getMealTimes()
    this.setData({
      timeOptions: timeOptions
    })
    
    this.loadCartData()
    this.initDate()
    
    // 如果已有选择的时间，确保标签也被设置
    if (this.data.selectedTime) {
      const timeOption = timeOptions.find(t => t.value === this.data.selectedTime)
      if (timeOption) {
        this.setData({
          selectedTimeLabel: timeOption.label
        })
      }
    }
  },

  onShow: function () {
    // 更新自定义tabbar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 'diancan'
      })
    }
    
    // 刷新购物车数据
    this.loadCartData()
    
    // 确保时间标签正确显示
    if (this.data.selectedTime && !this.data.selectedTimeLabel) {
      const timeOption = this.data.timeOptions.find(t => t.value === this.data.selectedTime)
      if (timeOption) {
        this.setData({
          selectedTimeLabel: timeOption.label
        })
      }
    }
  },

  // 加载购物车数据
  loadCartData: function() {
    const cartData = cartManager.getCartData()
    this.setData({
      cartItems: cartData.cartItems,
      cartStats: {
        totalCount: cartData.totalCount,
        selectedCount: cartData.selectedCount,
        hasItems: cartData.totalCount > 0,
        hasSelected: cartData.selectedCount > 0
      }
    })
    this.updateCanCreateOrder()
  },

  // 初始化日期
  initDate: function() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    this.setData({
      selectedDate: `${year}-${month}-${day}`
    })
  },

  // 更新是否可以创建订单
  updateCanCreateOrder: function() {
    const { selectedFriend, selectedTime, cartStats } = this.data
    const canCreate = selectedFriend && selectedTime && cartStats.selectedCount > 0
    this.setData({
      canCreateOrder: canCreate
    })
  },

  // 切换商品选中状态
  onToggleSelection: function(e) {
    const recipeId = e.currentTarget.dataset.recipeId
    cartManager.toggleRecipeSelection(recipeId)
    this.loadCartData()
  },

  // 移除商品
  onRemoveItem: function(e) {
    const recipeId = e.currentTarget.dataset.recipeId
    wx.showModal({
      title: '确认删除',
      content: '确定要从购物车中移除这道菜吗？',
      success: (res) => {
        if (res.confirm) {
          cartManager.removeFromCart(recipeId)
          this.loadCartData()
          wx.showToast({
            title: '已移除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 选择好友
  onSelectFriend: function() {
    this.setData({
      showFriendSelector: true
    })
  },

  // 好友选择回调
  onFriendSelect: function(e) {
    const { friendId, friend } = e.detail
    this.setData({
      selectedFriend: friend,
      selectedFriendId: friendId,
      showFriendSelector: false
    })
    this.updateCanCreateOrder()
  },

  // 关闭好友选择器
  onCloseFriendSelector: function() {
    this.setData({
      showFriendSelector: false
    })
  },

  // 选择日期
  onSelectDate: function() {
    const today = new Date()
    const maxDate = new Date()
    maxDate.setDate(today.getDate() + 30) // 最多选择30天后

    wx.showActionSheet({
      itemList: ['今天', '明天', '后天', '选择其他日期'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 今天
          this.setData({ selectedDate: this.formatDate(today) })
        } else if (res.tapIndex === 1) {
          // 明天
          const tomorrow = new Date(today)
          tomorrow.setDate(today.getDate() + 1)
          this.setData({ selectedDate: this.formatDate(tomorrow) })
        } else if (res.tapIndex === 2) {
          // 后天
          const dayAfter = new Date(today)
          dayAfter.setDate(today.getDate() + 2)
          this.setData({ selectedDate: this.formatDate(dayAfter) })
        } else if (res.tapIndex === 3) {
          // 选择其他日期 - 这里可以集成日期选择器
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          })
        }
      }
    })
  },

  // 选择时间
  onSelectTime: function() {
    this.setData({
      showTimeSelector: true
    })
  },

  // 时间选择回调
  onTimeSelect: function(e) {
    const time = e.currentTarget.dataset.time
    const timeOption = this.data.timeOptions.find(t => t.value === time)
    this.setData({
      selectedTime: time,
      selectedTimeLabel: timeOption ? timeOption.label : time,
      showTimeSelector: false
    })
    this.updateCanCreateOrder()
    console.log('选择的时间:', time, '标签:', timeOption ? timeOption.label : time)
  },
  
  // 获取时间标签
  getTimeLabel: function(timeValue) {
    if (!timeValue) return ''
    const timeOption = this.data.timeOptions.find(t => t.value === timeValue)
    return timeOption ? timeOption.label : timeValue
  },

  // 关闭时间选择器
  onCloseTimeSelector: function() {
    this.setData({
      showTimeSelector: false
    })
  },

  // 备注输入
  onNotesInput: function(e) {
    this.setData({
      orderNotes: e.detail.value
    })
  },

  // 创建订单
  onCreateOrder: function() {
    const { selectedFriend, selectedTime, selectedDate, orderNotes, cartItems } = this.data
    
    if (!selectedFriend || (!selectedFriend.id && !selectedFriend._id && !selectedFriend.openid)) {
      wx.showToast({
        title: '请选择制作者',
        icon: 'none'
      })
      return
    }
    
    if (!selectedTime) {
      wx.showToast({
        title: '请选择时间',
        icon: 'none'
      })
      return
    }
    
    const selectedRecipes = cartItems.filter(item => item.isSelected)
    if (selectedRecipes.length === 0) {
      wx.showToast({
        title: '请选择要制作的菜品',
        icon: 'none'
      })
      return
    }
    
    // 显示确认对话框
    wx.showModal({
      title: '确认生成订单',
      content: `确定要生成订单给${selectedFriend.nickname}制作${selectedRecipes.length}道菜吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitOrder(selectedRecipes, selectedFriend, selectedTime, selectedDate, orderNotes)
        }
      }
    })
  },

  // 提交订单
  submitOrder: function(recipes, friend, mealType, orderDate, notes) {
    wx.showLoading({
      title: '生成订单中...'
    })
    
    // 检查是否选择了制作者
    if (!friend || (!friend.id && !friend._id && !friend.openid)) {
      wx.hideLoading()
      wx.showToast({
        title: '请选择制作者',
        icon: 'none'
      })
      return
    }
    
    // 获取制作者ID（优先使用_id，然后是id，最后是openid）
    const assigneeId = friend._id || friend.id || friend.openid
    
    // 调用云函数创建订单
    wx.cloud.callFunction({
      name: 'order',
      data: {
        action: 'createOrder',
        orderData: {
          recipes: recipes.map(recipe => ({
            recipeId: recipe.recipeId,
            recipeName: recipe.recipeName,
            authorId: recipe.authorId,
            authorName: recipe.authorName,
            authorAvatar: recipe.authorAvatar,
            image: recipe.image,
            preparationTime: recipe.preparationTime,
            difficulty: recipe.difficulty,
            servingSize: recipe.servingSize
          })),
          assigneeId: assigneeId,
          mealType: mealType,
          orderDate: orderDate,
          orderTime: new Date().toISOString(),
          notes: notes
        }
      }
    }).then(res => {
      wx.hideLoading()
      
      if (res.result.success) {
        // 清空已选择的商品
        recipes.forEach(recipe => {
          cartManager.removeFromCart(recipe.recipeId)
        })
        
        // 刷新购物车数据
        this.loadCartData()
        
        // 重置选择状态
        this.setData({
          selectedFriend: null,
          selectedFriendId: '',
          selectedTime: '',
          selectedTimeLabel: '',
          orderNotes: ''
        })
        
        wx.showToast({
          title: '订单生成成功',
          icon: 'success',
          duration: 2000
        })
        
        // 跳转到订单页面
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/order-list/order-list'
          })
        }, 2000)
      } else {
        wx.showToast({
          title: res.result.message || '订单创建失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('创建订单失败:', err)
      wx.showToast({
        title: '订单创建失败',
        icon: 'none'
      })
    })
  },

  // 跳转到菜谱页面
  onGoToRecipes: function() {
    wx.switchTab({
      url: '/pages/recipe-list/recipe-list'
    })
  },

  // 格式化日期
  formatDate: function(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})