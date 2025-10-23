/**
 * 购物车管理工具
 * 负责购物车的本地存储和状态管理
 */

const CART_KEY = 'food_cart_data'

/**
 * 获取购物车数据
 */
function getCartData() {
  try {
    const cartData = wx.getStorageSync(CART_KEY)
    return cartData || {
      cartItems: [],
      totalCount: 0,
      selectedCount: 0,
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('获取购物车数据失败:', error)
    return {
      cartItems: [],
      totalCount: 0,
      selectedCount: 0,
      lastUpdated: new Date()
    }
  }
}

/**
 * 保存购物车数据
 */
function saveCartData(cartData) {
  try {
    cartData.lastUpdated = new Date()
    wx.setStorageSync(CART_KEY, cartData)
    return true
  } catch (error) {
    console.error('保存购物车数据失败:', error)
    return false
  }
}

/**
 * 添加菜谱到购物车
 */
function addToCart(recipe) {
  console.log('添加购物车处理====', recipe);
  const cartData = getCartData()
  const { cartItems } = cartData
  
  // 检查购物车是否已满（最多20道菜）
  const MAX_ITEMS = 20
  if (cartItems.length >= MAX_ITEMS) {
    return {
      success: false,
      message: `购物车最多只能添加${MAX_ITEMS}道菜，请先移除一些菜品再添加`
    }
  }
  
  // 检查是否已存在
  const existingIndex = cartItems.findIndex(item => item.recipeId === recipe._id)
  
  if (existingIndex !== -1) {
    // 已存在，更新信息
    cartItems[existingIndex] = {
      recipeId: recipe._id,
      recipeName: recipe.name,
      authorId: recipe.creatorId,
      authorName: recipe.creator.nickname || '未知用户',
      authorAvatar: recipe.creator.avatar || '/images/default-avatar.png',
      image: recipe.images[0] || '/images/default-recipe.png',
      preparationTime: recipe.preparationTime ? recipe.preparationTime.label : '',
      difficulty: recipe.difficulty ? recipe.difficulty.label : '',
      servingSize: recipe.servingSize ? recipe.servingSize.label : '',
      addedAt: new Date().toISOString(),
      isSelected: false
    }
  } else {
    // 不存在，添加新项
    cartItems.push({
      recipeId: recipe._id,
      recipeName: recipe.name,
      authorId: recipe.creatorId,
      authorName: recipe.creator.nickname|| '未知用户',
      authorAvatar: recipe.creator.avatar || '/images/default-avatar.png',
      image: recipe.images[0] || '/images/default-recipe.png',
      preparationTime: recipe.preparationTime ? recipe.preparationTime.label : '',
      difficulty: recipe.difficulty ? recipe.difficulty.label : '',
      servingSize: recipe.servingSize ? recipe.servingSize.label : '',
      addedAt: new Date().toISOString(),
      isSelected: false
    })
  }
  
  // 更新统计信息
  cartData.totalCount = cartItems.length
  cartData.selectedCount = cartItems.filter(item => item.isSelected).length
  
  const saveResult = saveCartData(cartData)
  return {
    success: saveResult,
    message: saveResult ? '已添加到购物车' : '添加失败'
  }
}

/**
 * 从购物车移除菜谱
 */
function removeFromCart(recipeId) {
  const cartData = getCartData()
  const { cartItems } = cartData
  
  const filteredItems = cartItems.filter(item => item.recipeId !== recipeId)
  
  cartData.cartItems = filteredItems
  cartData.totalCount = filteredItems.length
  cartData.selectedCount = filteredItems.filter(item => item.isSelected).length
  
  return saveCartData(cartData)
}

/**
 * 清空购物车
 */
function clearCart() {
  const cartData = {
    cartItems: [],
    totalCount: 0,
    selectedCount: 0,
    lastUpdated: new Date()
  }
  return saveCartData(cartData)
}

/**
 * 切换菜谱选中状态
 */
function toggleRecipeSelection(recipeId) {
  const cartData = getCartData()
  const { cartItems } = cartData
  
  const item = cartItems.find(item => item.recipeId === recipeId)
  if (item) {
    item.isSelected = !item.isSelected
    cartData.selectedCount = cartItems.filter(item => item.isSelected).length
    return saveCartData(cartData)
  }
  return false
}

/**
 * 检查菜谱是否在购物车中
 */
function isInCart(recipeId) {
  const cartData = getCartData()
  return cartData.cartItems.some(item => item.recipeId === recipeId)
}

/**
 * 检查菜谱是否被选中
 */
function isSelected(recipeId) {
  const cartData = getCartData()
  const item = cartData.cartItems.find(item => item.recipeId === recipeId)
  return item ? item.isSelected : false
}

/**
 * 获取购物车统计信息
 */
function getCartStats() {
  const cartData = getCartData()
  return {
    totalCount: cartData.totalCount,
    selectedCount: cartData.selectedCount,
    hasItems: cartData.totalCount > 0,
    hasSelected: cartData.selectedCount > 0
  }
}

module.exports = {
  getCartData,
  saveCartData,
  addToCart,
  removeFromCart,
  clearCart,
  toggleRecipeSelection,
  isInCart,
  isSelected,
  getCartStats
}
