// 菜谱云函数测试用例
// 注意：这个文件仅用于开发时测试，不会部署到云端

const testData = {
  // 测试创建菜谱的数据结构
  createRecipeData: {
    action: 'create',
    data: {
      name: '红烧肉',
      description: '经典家常红烧肉，肥而不腻，入口即化',
      images: ['cloud://test.jpg'],
      sceneCategory: 'daily', // 日常家常菜
      ingredientCategory: 'meat', // 肉类
      preparationTime: { value: '60', label: '1小时' },
      difficulty: { value: 2, label: '中等', color: 'yellow' },
      servingSize: { value: '3-4', label: '3-4人' },
      optionalTags: ['stir_fry', 'sichuan'], // 炒菜 + 川菜
      ingredients: [
        { id: 'ing_1', name: '五花肉', amount: '500g' },
        { id: 'ing_2', name: '生抽', amount: '3勺' },
        { id: 'ing_3', name: '老抽', amount: '1勺' },
        { id: 'ing_4', name: '冰糖', amount: '30g' }
      ],
      steps: [
        { id: 'step_1', content: '五花肉切块，冷水下锅煮5分钟去腥', image: '' },
        { id: 'step_2', content: '热锅下肉块，煎至微黄盛起', image: '' },
        { id: 'step_3', content: '下冰糖炒糖色，倒入肉块翻炒', image: '' },
        { id: 'step_4', content: '加生抽老抽，倒入开水大火烧开转小火炖45分钟', image: '' }
      ],
      isPublic: true,
      status: 'published'
    }
  },

  // 测试获取菜谱列表的参数
  getListParams: {
    action: 'list',
    page: 1,
    pageSize: 10,
    search: '红烧',
    sceneCategories: ['daily'],
    ingredientCategories: ['meat'],
    optionalTags: ['stir_fry']
  },

  // 测试搜索菜谱的参数
  searchParams: {
    action: 'search',
    keyword: '红烧肉',
    page: 1,
    pageSize: 10
  }
}

// 数据结构验证函数
function validateCreateRecipeData(data) {
  const required = ['name', 'sceneCategory', 'ingredientCategory', 'ingredients', 'steps']
  const missing = required.filter(field => !data[field] || (Array.isArray(data[field]) && data[field].length === 0))
  
  if (missing.length > 0) {
    console.error('缺少必填字段:', missing)
    return false
  }

  // 验证场景分类
  const validScenes = ['daily', 'quick', 'guest', 'light', 'heavy']
  if (!validScenes.includes(data.sceneCategory)) {
    console.error('无效的场景分类:', data.sceneCategory)
    return false
  }

  // 验证食材分类
  const validIngredients = ['meat', 'seafood', 'egg', 'vegetable', 'soup', 'staple']
  if (!validIngredients.includes(data.ingredientCategory)) {
    console.error('无效的食材分类:', data.ingredientCategory)
    return false
  }

  console.log('数据验证通过 ✓')
  return true
}

// 运行测试
console.log('=== 菜谱云函数测试 ===')
console.log('测试创建菜谱数据结构...')
validateCreateRecipeData(testData.createRecipeData.data)

console.log('\n测试数据示例:')
console.log('创建菜谱:', JSON.stringify(testData.createRecipeData, null, 2))
console.log('\n获取列表:', JSON.stringify(testData.getListParams, null, 2))
console.log('\n搜索菜谱:', JSON.stringify(testData.searchParams, null, 2))

module.exports = testData