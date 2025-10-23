const app = getApp()
const util = require('../../utils/util')

/**
 * 好友选择器组件
 * 用于选择订单分配给哪个好友制作
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前选中的好友ID
    selectedFriendId: {
      type: String,
      value: ''
    },
    // 是否显示选择器
    show: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    friends: [],
    filteredFriends: [],
    loading: false,
    searchKeyword: '',
    isDataLoaded: false
  },

  /**
   * 数据监听器
   */
  observers: {
    'show': function(show) {
      // 当组件显示且数据未加载时，加载好友列表
      if (show && !this.data.isDataLoaded) {
        this.loadFriends()
      }
    }
  },

  lifetimes: {
    attached() {
      // 组件初始化时不自动加载数据，等待show属性变化
      console.log('好友选择器组件已初始化')
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 加载好友列表
     */
    loadFriends: function() {
      console.log('开始加载好友列表...')
      this.setData({ loading: true })
      
      // 检查登录状态
      if (!app.globalData.openid) {
        console.log('用户未登录，无法加载好友列表')
        this.setData({ 
          loading: false,
          friends: [],
          isDataLoaded: true
        })
        util.showError('请先登录')
        return
      }

      // 调用云函数获取好友列表
      util.callCloudFunction('friend', {
        action: 'getFriendList'
      }).then(res => {
        console.log('云函数调用成功:', res)
        if (res.success && res.data) {
          // 获取当前用户信息
          this.getCurrentUserInfo().then(currentUser => {
            // 将当前用户添加到好友列表顶部
            const allFriends = [currentUser, ...res.data]
            
            // 转换数据格式
            const formattedFriends = allFriends.map(friend => this.formatFriendData(friend))
            
            console.log('好友列表加载成功，共', formattedFriends.length, '个好友')
            this.setData({
              friends: formattedFriends,
              filteredFriends: formattedFriends,
              loading: false,
              isDataLoaded: true
            })
          }).catch(err => {
            console.error('获取当前用户信息失败:', err)
            // 即使获取当前用户失败，也显示好友列表
            const formattedFriends = res.data.map(friend => this.formatFriendData(friend))
            console.log('好友列表加载成功（无当前用户），共', formattedFriends.length, '个好友')
            this.setData({
              friends: formattedFriends,
              filteredFriends: formattedFriends,
              loading: false,
              isDataLoaded: true
            })
          })
        } else {
          console.log('云函数返回失败:', res.message)
          this.setData({
            friends: [],
            filteredFriends: [],
            loading: false,
            isDataLoaded: true
          })
          util.showError(res.message || '获取好友列表失败')
        }
      }).catch(err => {
        console.error('获取好友列表失败:', err)
        this.setData({
          friends: [],
          filteredFriends: [],
          loading: false,
          isDataLoaded: true
        })
        util.showError('获取好友列表失败')
      })
    },

    /**
     * 获取当前用户信息
     */
    getCurrentUserInfo: function() {
      return new Promise((resolve, reject) => {
        // 先尝试从全局数据获取
        if (app.globalData.userInfo && app.globalData.openid) {
          console.log('从全局数据获取用户信息:', app.globalData.userInfo)
          
          // 尝试多个可能的头像字段名
          const avatar = app.globalData.userInfo.avatar || 
                        app.globalData.userInfo.avatarUrl || 
                        '/images/default-avatar.png'
          
          console.log('获取到的头像URL:', avatar)
          
          const currentUser = {
            id: app.globalData.openid,
            openid: app.globalData.openid,
            nickname: app.globalData.userInfo.nickName || app.globalData.userInfo.nickname || '我',
            avatar: avatar,
            recipeCount: 0,
            statusText: '在线',
            statusClass: 'online',
            lastActive: '刚刚',
            addTime: new Date(),
            isCurrentUser: true
          }
          resolve(currentUser)
          return
        }

        // 如果全局数据没有，调用用户云函数获取
        util.callCloudFunction('user', {
          action: 'getUserInfo'
        }).then(res => {
          console.log('从云函数获取用户信息:', res)
          if (res.success && res.data) {
            const currentUser = {
              id: res.data.openid,
              openid: res.data.openid,
              nickname: res.data.nickname || '我',
              avatar: res.data.avatar || '/images/default-avatar.png',
              recipeCount: 0,
              statusText: '在线',
              statusClass: 'online',
              lastActive: '刚刚',
              addTime: new Date(),
              isCurrentUser: true
            }
            console.log('云函数获取到的用户信息:', currentUser)
            resolve(currentUser)
          } else {
            reject(new Error('获取用户信息失败'))
          }
        }).catch(reject)
      })
    },

    /**
     * 格式化好友数据
     */
    formatFriendData: function(friend) {
      return {
        _id: friend.id || friend.openid,
        openid: friend.openid,
        nickname: friend.nickname || '未知用户',
        avatar: friend.avatar || '/images/default-avatar.png',
        isOnline: friend.statusClass === 'online' || friend.isOnline || false,
        isCurrentUser: friend.isCurrentUser || false,
        recipeCount: friend.recipeCount || 0,
        lastActive: friend.lastActive || '未知'
      }
    },

    /**
     * 选择好友
     */
    onSelectFriend: function(e) {
      // 阻止事件冒泡，防止触发遮罩层的关闭事件
      e.stopPropagation && e.stopPropagation()
      
      const friendId = e.currentTarget.dataset.friendId
      const friend = this.data.friends.find(f => f._id === friendId)
      
      if (friend) {
        this.triggerEvent('friendselect', {
          friendId: friendId,
          friend: friend
        })
      }
    },

    /**
     * 搜索输入
     */
    onSearchInput: function(e) {
      const searchKeyword = e.detail
      console.log('搜索输入:', searchKeyword)
      this.setData({
        searchKeyword: searchKeyword
      })
      
      // 更新过滤后的好友列表
      this.updateFilteredFriends(searchKeyword)
    },

    /**
     * 更新过滤后的好友列表
     */
    updateFilteredFriends: function(searchKeyword) {
      const { friends } = this.data
      let filteredFriends = friends
      
      if (searchKeyword && searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim()
        filteredFriends = friends.filter(friend => {
          const name = (friend.nickname || '').toString().toLowerCase()
          return name.includes(kw)
        })
      }
      
      console.log('搜索关键词:', searchKeyword, '过滤后好友数量:', filteredFriends.length)
      this.setData({
        filteredFriends: filteredFriends
      })
    },

    /**
     * 关闭选择器
     */
    onClose: function() {
      this.triggerEvent('close')
    },

    // 对外暴露一个安全关闭方法，便于父组件调用
    close: function() {
      this.onClose()
    },

    /**
     * 刷新好友列表
     */
    refresh: function() {
      console.log('手动刷新好友列表')
      this.setData({ isDataLoaded: false })
      this.loadFriends()
    }
  }
})

