const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    friends: [],
    filteredFriends: [],
    friendRequestCount: 0,
    loading: true,
    isDataLoaded: false,
    showSearch: true,
    searchKeyword: '',
    searchFocus: true
  },

  onLoad: function () {
    console.log('=== 好友页面onLoad开始 ===')
    console.log('云开发状态:', wx.cloud ? '已初始化' : '未初始化')
    console.log('用户登录状态:', app.isLoggedIn())
    console.log('全局用户信息:', app.globalData.userInfo)
    
    // 先测试云函数调用是否正常
    this.testCloudFunction()
  },

  // 测试云函数调用
  testCloudFunction: function() {
    console.log('=== 测试云函数调用 ===')
    if (!wx.cloud) {
      console.error('云开发不可用')
      return
    }
    
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getProfile'
      },
      success: (res) => {
        console.log('测试云函数调用成功:', res)
        // 测试成功后直接调用好友数据加载，不通过loadFriendsData
        this.loadFriendsDataDirect()
      },
      fail: (error) => {
        console.error('测试云函数调用失败:', error)
        // 即使测试失败也尝试加载好友数据
        this.loadFriendsDataDirect()
      }
    })
  },

  onShow: function () {
    // 更新自定义tabbar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 'friends'
      })
    }
    
    // 只在数据未加载或需要刷新时才加载数据
    if (!this.data.isDataLoaded) {
      this.loadFriendsData()
    }
  },

  // 页面间通信 - 处理好友请求结果
  onFriendRequestHandled: function() {
    // 当好友请求被处理时，刷新数据
    this.refreshData()
  },

  // 手动刷新数据
  refreshData: function() {
    this.setData({ isDataLoaded: false })
    this.loadFriendsData()
  },

  // 刷新按钮点击
  onRefresh: function() {
    console.log('用户点击刷新按钮')
    this.refreshData()
  },

  // 直接加载好友数据（不检查loading状态）
  loadFriendsDataDirect: function() {
    console.log('=== loadFriendsDataDirect开始执行 ===')
    console.log('当前loading状态:', this.data.loading)
    console.log('当前isDataLoaded状态:', this.data.isDataLoaded)
    
    // 检查云开发是否可用
    if (!wx.cloud) {
      console.error('云开发不可用，请检查基础库版本')
      wx.showToast({
        title: '云开发不可用',
        icon: 'none'
      })
      this.setData({
        friends: [],
        loading: false,
        isDataLoaded: false
      })
      return
    }
    
    console.log('开始加载好友数据...')
    this.setData({ loading: true })
    
    // 添加超时处理
    const timeoutId = setTimeout(() => {
      console.error('好友数据加载超时')
      wx.showToast({
        title: '加载超时，请重试',
        icon: 'none'
      })
      this.setData({
        friends: [],
        loading: false,
        isDataLoaded: false
      })
    }, 10000) // 10秒超时
    
    console.log('准备调用云函数friend，action: getFriendList')
    wx.cloud.callFunction({
      name: 'friend',
      data: {
        action: 'getFriendList'
      },
      success: (res) => {
        clearTimeout(timeoutId)
        console.log('=== 云函数调用成功 ===')
        console.log('返回结果:', res)
        if (res.result && res.result.success) {
          const friends = res.result.data || []
          this.setData({
            friends: friends,
            filteredFriends: friends,
            loading: false,
            isDataLoaded: true
          })
          console.log('好友数据加载完成，好友数量:', friends.length)
          // 同时获取好友请求数量
          this.loadFriendRequestCount()
        } else {
          console.error('云函数返回失败:', res.result)
          wx.showToast({
            title: res.result?.message || '获取好友列表失败',
            icon: 'none'
          })
          this.setData({
            friends: [],
            loading: false,
            isDataLoaded: false
          })
        }
      },
      fail: (error) => {
        clearTimeout(timeoutId)
        console.error('=== 云函数调用失败 ===')
        console.error('错误详情:', error)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
        this.setData({
          friends: [],
          loading: false,
          isDataLoaded: false
        })
      }
    })
    console.log('云函数调用已发起')
  },

  // 加载好友数据（带重复检查）
  loadFriendsData: function() {
    console.log('=== loadFriendsData开始执行 ===')
    console.log('当前loading状态:', this.data.loading)
    console.log('当前isDataLoaded状态:', this.data.isDataLoaded)
    
    // 防止重复加载
    if (this.data.loading) {
      console.log('正在加载中，跳过重复请求')
      return
    }
    
    // 如果数据已加载，直接返回
    if (this.data.isDataLoaded) {
      console.log('数据已加载，跳过请求')
      return
    }
    
    // 调用直接加载方法
    this.loadFriendsDataDirect()
  },

  // 加载好友请求数量
  loadFriendRequestCount: function() {
    wx.cloud.callFunction({
      name: 'friend',
      data: {
        action: 'getFriendRequests'
      },
      success: (res) => {
        if (res.result.success) {
          const pendingCount = res.result.data.pendingRequests ? res.result.data.pendingRequests.length : 0
          this.setData({
            friendRequestCount: pendingCount
          })
        }
      },
      fail: (error) => {
        console.error('获取好友请求数量失败:', error)
      }
    })
  },

  // 切换搜索框显示（现在搜索框默认显示，此方法保留以防需要）
  onToggleSearch: function() {
    // 搜索框默认显示，此方法暂时保留
    console.log('搜索框已默认显示')
  },

  // 搜索输入
  onSearchInput: function(e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    this.filterFriends()
  },

  // 搜索确认
  onSearchConfirm: function() {
    this.filterFriends()
  },

  // 清空搜索
  onClearSearch: function() {
    this.setData({
      searchKeyword: '',
      filteredFriends: this.data.friends
    })
  },

  // 过滤好友列表
  filterFriends: function() {
    const keyword = this.data.searchKeyword.trim().toLowerCase()
    const friends = this.data.friends
    
    if (!keyword) {
      this.setData({
        filteredFriends: friends
      })
      return
    }
    
    const filtered = friends.filter(friend => {
      return friend.nickname.toLowerCase().includes(keyword)
    })
    
    this.setData({
      filteredFriends: filtered
    })
    
    console.log(`搜索"${keyword}"，找到${filtered.length}个好友`)
  },

  // 添加好友
  onAddFriend: function() {
    wx.navigateTo({
      url: '/pages/friend-requests/friend-requests'
    })
  },

  // 跳转到好友请求页面
  onGoToRequests: function() {
    wx.navigateTo({
      url: '/pages/friend-requests/friend-requests'
    })
  },

  // 点击好友
  onFriendTap: function(e) {
    const friend = e.currentTarget.dataset.friend
    console.log('点击好友:', friend)
    
    // 可以跳转到好友详情页面
    wx.showToast({
      title: `查看${friend.nickname}的菜谱`,
      icon: 'none'
    })
  },

  // 好友菜单
  onFriendMenu: function(e) {
    const friend = e.currentTarget.dataset.friend
    
    wx.showActionSheet({
      itemList: ['查看菜谱', '发送消息', '删除好友'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            // 查看菜谱
            wx.showToast({
              title: `查看${friend.nickname}的菜谱`,
              icon: 'none'
            })
            break
          case 1:
            // 发送消息
            wx.showToast({
              title: '消息功能开发中',
              icon: 'none'
            })
            break
          case 2:
            // 删除好友
            this.deleteFriend(friend)
            break
        }
      }
    })
  },

  // 删除好友
  deleteFriend: function(friend) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除好友"${friend.nickname}"吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          wx.cloud.callFunction({
            name: 'friend',
            data: {
              action: 'deleteFriend',
              friendOpenid: friend.openid
            },
            success: (res) => {
              wx.hideLoading()
              console.log('删除好友成功:', res)
              if (res.result.success) {
                // 从本地列表中移除
                const friends = this.data.friends.filter(item => item.id !== friend.id)
                this.setData({ friends })
                
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
              } else {
                wx.showToast({
                  title: res.result.message || '删除失败',
                  icon: 'none'
                })
              }
            },
            fail: (error) => {
              wx.hideLoading()
              console.error('删除好友失败:', error)
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  }
})  
