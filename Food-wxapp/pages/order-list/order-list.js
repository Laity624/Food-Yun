const TagData = require('../../utils/tagData')

/**
 * 订单列表页面
 */
Page({
  data: {
    // 订单数据
    orders: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
    refreshing: false,
    
    // 状态筛选
    statusTabs: TagData.getOrderStatusTabs(),
    currentStatus: 'all',
    
    // 搜索
    searchValue: '',
    showSearch: false,
    
    // 用户信息
    userInfo: null
  },

  // 防抖定时器
  searchTimer: null,

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



  onLoad: function() {
    this.getUserInfo()
    this.loadOrders()
  },

  onUnload: function() {
    // 页面卸载时清理定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
      this.searchTimer = null
    }
  },

  onShow: function() {
    // 更新自定义tabbar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 'orderList'
      })
    }
    
    // 更新用户信息
    this.getUserInfo()
    
    // 刷新数据
    // this.refreshData()
  },


  // scroll-view 下拉刷新
  onRefresh: function() {
    this.setData({
      refreshing: true
    })
    this.refreshData()
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 刷新数据
  refreshData: function() {
    this.setData({
      orders: [],
      page: 1,
      hasMore: true,
      loading: true,
      refreshing: true
    })
    this.loadOrders()
  },

  // 加载订单列表
  loadOrders: function() {
    const { page, pageSize, currentStatus, searchValue } = this.data
    
    console.log('开始加载订单数据，状态:', currentStatus, '搜索值:', searchValue)
    
    wx.cloud.callFunction({
      name: 'order',
      data: {
        action: 'getOrderList',
        status: currentStatus === 'all' ? null : currentStatus,
        page: page,
        limit: pageSize,
        searchValue: searchValue || ''
      }
    }).then(res => {
      console.log('订单列表云函数调用结果:', res)
      if (res.result.success) {
        const orders = res.result.data.orders || []
        this.setData({
          orders: page === 1 ? orders : [...this.data.orders, ...orders],
          hasMore: orders.length === pageSize,
          loading: false,
          refreshing: false
        })
      } else {
        console.error('订单列表加载失败:', res.result)
        this.setData({ 
          loading: false,
          refreshing: false
        })
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
      }
      wx.stopPullDownRefresh()
    }).catch(err => {
      this.setData({ 
        loading: false,
        refreshing: false
      })
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      console.error('加载订单列表失败', err)
    })
  },



  // 加载更多
  loadMore: function() {
    this.setData({
      page: this.data.page + 1,
      loading: true
    })
    this.loadOrders()
  },

  // 状态筛选
  onStatusChange: function(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      orders: [],
      page: 1,
      hasMore: true
    })
    this.loadOrders()
  },

  // 搜索功能
  onSearchClick: function() {
    this.setData({
      showSearch: !this.data.showSearch
    })
  },

  onSearchChange: function(e) {
    console.log('搜索输入变化===', e);
    const searchValue = e.detail
    
    // 更新搜索值
    this.setData({
      searchValue: searchValue
    })
    
    // 清除之前的定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
    
    // 设置防抖定时器，500ms后执行搜索
    this.searchTimer = setTimeout(() => {
      this.performSearch()
    }, 500)
  },

  // 新增独立的搜索方法
  performSearch: function() {
    this.setData({
      orders: [],
      page: 1,
      hasMore: true,
      loading: true
      // 注意：不设置 refreshing: true，避免与下拉刷新冲突
    })
    this.loadOrders()
  },

  onSearchClear: function() {
    this.setData({
      searchValue: '',
      showSearch: false
    })
    this.refreshData()
  },

  // 订单点击
  onOrderClick: function(e) {
    console.log('订单点击===', e);
    const orderId = e.currentTarget.dataset.orderId
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
    })
  },

  // 获取状态样式
  getStatusStyle: function(status) {
    return TagData.getOrderStatusStyle(status)
  },

  // 跳转到点餐页面
  onGoToDiancan: function() {
    wx.switchTab({
      url: '/pages/diancan/diancan'
    })
  },

  // 开始制作
  onStartCooking: function(e) {
    const orderId = e.currentTarget.dataset.orderId
    console.log('开始制作订单:', orderId)
    
    wx.showModal({
      title: '确认操作',
      content: '确定要开始制作这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, 'processing', '开始制作')
        }
      }
    })
  },

  // 完成制作
  onCompleteOrder: function(e) {
    const orderId = e.currentTarget.dataset.orderId
    console.log('完成制作订单:', orderId)
    
    wx.showModal({
      title: '确认操作',
      content: '确定要完成这个订单的制作吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, 'completed', '完成制作')
        }
      }
    })
  },

  // 取消订单
  onCancelOrder: function(e) {
    const orderId = e.currentTarget.dataset.orderId
    console.log('取消订单:', orderId)
    
    wx.showModal({
      title: '确认操作',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, 'cancelled', '取消订单')
        }
      }
    })
  },

  // 再次点餐
  onOrderAgain: function(e) {
    const orderId = e.currentTarget.dataset.orderId
    console.log('再次点餐:', orderId)
    
    // 跳转到点餐页面，可以预填充菜品信息
    wx.switchTab({
      url: '/pages/diancan/diancan'
    })
  },

  // 更新订单状态
  updateOrderStatus: function(orderId, status, actionName) {
    wx.showLoading({
      title: '处理中...'
    })

    wx.cloud.callFunction({
      name: 'order',
      data: {
        action: 'updateOrderStatus',
        orderId: orderId,
        status: status
      }
    }).then(res => {
      wx.hideLoading()
      console.log('更新订单状态结果:', res)
      
      if (res.result.success) {
        wx.showToast({
          title: `${actionName}成功`,
          icon: 'success'
        })
        // 刷新订单列表
        this.refreshData()
      } else {
        wx.showToast({
          title: res.result.message || `${actionName}失败`,
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: `${actionName}失败`,
        icon: 'error'
      })
      console.error('更新订单状态失败', err)
    })
  }
})  
