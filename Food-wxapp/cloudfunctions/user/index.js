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
        nickname: user.nickname,
        avatar: user.avatar,
        searchCode: user.searchCode
      }
    }
  }
}