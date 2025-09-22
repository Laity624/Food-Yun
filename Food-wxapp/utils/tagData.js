// 菜谱数据配置文件 - 家庭版
// 用于创建菜谱、菜谱列表等多个页面的统一数据

// 场景分类（必选）
const sceneCategories = [
  {
    id: 'daily',
    name: '日常家常菜',
    emoji: '📅',
    description: '平时三餐',
    color: 'blue',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
  },
  {
    id: 'quick',
    name: '快手菜',
    emoji: '⚡',
    description: '30分钟内',
    color: 'orange',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
  },
  {
    id: 'guest',
    name: '宴客菜',
    emoji: '🎉',
    description: '招待客人',
    color: 'purple',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
  },
  {
    id: 'light',
    name: '清淡菜',
    emoji: '🥗',
    description: '老人小孩',
    color: 'cyan',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)'
  },
  {
    id: 'heavy',
    name: '重口味菜',
    emoji: '🌶️',
    description: '下饭菜',
    color: 'red',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
  }
]

// 食材分类（必选）
const ingredientCategories = [
  {
    id: 'meat',
    name: '肉类',
    emoji: '🥩',
    color: 'red'
  },
  {
    id: 'seafood',
    name: '水产',
    emoji: '🐟',
    color: 'blue'
  },
  {
    id: 'egg',
    name: '蛋类',
    emoji: '🥚',
    color: 'yellow'
  },
  {
    id: 'vegetable',
    name: '蔬菜',
    emoji: '🥬',
    color: 'green'
  },
  {
    id: 'soup',
    name: '汤类',
    emoji: '🍲',
    color: 'orange'
  },
  {
    id: 'staple',
    name: '主食',
    emoji: '🍚',
    color: 'amber'
  }
]

// 烹饪方式（可选标签）
const cookingMethods = [
  { id: 'stir_fry', name: '炒菜', emoji: '🔥' },
  { id: 'steam', name: '蒸菜', emoji: '💨' },
  { id: 'stew', name: '炖菜', emoji: '🍲' },
  { id: 'cold_mix', name: '凉拌', emoji: '🥗' },
  { id: 'soup', name: '汤品', emoji: '🍜' },
  { id: 'fry', name: '油炸', emoji: '🍤' },
  { id: 'grill', name: '烧烤', emoji: '🔥' },
  { id: 'boil', name: '水煮', emoji: '💧' }
]

// 口味特色（可选标签）
const flavorTypes = [
  { id: 'sichuan', name: '川菜', emoji: '🌶️' },
  { id: 'cantonese', name: '粤菜', emoji: '🦐' },
  { id: 'home_style', name: '家常味', emoji: '🏠' },
  { id: 'light', name: '清淡', emoji: '🌿' },
  { id: 'spicy', name: '麻辣', emoji: '🔥' },
  { id: 'sweet', name: '甜味', emoji: '🍯' },
  { id: 'sour', name: '酸味', emoji: '🍋' },
  { id: 'fresh', name: '鲜香', emoji: '✨' }
]

// 制作时间选项
const preparationTimes = [
  { value: '10', label: '10分钟' },
  { value: '30', label: '30分钟' },
  { value: '60', label: '1小时' },
  { value: '120', label: '2小时+' }
]

// 难度等级选项
const difficultyLevels = [
  { value: 1, label: '简单', color: 'green' },
  { value: 2, label: '中等', color: 'yellow' },
  { value: 3, label: '困难', color: 'red' }
]

// 适合人数选项
const servingSizes = [
  { value: '1-2', label: '1-2人' },
  { value: '3-4', label: '3-4人' },
  { value: '5-6', label: '5-6人' },
  { value: '6+', label: '6人以上' }
]

// 获取场景分类
function getSceneCategories() {
  return sceneCategories
}

// 获取食材分类
function getIngredientCategories() {
  return ingredientCategories
}

// 获取烹饪方式
function getCookingMethods() {
  return cookingMethods
}

// 获取口味特色
function getFlavorTypes() {
  return flavorTypes
}

// 获取制作时间选项
function getPreparationTimes() {
  return preparationTimes
}

// 获取难度等级选项
function getDifficultyLevels() {
  return difficultyLevels
}

// 获取适合人数选项
function getServingSizes() {
  return servingSizes
}

// 根据ID获取场景分类
function getSceneCategoryById(id) {
  return sceneCategories.find(cat => cat.id === id)
}

// 根据ID获取食材分类
function getIngredientCategoryById(id) {
  return ingredientCategories.find(cat => cat.id === id)
}

// 获取所有可选标签
function getOptionalTags() {
  return [...cookingMethods, ...flavorTypes]
}

// 验证必填字段
function validateRequiredFields(data) {
  const errors = []
  
  if (!data.name || data.name.trim() === '') {
    errors.push('菜谱名称不能为空')
  }
  
  if (!data.sceneCategory) {
    errors.push('请选择菜谱场景')
  }
  
  if (!data.ingredientCategory) {
    errors.push('请选择主要食材')
  }
  
  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push('请添加食材清单')
  }
  
  if (!data.steps || data.steps.length === 0) {
    errors.push('请添加制作步骤')
  }
  
  return errors
}

// 导出函数（小程序环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sceneCategories,
    ingredientCategories,
    cookingMethods,
    flavorTypes,
    preparationTimes,
    difficultyLevels,
    servingSizes,
    getSceneCategories,
    getIngredientCategories,
    getCookingMethods,
    getFlavorTypes,
    getPreparationTimes,
    getDifficultyLevels,
    getServingSizes,
    getSceneCategoryById,
    getIngredientCategoryById,
    getOptionalTags,
    validateRequiredFields
  }
}

// 导出函数（浏览器环境）
if (typeof window !== 'undefined') {
  window.TagData = {
    sceneCategories,
    ingredientCategories,
    cookingMethods,
    flavorTypes,
    preparationTimes,
    difficultyLevels,
    servingSizes,
    getSceneCategories,
    getIngredientCategories,
    getCookingMethods,
    getFlavorTypes,
    getPreparationTimes,
    getDifficultyLevels,
    getServingSizes,
    getSceneCategoryById,
    getIngredientCategoryById,
    getOptionalTags,
    validateRequiredFields
  }
}