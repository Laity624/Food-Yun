

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
        "iconPath": "./icons/home.svg",
        "selectedIconPath": "./icons/homeed.svg",
      },
      {
        "type": 'recipeList',
        "pagePath": "/pages/recipe-list/recipe-list",
        "text": "菜谱",
        "iconPath": "./icons/recipe.svg",
        "selectedIconPath": "./icons/recipeed.svg",
      },
      {
        "type": 'order',
        "pagePath": "/pages/order/order",
        "text": "点餐",
        "iconPath": "./icons/order.svg",
        "selectedIconPath": "./icons/ordered.svg",
      },
      {
        "type": 'friends',
        "pagePath": "/pages/friends/friends",
        "text": "好友",
        "iconPath": "./icons/friends.svg",
        "selectedIconPath": "./icons/friendsed.svg",
      },
      {
        "type": 'profile',
        "pagePath": "/pages/profile/profile",
        "text": "我的",
        "iconPath": "./icons/profile.svg",
        "selectedIconPath": "./icons/profiled.svg",
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

  attached() {
    // this.tabbarInit()
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

    tabbarInit() {
      this.setData({
        selected: this.data.list[0].type
      })
    },


    switchTab(e) {
      const { index, item } = e.currentTarget.dataset
      const { list } = this.data
      console.log('item==', item.type);
      this.setData({
        selected: this.data.list[index].type
      })
      wx.switchTab({
        url: item.pagePath,
        success: () => {
        }
      })
    }
  }
})
