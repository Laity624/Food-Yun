import WeCropper from './we-cropper/we-cropper.js'

import GlobalConfig from './config.js'

const globalConfig = new GlobalConfig()
globalConfig.init()

const config = globalConfig
const device = wx.getSystemInfoSync()
const width = device.windowWidth
const height = device.windowHeight - 50

Page({
  data: {
    cropperOpt: {
      id: 'cropper',
      targetId: 'targetCropper',
      pixelRatio: device.pixelRatio,
      width,
      height,
      scale: 2.5,
      zoom: 8,
      cut: {
        x: (width - 300) / 2,
        y: (height - 300) / 2,
        width: 300,
        height: 300
      },
      boundStyle: {
        color: config.getThemeColor(),
        mask: 'rgba(0,0,0,0.8)',
        lineWidth: 2,
        borderWidth: 1
      }
    }
  },
  touchStart(e) {
    this.cropper.touchStart(e)
  },
  touchMove(e) {
    this.cropper.touchMove(e)
  },
  touchEnd(e) {
    this.cropper.touchEnd(e)
  },

  getCropperImage() {
    this.cropper.getCropperImage((path, err) => {
      if (err) {
        wx.showModal({
          title: '温馨提示',
          content: err.message
        })
      } else {
        // 使用全局事件或存储传递数据
        const app = getApp()
        app.globalData.croppedAvatarPath = path
        wx.navigateBack()
      }
    })
  },

  uploadTap() {
    wx.navigateBack({
      delta: 1,
    })
  },

  onLoad(option) {
    const {
      cropperOpt
    } = this.data
    cropperOpt.boundStyle.color = config.getThemeColor()
    this.setData({
      cropperOpt
    })
    if (option.src) {
      console.log(`onLoad src`, option.src)
      
      // 先获取图片信息，确保文件存在
      wx.getImageInfo({
        src: option.src,
        success: (res) => {
          console.log('图片信息获取成功', res)
          cropperOpt.src = res.path // 使用获取到的有效路径
          this.initCropper(cropperOpt)
        },
        fail: (err) => {
          console.error('获取图片信息失败', err)
          wx.showModal({
            title: '提示',
            content: '图片加载失败，请重新选择',
            showCancel: false,
            success: () => {
              wx.navigateBack()
            }
          })
        }
      })
    }
  },
  
  // 初始化裁剪器
  initCropper: function(cropperOpt) {
    this.cropper = new WeCropper(cropperOpt).on('ready', () => {
      console.log(`wecropper is ready for work!`)
    }).on('beforeImageLoad', () => {
      console.log(`before picture loaded, i can do something`)
      wx.showToast({
        title: '上传中',
        icon: 'loading',
        duration: 20000
      })
    }).on('imageLoad', () => {
      console.log(`picture loaded`)
      wx.hideToast()
    }).on('beforeDraw', () => {
      console.log(`before canvas draw,i can do something`)
    })
  }
})