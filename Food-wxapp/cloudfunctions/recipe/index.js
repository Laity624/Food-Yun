const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  try {
    switch (action) {
      case 'create':
        return await createRecipe(event, openid)
      case 'list':
        return await getRecipeList(event, openid)
      case 'detail':
        return await getRecipeDetail(event, openid)
      case 'update':
        return await updateRecipe(event, openid)
      case 'delete':
        return await deleteRecipe(event, openid)
      case 'recommend':
        return await getRecommendRecipes(event)
      case 'search':
        return await searchRecipes(event)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('菜谱操作失败:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
}

// 创建菜谱
async function createRecipe(event, openid) {
  const { data } = event
  const { title, description, images, ingredients, steps, cookTime, difficulty, serving, tags, isPublic, status } = data

  const result = await db.collection('recipes').add({
    data: {
      title,
      description,
      images: images || [],  // 图片数组
      ingredients: ingredients || [],
      steps: steps || [],
      cookTime,
      difficulty,
      serving,
      tags: tags || [],      // 菜谱标签
      isPublic: isPublic !== undefined ? isPublic : false,
      status: status || 'draft',  // 状态：draft/published
      creatorId: openid,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    data: {
      recipeId: result._id
    }
  }
}

// 获取菜谱列表
async function getRecipeList(event, openid) {
  const { page = 1, pageSize = 10, search, tags, creatorId } = event

  let query = db.collection('recipes')

  // 构建筛选条件
  let conditions = []

  // 搜索条件
  if (search) {
    conditions.push(
      _.or([
        {
          title: db.RegExp({
            regexp: search,
            options: 'i'
          })
        },
        {
          description: db.RegExp({
            regexp: search,
            options: 'i'
          })
        }
      ])
    )
  }

  // 标签筛选条件
  if (tags && tags.length > 0) {
    // 菜谱必须包含所有选中的标签
    tags.forEach(tag => {
      conditions.push({ tags: tag })
    })
  }

  // 权限条件
  if (creatorId) {
    conditions.push({ creatorId: creatorId })
  } else {
    // 只显示公开的菜谱或自己的菜谱
    conditions.push(
      _.or([
        { isPublic: true },
        { creatorId: openid }
      ])
    )
  }

  // 合并所有条件
  let whereCondition = conditions.length > 0 ? _.and(conditions) : {}

  const result = await query
    .where(whereCondition)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  // 获取创建者信息，添加错误处理
  const recipes = await Promise.all(result.data.map(async (recipe) => {
    try {
      const userResult = await db.collection('users').doc(recipe.creatorId).get()
      return {
        ...recipe,
        creator: userResult.data || { nickname: '未知用户', avatar: '' },
        createTime: formatTime(recipe.createdAt)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return {
        ...recipe,
        creator: { nickname: '未知用户', avatar: '' },
        createTime: formatTime(recipe.createdAt)
      }
    }
  }))

  return {
    success: true,
    data: {
      recipes,
      total: result.data.length
    }
  }
}

// 获取菜谱详情
async function getRecipeDetail(event, openid) {
  const { recipeId } = event
  
  const result = await db.collection('recipes').doc(recipeId).get()
  
  if (!result.data) {
    return {
      success: false,
      message: '菜谱不存在'
    }
  }
  
  const recipe = result.data
  
  // 检查权限
  if (!recipe.isPublic && recipe.creatorId !== openid) {
    return {
      success: false,
      message: '没有权限查看此菜谱'
    }
  }
  
  // 获取创建者信息
  const userResult = await db.collection('users').doc(recipe.creatorId).get()
  recipe.creator = userResult.data || { nickname: '未知用户', avatar: '' }
  recipe.createTime = formatTime(recipe.createdAt)
  
  return {
    success: true,
    data: {
      recipe
    }
  }
}

// 更新菜谱
async function updateRecipe(event, openid) {
  const { recipeId, data } = event
  const { title, description, images, ingredients, steps, cookTime, difficulty, serving, tags, isPublic, status } = data

  // 检查权限
  const recipeResult = await db.collection('recipes').doc(recipeId).get()
  if (!recipeResult.data || recipeResult.data.creatorId !== openid) {
    return {
      success: false,
      message: '没有权限修改此菜谱'
    }
  }

  await db.collection('recipes').doc(recipeId).update({
    data: {
      title,
      description,
      images: images || [],
      ingredients: ingredients || [],
      steps: steps || [],
      cookTime,
      difficulty,
      serving,
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : false,
      status: status || 'draft',
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    data: {}
  }
}

// 删除菜谱
async function deleteRecipe(event, openid) {
  const { recipeId } = event
  
  // 检查权限
  const recipeResult = await db.collection('recipes').doc(recipeId).get()
  if (!recipeResult.data || recipeResult.data.creatorId !== openid) {
    return {
      success: false,
      message: '没有权限删除此菜谱'
    }
  }
  
  await db.collection('recipes').doc(recipeId).remove()
  
  return {
    success: true,
    data: {}
  }
}

// 获取推荐菜谱
async function getRecommendRecipes(event) {
  const { limit = 6 } = event
  
  const result = await db.collection('recipes')
    .where({
      isPublic: true
    })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
  
  return {
    success: true,
    data: {
      recipes: result.data
    }
  }
}

// 搜索菜谱
async function searchRecipes(event) {
  const { keyword, page = 1, pageSize = 10 } = event
  
  const result = await db.collection('recipes')
    .where(_.and([
      {
        isPublic: true
      },
      _.or([
        {
          title: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        },
        {
          description: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        }
      ])
    ]))
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: {
      recipes: result.data
    }
  }
}

// 格式化时间
function formatTime(date) {
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}