// pages/recipe-detail/recipe-detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    recipeId: '',
    recipe: {},
    loading: true,
    isFavorited: false,
    ingredientMode: 'normal', // normal | check
    stepMode: 'normal', // normal | check
    relatedRecipes: [],
    
    // 默认数据（用于展示）
    defaultRecipe: {
      name: '番茄鸡蛋',
      description: '经典家常菜，酸甜开胃，老少皆宜',
      images: [
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
      ],
      preparationTime: 15,
      preparationTimeDisplay: '15分钟',
      servingSize: '2-3',
      servingSizeDisplay: '2-3人',
      difficulty: 'easy',
      difficultyDisplay: '简单',
      rating: 4.8,
      reviewCount: 126,
      sceneDisplay: '日常家常菜',
      sceneEmoji: '📅',
      ingredientDisplay: '蛋类',
      ingredientEmoji: '🥚',
      optionalTags: [
        { name: '炒菜', emoji: '🔥' },
        { name: '家常味', emoji: '🏠' }
      ],
      ingredients: [
        { id: '1', name: '鸡蛋', amount: '3个', checked: false },
        { id: '2', name: '番茄', amount: '2个', checked: false },
        { id: '3', name: '葱花', amount: '适量', checked: false },
        { id: '4', name: '盐', amount: '1茶匙', checked: false },
        { id: '5', name: '糖', amount: '1/2茶匙', checked: false },
        { id: '6', name: '食用油', amount: '2汤匙', checked: false }
      ],
      steps: [
        { 
          id: '1', 
          content: '将番茄洗净，用开水烫一下，去皮切成小块。鸡蛋打散，加少许盐调味。',
          image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=120&fit=crop',
          completed: false
        },
        { 
          id: '2', 
          content: '热锅下少许油，倒入蛋液，快速炒散成块状，盛起备用。',
          image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=120&fit=crop',
          completed: false
        },
        { 
          id: '3', 
          content: '锅内留少许油，下番茄块炒出汁水，加盐和糖调味。',
          image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=120&fit=crop',
          completed: false
        },
        { 
          id: '4', 
          content: '倒入炒好的鸡蛋，快速翻炒均匀，撒上葱花即可出锅。',
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=120&fit=crop',
          completed: false
        }
      ],
      nutrition: [
        { name: '热量', value: '180', unit: 'kcal' },
        { name: '蛋白质', value: '12', unit: 'g' },
        { name: '脂肪', value: '8', unit: 'g' },
        { name: '碳水', value: '15', unit: 'g' }
      ],
      creator: {
        name: '妈妈的菜谱',
        avatar: '',
        id: 'creator_001'
      },
      createTimeDisplay: '2024年3月15日创建'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('菜谱详情页加载，接收到的参数:', options);
    
    const recipeId = options.id || options.recipeId;
    console.log('解析出的 recipeId:', recipeId);
    
    if (recipeId) {
      this.setData({
        recipeId: recipeId
      });
      this.loadRecipeDetail(recipeId);
    } else {
      console.log('没有传入 recipeId，使用默认数据');
      // 如果没有传入ID，使用默认数据进行展示
      this.setData({
        recipe: this.data.defaultRecipe,
        loading: false
      });
    }

    // 检查收藏状态
    this.checkFavoriteStatus();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: this.data.recipe.name || '菜谱详情'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时刷新收藏状态
    this.checkFavoriteStatus();
  },

  /**
   * 生命周期函数--监听页面分享
   */
  onShareAppMessage: function () {
    const recipe = this.data.recipe;
    return {
      title: `推荐一道菜：${recipe.name}`,
      path: `/pages/recipe-detail/recipe-detail?id=${this.data.recipeId}`,
      imageUrl: recipe.images && recipe.images[0]
    };
  },

  /**
   * 生命周期函数--监听页面分享到朋友圈
   */
  onShareTimeline: function () {
    const recipe = this.data.recipe;
    return {
      title: `${recipe.name} - 家庭菜谱`,
      imageUrl: recipe.images && recipe.images[0]
    };
  },

  /**
   * 加载菜谱详情
   */
  loadRecipeDetail: function(recipeId) {
    console.log('开始加载菜谱详情, recipeId:', recipeId);
    this.setData({ loading: true });

    // 调用云函数获取菜谱详情
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'detail',
        recipeId: recipeId
      }
    }).then(res => {
      console.log('云函数调用成功，返回结果:', res);
      
      if (res.result && res.result.success) {
        const recipe = res.result.data;
        console.log('获取到菜谱数据:', recipe);
        
        // 处理数据格式
        this.processRecipeData(recipe);
        
        this.setData({
          recipe: recipe,
          loading: false
        });

        // 加载相关推荐
        this.loadRelatedRecipes(recipe);

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: recipe.name
        });
      } else {
        console.error('云函数返回失败:', res.result);
        const errorMsg = res.result && res.result.error ? res.result.error : '未知错误';
        this.showError('加载菜谱失败', errorMsg);
      }
    }).catch(err => {
      console.error('调用云函数失败:', err);
      console.error('错误详情:', JSON.stringify(err));
      this.showError('网络错误，请稍后重试', `错误信息: ${err.errMsg || err.message || '未知网络错误'}`);
    });
  },

  /**
   * 处理菜谱数据
   */
  processRecipeData: function(recipe) {
    // 处理时间显示
    if (recipe.preparationTime) {
      if (typeof recipe.preparationTime === 'object' && recipe.preparationTime.label) {
        recipe.preparationTimeDisplay = recipe.preparationTime.label;
      } else {
        recipe.preparationTimeDisplay = `${recipe.preparationTime}分钟`;
      }
    }

    // 处理人数显示
    if (recipe.servingSize) {
      if (typeof recipe.servingSize === 'object' && recipe.servingSize.label) {
        recipe.servingSizeDisplay = recipe.servingSize.label;
      } else {
        recipe.servingSizeDisplay = `${recipe.servingSize}人`;
      }
    }

    // 处理难度显示
    if (recipe.difficulty) {
      if (typeof recipe.difficulty === 'object' && recipe.difficulty.label) {
        recipe.difficultyDisplay = recipe.difficulty.label;
      } else {
        const difficultyMap = {
          'easy': '简单',
          'medium': '中等', 
          'hard': '困难'
        };
        recipe.difficultyDisplay = difficultyMap[recipe.difficulty] || '简单';
      }
    }

    // 处理创建时间显示
    if (recipe.createTime) {
      const date = new Date(recipe.createTime);
      recipe.createTimeDisplay = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日创建`;
    }

    // 初始化食材和步骤的勾选状态
    if (recipe.ingredients) {
      recipe.ingredients.forEach(item => {
        item.checked = false;
      });
    }

    if (recipe.steps) {
      recipe.steps.forEach(item => {
        item.completed = false;
      });
    }

    return recipe;
  },

  /**
   * 加载相关推荐
   */
  loadRelatedRecipes: function(recipe) {
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'recommend',
        limit: 6
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          relatedRecipes: res.result.data?.recipes || []
        });
      }
    }).catch(err => {
      console.error('加载相关推荐失败:', err);
    });
  },

  /**
   * 检查收藏状态
   */
  checkFavoriteStatus: function() {
    const favoriteRecipes = wx.getStorageSync('favoriteRecipes') || [];
    const isFavorited = favoriteRecipes.includes(this.data.recipeId);
    this.setData({ isFavorited });
  },

  /**
   * 返回上一页
   */
  onBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 切换收藏状态
   */
  onToggleFavorite: function() {
    const recipeId = this.data.recipeId;
    const isFavorited = this.data.isFavorited;
    
    let favoriteRecipes = wx.getStorageSync('favoriteRecipes') || [];
    
    if (isFavorited) {
      favoriteRecipes = favoriteRecipes.filter(id => id !== recipeId);
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });
    } else {
      favoriteRecipes.push(recipeId);
      wx.showToast({
        title: '收藏成功',
        icon: 'success'
      });
    }
    
    wx.setStorageSync('favoriteRecipes', favoriteRecipes);
    this.setData({
      isFavorited: !isFavorited
    });

    // 触发收藏动画
    this.triggerFavoriteAnimation();
  },

  /**
   * 触发收藏动画
   */
  triggerFavoriteAnimation: function() {
    // 这里可以添加收藏动画效果
    console.log('触发收藏动画');
  },

  /**
   * 分享菜谱
   */
  onShare: function() {
    // 触发分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 预览图片
   */
  previewImage: function(e) {
    const current = e.currentTarget.dataset.current;
    const urls = e.currentTarget.dataset.urls || [current];
    
    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  /**
   * 预览步骤图片
   */
  previewStepImage: function(e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  },

  /**
   * 切换食材勾选模式
   */
  onToggleIngredientMode: function() {
    const currentMode = this.data.ingredientMode;
    const newMode = currentMode === 'check' ? 'normal' : 'check';
    
    this.setData({
      ingredientMode: newMode
    });

    wx.showToast({
      title: newMode === 'check' ? '勾选模式开启' : '勾选模式关闭',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 切换食材勾选状态
   */
  onToggleIngredient: function(e) {
    if (this.data.ingredientMode !== 'check') return;

    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.recipe.ingredients;
    
    ingredients[index].checked = !ingredients[index].checked;
    
    this.setData({
      'recipe.ingredients': ingredients
    });

    // 触发触觉反馈
    wx.vibrateShort();
  },

  /**
   * 切换步骤勾选模式
   */
  onToggleStepMode: function() {
    const currentMode = this.data.stepMode;
    const newMode = currentMode === 'check' ? 'normal' : 'check';
    
    this.setData({
      stepMode: newMode
    });

    wx.showToast({
      title: newMode === 'check' ? '勾选模式开启' : '勾选模式关闭',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 切换步骤完成状态
   */
  onToggleStep: function(e) {
    if (this.data.stepMode !== 'check') return;

    const index = e.currentTarget.dataset.index;
    const steps = this.data.recipe.steps;
    
    steps[index].completed = !steps[index].completed;
    
    this.setData({
      'recipe.steps': steps
    });

    // 触发触觉反馈
    wx.vibrateShort();

    // 检查是否所有步骤都完成了
    const allCompleted = steps.every(step => step.completed);
    if (allCompleted) {
      wx.showModal({
        title: '恭喜！',
        content: '您已完成所有制作步骤，菜谱制作完成！',
        showCancel: false,
        confirmText: '太棒了'
      });
    }
  },

  /**
   * 评价菜谱
   */
  onRate: function() {
    wx.showModal({
      title: '评价菜谱',
      content: '您觉得这个菜谱怎么样？',
      confirmText: '五星好评',
      cancelText: '稍后评价',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '感谢您的评价！',
            icon: 'success'
          });
          
          // 这里可以调用云函数提交评价
          this.submitRating(5);
        }
      }
    });
  },

  /**
   * 提交评价
   */
  submitRating: function(rating) {
    // TODO: 实现评价功能的云函数
    console.log('用户评价:', rating);
    // 暂时只记录日志，待云函数支持评价功能后再调用
    /*
    wx.cloud.callFunction({
      name: 'recipe',
      data: {
        action: 'rate',
        recipeId: this.data.recipeId,
        rating: rating
      }
    }).then(res => {
      if (res.result.success) {
        console.log('评价提交成功');
      }
    }).catch(err => {
      console.error('提交评价失败:', err);
    });
    */
  },

  /**
   * 查看创建者的其他菜谱
   */
  onViewCreatorRecipes: function() {
    const creator = this.data.recipe.creator;
    if (creator && creator.id) {
      wx.navigateTo({
        url: `/pages/creator-recipes/creator-recipes?creatorId=${creator.id}&creatorName=${encodeURIComponent(creator.name)}`
      });
    }
  },

  /**
   * 查看相关菜谱
   */
  onViewRelatedRecipe: function(e) {
    const recipeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recipe-detail/recipe-detail?id=${recipeId}`
    });
  },

  /**
   * 开始制作
   */
  onStartCooking: function() {
    const recipe = this.data.recipe;
    
    wx.showModal({
      title: '开始制作',
      content: `准备开始制作"${recipe.name}"，系统将为您提供分步指导。`,
      confirmText: '开始',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到制作指导页面
          wx.navigateTo({
            url: `/pages/cooking-guide/cooking-guide?recipeId=${this.data.recipeId}`
          });
        }
      }
    });
  },

  /**
   * 显示错误信息
   */
  showError: function(title, content = '') {
    this.setData({ loading: false });
    
    wx.showModal({
      title: title,
      content: content || '请检查网络连接或稍后重试',
      showCancel: false,
      confirmText: '确定',
      success: () => {
        // 返回上一页
        wx.navigateBack({
          delta: 1
        });
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    if (this.data.recipeId) {
      this.loadRecipeDetail(this.data.recipeId);
    }
    wx.stopPullDownRefresh();
  }
});