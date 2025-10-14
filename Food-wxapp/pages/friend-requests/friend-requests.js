const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userSearchCode: 'FY2024',
    searchCode: '',
    pendingRequests: [],
    sentRequests: [],
    loading: true,
    statusBarHeight: 20,
    currentUserOpenid: ''
  },

  onLoad: function () {
    this.getStatusBarHeight()
    this.loadCurrentUserOpenid()
    this.loadUserSearchCode()
    this.loadRequestsData()
  },

  onShow: function () {
    // 获取状态栏高度
    this.getStatusBarHeight()
    // 刷新数据
    this.loadUserSearchCode()
    this.loadRequestsData()
  },

  onReady: function () {
    // 页面渲染完成后再次获取状态栏高度
    this.getStatusBarHeight()
  },

  // 获取状态栏高度
  getStatusBarHeight: function() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      const statusBarHeight = systemInfo.statusBarHeight || 20
      console.log('获取到状态栏高度:', statusBarHeight)
      
      this.setData({
        statusBarHeight: statusBarHeight
      })
    } catch (error) {
      console.error('获取状态栏高度失败:', error)
      this.setData({
        statusBarHeight: 20
      })
    }
  },

  // 加载当前用户openid
  loadCurrentUserOpenid: function() {
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getProfile'
      },
      success: (res) => {
        if (res.result.success && res.result.data.user) {
          this.setData({
            currentUserOpenid: res.result.data.user.openid
          })
        }
      },
      fail: (error) => {
        console.error('获取当前用户openid失败:', error)
      }
    })
  },

  // 加载用户搜索码
  loadUserSearchCode: function() {
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getProfile'
      },
      success: (res) => {
        console.log('获取用户信息成功:', res)
        if (res.result.success && res.result.data.user) {
          const user = res.result.data.user
          if (user.searchCode) {
            this.setData({
              userSearchCode: user.searchCode
            })
          } else {
            // 如果没有搜索码，生成一个
            this.generateUserSearchCode()
          }
        } else {
          // 如果用户不存在，生成一个搜索码
          this.generateUserSearchCode()
        }
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error)
        // 生成一个默认搜索码
        this.generateUserSearchCode()
      }
    })
  },

  // 生成用户搜索码
  generateUserSearchCode: function() {
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'generateSearchCode'
      },
      success: (res) => {
        console.log('生成搜索码成功:', res)
        if (res.result.success) {
          this.setData({
            userSearchCode: res.result.data.searchCode
          })
          
          // 同步更新全局用户信息
          const app = getApp()
          if (app.globalData.userInfo) {
            app.globalData.userInfo.searchCode = res.result.data.searchCode
            // 更新本地存储
            wx.setStorageSync('userInfo', app.globalData.userInfo)
          }
        } else {
          // 如果生成失败，使用默认值
          this.setData({
            userSearchCode: 'FY' + Date.now().toString().slice(-6)
          })
        }
      },
      fail: (error) => {
        console.error('生成搜索码失败:', error)
        // 使用默认值
        this.setData({
          userSearchCode: 'FY' + Date.now().toString().slice(-6)
        })
      }
    })
  },

  // 加载请求数据
  loadRequestsData: function() {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'friend',
      data: {
        action: 'getFriendRequests'
      },
      success: (res) => {
        console.log('获取好友请求成功:', res)
        if (res.result.success) {
          this.setData({
            pendingRequests: res.result.data.pendingRequests || [],
            sentRequests: res.result.data.sentRequests || [],
            loading: false
          })
        } else {
          wx.showToast({
            title: res.result.message || '获取请求列表失败',
            icon: 'none'
          })
          this.setData({
            pendingRequests: [],
            sentRequests: [],
            loading: false
          })
        }
      },
      fail: (error) => {
        console.error('获取好友请求失败:', error)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
        this.setData({
          pendingRequests: [],
          sentRequests: [],
          loading: false
        })
      }
    })
  },

  // 返回上一页
  onBack: function() {
    wx.navigateBack()
  },

  // 清空所有请求
  onClearAll: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有好友请求吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            pendingRequests: [],
            sentRequests: []
          })
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  // 搜索码输入
  onSearchCodeInput: function(e) {
    this.setData({
      searchCode: e.detail.value
    })
  },

  // 清空搜索码
  onClearSearchCode: function() {
    this.setData({
      searchCode: ''
    })
  },

  // 搜索好友
  onSearchFriend: function() {
    const searchCode = this.data.searchCode.trim()
    
    if (!searchCode) {
      wx.showToast({
        title: '请输入搜索码',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '搜索中...' })
    
    // 先搜索用户
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'searchUser',
        searchCode: searchCode
      },
      success: (res) => {
        wx.hideLoading()
        console.log('搜索用户成功:', res)
        if (res.result.success) {
          const user = res.result.data.user
          
          // 检查是否是自己
          if (user.openid === this.data.currentUserOpenid) {
            wx.showToast({
              title: '不能添加自己为好友',
              icon: 'none'
            })
            return
          }
          
          wx.showModal({
            title: '找到用户',
            content: `是否向"${user.nickname}"发送好友请求？`,
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.sendFriendRequest(user.openid, user.nickname, user.avatar)
              }
            }
          })
        } else {
          wx.showToast({
            title: res.result.message || '用户不存在',
            icon: 'none'
          })
        }
      },
      fail: (error) => {
        wx.hideLoading()
        console.error('搜索用户失败:', error)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 发送好友请求
  sendFriendRequest: function(targetOpenid, nickname, avatar) {
    wx.showLoading({ title: '发送中...' })
    
    wx.cloud.callFunction({
      name: 'friend',
      data: {
        action: 'sendFriendRequest',
        targetOpenid: targetOpenid,
        message: ''
      },
      success: (res) => {
        wx.hideLoading()
        console.log('发送好友请求成功:', res)
        if (res.result.success) {
          wx.showToast({
            title: '请求已发送',
            icon: 'success'
          })
          
          // 添加到已发送请求列表
          const newSentRequest = {
            id: Date.now().toString(),
            targetOpenid: targetOpenid,
            nickname: nickname,
            avatar: avatar,
            time: '刚刚',
            status: '待确认'
          }
          
          this.setData({
            sentRequests: [newSentRequest, ...this.data.sentRequests]
          })
          
          // 清空搜索框
          this.setData({
            searchCode: ''
          })
          
          // 通知好友页面刷新数据
          this.notifyFriendsPageRefresh()
        } else {
          wx.showToast({
            title: res.result.message || '发送失败',
            icon: 'none'
          })
        }
      },
      fail: (error) => {
        wx.hideLoading()
        console.error('发送好友请求失败:', error)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 分享搜索码
  onShareCode: function() {
    wx.setClipboardData({
      data: this.data.userSearchCode,
      success: () => {
        wx.showToast({
          title: '搜索码已复制',
          icon: 'success'
        })
      }
    })
  },

  // 更新搜索码
  onUpdateSearchCode: function() {
    wx.showModal({
      title: '更新搜索码',
      content: '确定要生成新的搜索码吗？旧的搜索码将失效。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '生成中...' })
          
          wx.cloud.callFunction({
            name: 'user',
            data: {
              action: 'updateSearchCode'
            },
            success: (res) => {
              wx.hideLoading()
              console.log('更新搜索码成功:', res)
              if (res.result.success) {
                this.setData({
                  userSearchCode: res.result.data.searchCode
                })
                
                // 同步更新全局用户信息
                const app = getApp()
                if (app.globalData.userInfo) {
                  app.globalData.userInfo.searchCode = res.result.data.searchCode
                  // 更新本地存储
                  wx.setStorageSync('userInfo', app.globalData.userInfo)
                }
                
                wx.showToast({
                  title: '搜索码已更新',
                  icon: 'success'
                })
              } else {
                wx.showToast({
                  title: res.result.message || '更新失败',
                  icon: 'none'
                })
              }
            },
            fail: (error) => {
              wx.hideLoading()
              console.error('更新搜索码失败:', error)
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 接受好友请求
  onAcceptRequest: function(e) {
    const requestId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认接受',
      content: '确定要接受这个好友请求吗？',
      success: (res) => {
        if (res.confirm) {
          this.handleFriendRequest(requestId, true)
        }
      }
    })
  },

  // 拒绝好友请求
  onRejectRequest: function(e) {
    const requestId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝这个好友请求吗？',
      success: (res) => {
        if (res.confirm) {
          this.handleFriendRequest(requestId, false)
        }
      }
    })
  },

  // 处理好友请求
  handleFriendRequest: function(requestId, accept) {
    wx.showLoading({ title: accept ? '接受中...' : '拒绝中...' })
    
    wx.cloud.callFunction({
      name: 'friend',
      data: {
        action: 'handleFriendRequest',
        requestId: requestId,
        accept: accept
      },
      success: (res) => {
        wx.hideLoading()
        console.log('处理好友请求成功:', res)
        if (res.result.success) {
          // 从待处理列表中移除
          this.removePendingRequest(requestId)
          
          wx.showToast({
            title: accept ? '已添加为好友' : '已拒绝',
            icon: 'success'
          })
          
          // 通知好友页面刷新数据
          if (accept) {
            this.notifyFriendsPageRefresh()
          }
        } else {
          wx.showToast({
            title: res.result.message || '操作失败',
            icon: 'none'
          })
        }
      },
      fail: (error) => {
        wx.hideLoading()
        console.error('处理好友请求失败:', error)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 通知好友页面刷新数据
  notifyFriendsPageRefresh: function() {
    // 通过页面栈找到好友页面并刷新
    const pages = getCurrentPages()
    for (let i = pages.length - 1; i >= 0; i--) {
      const page = pages[i]
      if (page.route === 'pages/friends/friends' && page.onFriendRequestHandled) {
        page.onFriendRequestHandled()
        break
      }
    }
  },

  // 移除待处理请求
  removePendingRequest: function(requestId) {
    const pendingRequests = this.data.pendingRequests.filter(item => item.id !== requestId)
    this.setData({ pendingRequests })
  }
})
