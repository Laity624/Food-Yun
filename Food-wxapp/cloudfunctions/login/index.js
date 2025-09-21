const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event

  try {
    const openid = wxContext.OPENID
    
    if (!openid) {
      return {
        success: false,
        message: '获取用户身份失败'
      }
    }

    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    let userData = null

    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const createResult = await db.collection('users').add({
        data: {
          openid: openid,
          nickname: userInfo ? userInfo.nickName : '微信用户',
          avatar: userInfo ? userInfo.avatarUrl : '',
          searchCode: generateSearchCode(), // 生成搜索码用于好友添加
          createTime: new Date(),
          updateTime: new Date()
        }
      })

      userData = {
        _id: createResult._id,
        openid: openid,
        nickname: userInfo ? userInfo.nickName : '微信用户',
        avatar: userInfo ? userInfo.avatarUrl : '',
        searchCode: generateSearchCode(),
        createTime: new Date(),
        updateTime: new Date()
      }
    } else {
      // 老用户，直接返回数据库中的最新信息
      userData = userResult.data[0]
      
      // 如果传入了新的用户信息，根据情况更新昵称和头像
      if (userInfo) {
        const updateData = {
          updateTime: new Date()
        }

        // 只有当数据库中没有自定义昵称时才使用微信昵称
        // 避免用微信昵称覆盖用户自定义的昵称
        if (userInfo.nickName && (!userData.nickname || userData.nickname === '微信用户')) {
          updateData.nickname = userInfo.nickName
        }

        // 只有当数据库中没有头像（新用户）或者当前是微信默认头像时才更新
        // 避免用微信默认头像覆盖用户自定义上传的头像（fileID格式）
        if (userInfo.avatarUrl && (!userData.avatar || userData.avatar.includes('thirdwx.qlogo.cn'))) {
          updateData.avatar = userInfo.avatarUrl
        }

        // 只有当确实需要更新数据时才执行更新操作
        if (Object.keys(updateData).length > 1) { // 大于1是因为updateTime总是存在
          await db.collection('users').doc(userData._id).update({
            data: updateData
          })

          // 更新本地数据
          if (updateData.nickname) {
            userData.nickname = updateData.nickname
          }
          if (updateData.avatar) {
            userData.avatar = updateData.avatar
          }
          userData.updateTime = updateData.updateTime
        }
      }
    }

    return {
      success: true,
      openid: openid,
      userInfo: userData,
      message: '登录成功'
    }

  } catch (error) {
    console.error('登录云函数执行错误:', error)
    return {
      success: false,
      message: error.message || '登录失败'
    }
  }
}

// 生成用户搜索码（用于好友添加）
function generateSearchCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}