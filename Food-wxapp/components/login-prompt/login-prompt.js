Component({
  properties: {
    // 是否显示弹窗
    visible: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        if (newVal) {
          this.setData({ showModal: true });
        }
      }
    },
    // 自定义标题
    title: {
      type: String,
      value: '登录提示'
    },
    // 自定义提示内容
    content: {
      type: String,
      value: '您需要登录后才能使用此功能'
    },
    // 自定义描述
    description: {
      type: String,
      value: '登录后可以享受完整的功能体验'
    }
  },

  data: {
    showModal: false
  },

  methods: {
    // 关闭弹窗
    onClose() {
      this.setData({ showModal: false });
      this.triggerEvent('close');
    },

    // 跳转到登录页
    onLogin() {
      this.setData({ showModal: false });
      this.triggerEvent('login');
      
      // 跳转到登录页
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  }
});