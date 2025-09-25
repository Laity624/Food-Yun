

const app = getApp()

Component({

  data: {
    safeAreaBottom: app.globalData.systemInfo.safeAreaBottom,
    selected: 'home',
    backgroundColor: '#ffffff',
    color: '#333333',
    selectedColor: '#00CF96',
    list: [
      {
        "type": 'home',
        "pagePath": "/pages/index/index",
        "text": "首页",
        "iconPath": "./icons/index.svg",
        "selectedIconPath": "./icons/indexed.svg",
      },
      {
        "type": 'recipeList',
        "pagePath": "/pages/recipe-list/recipe-list",
        "text": "菜谱",
        "iconPath": "./icons/category.svg",
        "selectedIconPath": "./icons/categoried.svg",
      },
      {
        "type": 'order',
        "pagePath": "/pages/order/order",
        "text": "点餐",
        "iconPath": "./icons/servicer.svg",
        "selectedIconPath": "./icons/servicered.svg",
      },
      {
        "type": 'friends',
        "pagePath": "/pages/friends/friends",
        "text": "好友",
        "iconPath": "./icons/shopCar.svg",
        "selectedIconPath": "./icons/shopCared.svg",
      },
      {
        "type": 'profile',
        "pagePath": "/pages/profile/profile",
        "text": "我的",
        "iconPath": "./icons/mine.svg",
        "selectedIconPath": "./icons/mined.svg",
      }
    ],
  },

  lifetimes: {
    ready() {
      this.getHeight()
    },
    detached() {
    }
  },

  methods: {

    getHeight () {
      const query = wx.createSelectorQuery().in(this)
      query.select('.custom-tabbar').boundingClientRect(res => {
        if (res.height > 0) {
          app.globalData.tabbarHeight = res.height
        }
      }).exec()
    },


    switchTab(e) {
      const { index, item } = e.currentTarget.dataset
      const { list } = this.data
      this.setData({
        selected: item.type
      })
      wx.switchTab({
        url: item.pagePath,
        success: () => {
        }
      })
    }
  }
})
