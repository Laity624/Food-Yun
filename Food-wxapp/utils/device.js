/*
 * @Description: 
 * @Company: LESSO
 * @Author: zmb cc: 00081969
 * @Date: 2024-06-23 15:43:57
 * @LastEditTime: 2025-04-03 14:59:17
 * @FilePath: \ztc-mall-wxapp\utils\device.js
 */
function GetSystemInfo(callback) {
    // 设备信息
    const deviceInfo = wx.getDeviceInfo();
    // 窗口信息
    const windowInfo = wx.getWindowInfo();
    // 小程序运行环境信息
    const appInfo = wx.getAppBaseInfo();
    // 胶囊信息
    const menuButtonRect = wx.getMenuButtonBoundingClientRect()
    let navigationBarHeight = menuButtonRect.height // 导航栏高度
    let safeAreaBottom = 0  // 底部安全距离预留高德
    let safeAreaTop = windowInfo.safeArea  && windowInfo.safeArea.top
      ? windowInfo.safeArea.top
      : windowInfo.statusBarHeight // 顶部安全距离预留高度
    if (windowInfo.safeArea && windowInfo.screenHeight) {
      safeAreaBottom = windowInfo.screenHeight - windowInfo.safeArea.bottom
      navigationBarHeight = menuButtonRect.top > safeAreaTop
        ? navigationBarHeight + (menuButtonRect.top - safeAreaTop) * 2
        : navigationBarHeight
    }
    callback({
      ...appInfo,
      ...deviceInfo,
      ...windowInfo,
      navigationBarHeight,
      safeAreaTop,
      safeAreaBottom,
      menuButtonRect,
      menuButtonWidth: menuButtonRect.width,
      menuButtonHeight: menuButtonRect.height
    })
  }
  
  export default {
    GetSystemInfo
  }
  