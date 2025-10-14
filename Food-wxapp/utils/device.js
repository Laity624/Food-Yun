/*
 * @Description: 
 * @Company: LESSO
 * @Author: zmb cc: 00081969
 * @Date: 2024-06-23 15:43:57
 * @LastEditTime: 2025-04-03 14:59:17
 * @FilePath: \ztc-mall-wxapp\utils\device.js
 */
function GetSystemInfo(callback) {
    try {
      // 设备信息
      const deviceInfo = wx.getDeviceInfo() || {};
      // 窗口信息
      const windowInfo = wx.getWindowInfo() || {};
      // 小程序运行环境信息
      const appInfo = wx.getAppBaseInfo() || {};
      // 胶囊信息
      const menuButtonRect = wx.getMenuButtonBoundingClientRect() || {};
      
      let navigationBarHeight = menuButtonRect.height || 44; // 导航栏高度，默认44
      let safeAreaBottom = 0; // 底部安全距离预留高度
      let safeAreaTop = 0; // 顶部安全距离预留高度
      
      // 安全处理 safeArea
      if (windowInfo.safeArea && windowInfo.safeArea.top !== undefined) {
        safeAreaTop = windowInfo.safeArea.top;
      } else if (windowInfo.statusBarHeight !== undefined) {
        safeAreaTop = windowInfo.statusBarHeight;
      }
      
      // 安全处理 screenHeight 和 safeArea.bottom
      if (windowInfo.safeArea && windowInfo.safeArea.bottom !== undefined && windowInfo.screenHeight !== undefined) {
        safeAreaBottom = windowInfo.screenHeight - windowInfo.safeArea.bottom;
        navigationBarHeight = menuButtonRect.top > safeAreaTop
          ? navigationBarHeight + (menuButtonRect.top - safeAreaTop) * 2
          : navigationBarHeight;
      }
      
      callback({
        ...appInfo,
        ...deviceInfo,
        ...windowInfo,
        navigationBarHeight,
        safeAreaTop,
        safeAreaBottom,
        menuButtonRect,
        menuButtonWidth: menuButtonRect.width || 0,
        menuButtonHeight: menuButtonRect.height || 44
      });
    } catch (error) {
      console.error('GetSystemInfo error:', error);
      // 返回默认值
      callback({
        brand: 'Unknown',
        model: 'Unknown',
        screenWidth: 375,
        screenHeight: 667,
        statusBarHeight: 20,
        navigationBarHeight: 44,
        safeAreaTop: 20,
        safeAreaBottom: 0,
        menuButtonRect: {},
        menuButtonWidth: 0,
        menuButtonHeight: 44
      });
    }
  }
  
  export default {
    GetSystemInfo
  }
  