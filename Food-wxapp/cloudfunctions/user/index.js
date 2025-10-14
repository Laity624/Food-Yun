const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  try {
    switch (action) {
      case 'getProfile':
        return await getUserProfile(openid)
      case 'updateProfile':
        return await updateUserProfile(event, openid)
      case 'searchUser':
        return await searchUser(event)
      case 'generateSearchCode':
        return await generateSearchCode(openid)
      case 'updateSearchCode':
        return await updateSearchCode(openid)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('用户操作失败:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
}

// 获取用户资料
async function getUserProfile(openid) {
  const result = await db.collection('users').where({
    openid: openid
  }).get()

  if (result.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }

  return {
    success: true,
    data: {
      user: result.data[0]
    }
  }
}

// 更新用户资料
async function updateUserProfile(event, openid) {
  const { nickname, avatar } = event

  await db.collection('users').where({
    openid: openid
  }).update({
    data: {
      nickname,
      avatar,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    data: {}
  }
}

// 搜索用户
async function searchUser(event) {
  const { searchCode } = event

  const result = await db.collection('users').where({
    searchCode: searchCode
  }).get()

  if (result.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }

  const user = result.data[0]
  return {
    success: true,
    data: {
      user: {
        _id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        searchCode: user.searchCode
      }
    }
  }
}

// 生成搜索码
async function generateSearchCode(openid) {
  // 生成6位随机搜索码
  const searchCode = 'FY' + Math.random().toString(36).substr(2, 6).toUpperCase()
  
  // 检查搜索码是否已存在
  const existResult = await db.collection('users').where({
    searchCode: searchCode
  }).get()
  
  if (existResult.data.length > 0) {
    // 如果存在，递归重新生成
    return await generateSearchCode(openid)
  }
  
  // 更新用户的搜索码
  await db.collection('users').where({
    openid: openid
  }).update({
    data: {
      searchCode: searchCode,
      updatedAt: new Date()
    }
  })
  
  return {
    success: true,
    data: {
      searchCode: searchCode
    }
  }
}

// 更新搜索码
async function updateSearchCode(openid) {
  return await generateSearchCode(openid)
}