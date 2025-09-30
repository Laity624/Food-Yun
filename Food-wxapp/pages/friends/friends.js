Page({
  onShow: function () {
    // 更新自定义tabbar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 'friends'
      })
    }
  }
})  
