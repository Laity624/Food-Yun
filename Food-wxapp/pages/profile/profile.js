const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    showLoginPrompt: false,
    promptContent: '',
    showNicknameModal: false,
    editingNickname: '',
    nicknameLength: 0,
    isPreviewMode: false
  },

  onLoad: function () {
    this.checkLoginAndLoad()
  },

  onShow: function () {
    this.checkLoginAndLoad()
    
    // 检查是否有裁剪后的头像需要上传
    const app = getApp()
    if (app.globalData.croppedAvatarPath) {
      const croppedPath = app.globalData.croppedAvatarPath
      app.globalData.croppedAvatarPath = null // 清除数据
      this.uploadAvatar(croppedPath)
    }
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad: function() {
    const app = getApp()
    
    // 允许预览模式访问
    if (!app.isLoggedIn() && !app.globalData.isPreviewMode) {
      // 未登录且不是预览模式，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 已登录或预览模式，更新用户信息
    if (app.globalData.isPreviewMode) {
      // 预览模式，显示预览用户信息
      this.setData({
        userInfo: {
          nickname: '预览用户',
          avatar: '/images/default-avatar.png'
        },
        isPreviewMode: true
      })
    } else if (app.isLoggedIn()) {
      // 已登录，显示真实用户信息
      this.setData({
        userInfo: app.globalData.userInfo,
        isPreviewMode: false
      })
    } else {
      // 未登录且不是预览模式，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  // 处理预览模式提示和功能跳转
  handlePreviewMode: function(message, callback) {
    const app = getApp()
    
    if (app.globalData.isPreviewMode || !app.isLoggedIn()) {
      this.setData({
        showLoginPrompt: true,
        promptContent: message
      })
    } else {
      // 已登录，执行相应的功能
      callback && callback()
    }
  },

  // 关闭提示弹窗
  onPromptClose: function() {
    this.setData({ showLoginPrompt: false })
  },

  // 点击立即登录
  onPromptLogin: function() {
    this.setData({ showLoginPrompt: false })
    wx.navigateTo({ url: '/pages/login/login' })
  },

  // 我的菜谱
  onMyRecipes: function() {
    this.handlePreviewMode('查看菜谱需要登录后使用', () => {
      wx.navigateTo({
        url: '/pages/recipe-list/recipe-list?type=my'
      })
    })
  },

  // 我的订单
  onMyOrders: function() {
    this.handlePreviewMode('查看订单需要登录后使用', () => {
      wx.navigateTo({
        url: '/pages/order-list/order-list'
      })
    })
  },

  // 我的收藏
  onMyFavorites: function() {
    this.handlePreviewMode('查看收藏需要登录后使用', () => {
      util.showError('收藏功能开发中')
    })
  },

  // 数据统计
  onStatistics: function() {
    this.handlePreviewMode('查看数据统计需要登录后使用', () => {
      util.showError('数据统计功能开发中')
    })
  },

  // 好友管理
  onFriends: function() {
    this.handlePreviewMode('好友功能需要登录后使用', () => {
      wx.navigateTo({
        url: '/pages/friends/friends'
      })
    })
  },

  // 收藏
  onFavorites: function() {
    this.handlePreviewMode('收藏功能需要登录后使用', () => {
      util.showError('收藏功能开发中')
    })
  },

  // 设置
  onSettings: function() {
    this.handlePreviewMode('设置功能需要登录后使用', () => {
      util.showError('设置功能开发中')
    })
  },

  // 帮助中心
  onHelp: function() {
    this.handlePreviewMode('帮助中心需要登录后使用', () => {
      util.showError('帮助中心开发中')
    })
  },

  // 关于我们
  onAbout: function() {
    this.handlePreviewMode('关于我们需要登录后使用', () => {
      util.showError('关于我们开发中')
    })
  },

  // 通知中心
  onNotifications: function() {
    this.handlePreviewMode('通知功能需要登录后使用', () => {
      util.showError('通知功能开发中')
    })
  },

  // 复制搜索码
  onCopySearchCode: function() {
    this.handlePreviewMode('复制搜索码需要登录后使用', () => {
      if (this.data.userInfo.searchCode) {
        wx.setClipboardData({
          data: this.data.userInfo.searchCode,
          success: () => {
            util.showSuccess('搜索码已复制')
          }
        })
      }
    })
  },

  // 分享搜索码
  onShareSearchCode: function() {
    this.handlePreviewMode('分享搜索码需要登录后使用', () => {
      util.showError('分享功能开发中')
    })
  },

  // 退出登录
  onLogout: function() {
    util.showConfirm('确定要退出登录吗？').then(confirm => {
      if (confirm) {
        // 清除全局数据
        app.globalData.userInfo = null
        app.globalData.openid = null
        
        // 清除本地存储
        wx.removeStorageSync('userInfo')
        
        util.showSuccess('已退出登录')
        
        // 跳转到登录页
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    })
  },

  // 头像点击事件 - 上传新头像
  onAvatarClick: function() {
    const app = getApp()
    
    // 检查登录状态
    if (!app.isLoggedIn()) {
      util.showError('请先登录后再修改头像')
      return
    }

    // 显示选择菜单
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? 'camera' : 'album'
        this.chooseImage(sourceType)
      }
    })
  },

  // 选择图片
  chooseImage: function(sourceType) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [sourceType],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        // 跳转到自定义裁剪页面
        wx.navigateTo({
          url: `/pages/avatar-cropper/avatar-cropper?src=${tempFilePath}`
        })
      }
    })
  },

  // 上传头像
  uploadAvatar: function(tempFilePath) {
    util.showLoading('上传中...')

    // 上传到云存储
    const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath,
      success: (res) => {
        // 直接使用fileID，不需要获取临时链接
        this.updateUserAvatar(res.fileID)
      },
      fail: (err) => {
        util.hideLoading()
        util.showError('上传失败')
        console.error('上传失败', err)
      }
    })
  },

  // 更新用户头像
  updateUserAvatar: function(avatarUrl) {
    const app = getApp()

    util.callCloudFunction('user', {
      action: 'updateProfile',
      avatar: avatarUrl
    }).then(res => {
      util.hideLoading()

      // 更新全局用户信息
      app.globalData.userInfo.avatar = avatarUrl

      // 更新本地存储
      wx.setStorageSync('userInfo', app.globalData.userInfo)

      // 更新页面显示
      this.setData({
        'userInfo.avatar': avatarUrl
      })

      util.showSuccess('头像更新成功')
    }).catch(err => {
      util.hideLoading()
      util.showError('更新失败')
      console.error('更新失败', err)
    })
  },

  // 编辑昵称
  onEditNickname: function() {
    const app = getApp()

    // 检查登录状态
    if (!app.isLoggedIn()) {
      util.showError('请先登录后再修改昵称')
      return
    }

    this.setData({
      showNicknameModal: true,
      editingNickname: this.data.userInfo.nickname || '',
      nicknameLength: (this.data.userInfo.nickname || '').length
    })
  },

  // 关闭模态框
  onCloseModal: function() {
    this.setData({
      showNicknameModal: false,
      editingNickname: '',
      nicknameLength: 0
    })
  },

  // 阻止事件冒泡
  stopPropagation: function(e) {
    // 空函数，阻止事件冒泡
  },

  // 昵称输入
  onNicknameInput: function(e) {
    const value = e.detail.value
    this.setData({
      editingNickname: value,
      nicknameLength: value.length
    })
  },

  // 确认修改昵称
  onUpdateNickname: function() {
    const nickname = this.data.editingNickname.trim()

    if (!nickname) {
      util.showError('昵称不能为空')
      return
    }

    if (nickname.length > 10) {
      util.showError('昵称不能超过10个字符')
      return
    }

    if (nickname === this.data.userInfo.nickname) {
      this.onCloseModal()
      return
    }

    this.updateNickname(nickname)
  },

  // 防止弹窗背景滚动
  preventTouchMove: function() {
    return false
  },

  // 更新昵称
  updateNickname: function(nickname) {
    util.showLoading('更新中...')

    const app = getApp()
    util.callCloudFunction('user', {
      action: 'updateProfile',
      nickname: nickname
    }).then(res => {
      util.hideLoading()

      // 更新全局用户信息
      app.globalData.userInfo.nickname = nickname

      // 更新本地存储
      wx.setStorageSync('userInfo', app.globalData.userInfo)

      // 更新页面显示并关闭模态框
      this.setData({
        'userInfo.nickname': nickname,
        showNicknameModal: false,
        editingNickname: '',
        nicknameLength: 0
      })

      util.showSuccess('昵称更新成功')
    }).catch(err => {
      util.hideLoading()
      util.showError('更新失败')
      console.error('更新失败', err)
    })
  }
})