// 菜谱项组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 菜谱数据
    recipe: {
      type: Object,
      value: {}
    },
    // 是否显示状态标签（用于我的菜谱页面）
    showStatus: {
      type: Boolean,
      value: false
    },
    // 烹饪方式数据（用于标签显示）
    cookingMethods: {
      type: Array,
      value: []
    },
    // 口味类型数据（用于标签显示）
    flavorTypes: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 菜谱点击事件
     */
    onRecipeClick: function(e) {
      const recipeId = e.currentTarget.dataset.id
      if (recipeId) {
        // 触发父组件的菜谱点击事件
        this.triggerEvent('recipeclick', {
          recipeId: recipeId,
          recipe: this.data.recipe
        })
      }
    },

    /**
     * 购物车操作事件
     */
    onCartAction: function(e) {
      // 在微信小程序中，通过catchtap来阻止事件冒泡，而不是在JS中调用stopPropagation
      const recipeId = e.currentTarget.dataset.recipeId
      if (recipeId) {
        // 触发父组件的购物车操作事件
        this.triggerEvent('cartaction', {
          recipeId: recipeId,
          recipe: this.data.recipe,
          isInCart: this.data.recipe.isInCart
        })
      }
    }
  }
})
