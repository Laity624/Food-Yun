App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-2gtjr5eob6136a30', // 云环境ID，需要在微信开发者工具中创建
        traceUser: true,
      })
    }

    // 获取用户信息
    this.globalData.userInfo = null
    this.globalData.openid = null
    
    // 检查本地登录状态
    this.checkLoginStatus()
  },

  onShow: function () {
    // 小程序显示时的逻辑
  },

  onHide: function () {
    // 小程序隐藏时的逻辑
  },

  onError: function (msg) {
    console.error('小程序发生脚本错误或 API 调用报错：', msg)
  },

  // 检查登录状态
  checkLoginStatus: function() {
    // 检查本地是否有用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      console.log('发现本地用户信息', userInfo)
    }
  },

  // 检查是否已登录
  isLoggedIn: function() {
    return !!(this.globalData.userInfo && this.globalData.openid)
  },

  // 手动登录
  login: function(userInfo) {
    const util = require('./utils/util')
    
    return util.callCloudFunction('login', {
      userInfo: userInfo
    }).then(res => {
      this.globalData.openid = res.openid
      this.globalData.userInfo = res.userInfo
      
      // 保存用户信息到本地
      wx.setStorageSync('userInfo', res.userInfo)
      
      return res
    })
  },

  globalData: {
    userInfo: null,
    openid: null,
    isPreviewMode: false, // 预览模式标志
    version: '1.0.0'
  }
})