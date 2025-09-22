// 菜谱标签数据 - 公共配置文件
// 用于创建菜谱、菜谱列表等多个页面的标签系统

const tagOptions = [
  {
    name: '菜系',
    icon: 'fas fa-utensils',
    color: 'orange',
    tags: ['川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜', '东北菜', '家常菜', '西餐', '日料', '韩料']
  },
  {
    name: '口味',
    icon: 'fas fa-pepper-hot',
    color: 'red',
    tags: ['酸甜', '麻辣', '清淡', '鲜香', '咸鲜', '微辣', '中辣', '重辣', '甜味', '酸味']
  },
  {
    name: '食材',
    icon: 'fas fa-carrot',
    color: 'green',
    tags: ['肉类', '素食', '海鲜', '蛋类', '豆制品', '蔬菜', '面食', '米饭']
  },
  {
    name: '烹饪',
    icon: 'fas fa-fire',
    color: 'blue',
    tags: ['炒菜', '煮制', '蒸制', '炖煮', '烤制', '油炸', '凉拌', '煮汤']
  },
  {
    name: '场景',
    icon: 'fas fa-clock',
    color: 'purple',
    tags: ['下饭菜', '下酒菜', '宴客菜', '快手菜', '养生菜', '减脂餐', '早餐', '夜宵']
  }
]

// 获取所有标签选项
function getTagOptions() {
  return tagOptions
}

// 获取指定分类的标签
function getTagsByCategory(categoryName) {
  const category = tagOptions.find(cat => cat.name === categoryName)
  return category ? category.tags : []
}

// 获取所有标签（扁平化）
function getAllTags() {
  return tagOptions.reduce((allTags, category) => {
    return allTags.concat(category.tags)
  }, [])
}

// 根据标签名称获取所属分类
function getCategoryByTag(tagName) {
  for (let category of tagOptions) {
    if (category.tags.includes(tagName)) {
      return category
    }
  }
  return null
}

// 获取标签的颜色样式类
function getTagColorClass(tagName) {
  const category = getCategoryByTag(tagName)
  if (!category) return 'gray'
  
  const colorMap = {
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    red: 'bg-red-100 text-red-600 border-red-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200'
  }
  
  return colorMap[category.color] || 'bg-gray-100 text-gray-600 border-gray-200'
}

// 导出函数（小程序环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    tagOptions,
    getTagOptions,
    getTagsByCategory,
    getAllTags,
    getCategoryByTag,
    getTagColorClass
  }
}

// 导出函数（浏览器环境）
if (typeof window !== 'undefined') {
  window.TagData = {
    tagOptions,
    getTagOptions,
    getTagsByCategory,
    getAllTags,
    getCategoryByTag,
    getTagColorClass
  }
}