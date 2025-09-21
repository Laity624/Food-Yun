const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event

  try {
    switch (action) {
      case 'getFriendList':
        return await getFriendList(wxContext.OPENID)
      
      case 'addFriend':
        return await addFriend(wxContext.OPENID, event.friendOpenid)
      
      case 'deleteFriend':
        return await deleteFriend(wxContext.OPENID, event.friendOpenid)
      
      case 'getFriendRequests':
        return await getFriendRequests(wxContext.OPENID)
      
      case 'sendFriendRequest':
        return await sendFriendRequest(wxContext.OPENID, event.targetOpenid, event.message)
      
      case 'handleFriendRequest':
        return await handleFriendRequest(wxContext.OPENID, event.requestId, event.accept)
      
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return {
      success: false,
      message: error.message || '服务器错误'
    }
  }
}

// 获取好友列表
async function getFriendList(openid) {
  const result = await db.collection('friends').where({
    $or: [
      { userOpenid: openid },
      { friendOpenid: openid }
    ],
    status: 'accepted'
  }).get()

  const friends = []
  for (let item of result.data) {
    const friendOpenid = item.userOpenid === openid ? item.friendOpenid : item.userOpenid
    
    // 获取好友用户信息
    const userResult = await db.collection('users').where({
      openid: friendOpenid
    }).get()
    
    if (userResult.data.length > 0) {
      friends.push({
        openid: friendOpenid,
        nickname: userResult.data[0].nickname,
        avatar: userResult.data[0].avatar,
        addTime: item.createTime
      })
    }
  }

  return {
    success: true,
    data: friends
  }
}

// 添加好友
async function addFriend(userOpenid, friendOpenid) {
  if (userOpenid === friendOpenid) {
    return {
      success: false,
      message: '不能添加自己为好友'
    }
  }

  // 检查是否已经是好友
  const existResult = await db.collection('friends').where({
    $or: [
      { userOpenid, friendOpenid },
      { userOpenid: friendOpenid, friendOpenid: userOpenid }
    ]
  }).get()

  if (existResult.data.length > 0) {
    return {
      success: false,
      message: '已经是好友关系'
    }
  }

  // 创建好友关系
  await db.collection('friends').add({
    data: {
      userOpenid,
      friendOpenid,
      status: 'accepted',
      createTime: new Date()
    }
  })

  return {
    success: true,
    message: '添加好友成功'
  }
}

// 删除好友
async function deleteFriend(userOpenid, friendOpenid) {
  await db.collection('friends').where({
    $or: [
      { userOpenid, friendOpenid },
      { userOpenid: friendOpenid, friendOpenid: userOpenid }
    ]
  }).remove()

  return {
    success: true,
    message: '删除好友成功'
  }
}

// 获取好友请求列表
async function getFriendRequests(openid) {
  const result = await db.collection('friend_requests').where({
    targetOpenid: openid,
    status: 'pending'
  }).orderBy('createTime', 'desc').get()

  const requests = []
  for (let item of result.data) {
    // 获取发送者用户信息
    const userResult = await db.collection('users').where({
      openid: item.fromOpenid
    }).get()
    
    if (userResult.data.length > 0) {
      requests.push({
        _id: item._id,
        fromOpenid: item.fromOpenid,
        nickname: userResult.data[0].nickname,
        avatar: userResult.data[0].avatar,
        message: item.message,
        createTime: item.createTime
      })
    }
  }

  return {
    success: true,
    data: requests
  }
}

// 发送好友请求
async function sendFriendRequest(fromOpenid, targetOpenid, message = '') {
  if (fromOpenid === targetOpenid) {
    return {
      success: false,
      message: '不能向自己发送好友请求'
    }
  }

  // 检查是否已经是好友
  const friendResult = await db.collection('friends').where({
    $or: [
      { userOpenid: fromOpenid, friendOpenid: targetOpenid },
      { userOpenid: targetOpenid, friendOpenid: fromOpenid }
    ]
  }).get()

  if (friendResult.data.length > 0) {
    return {
      success: false,
      message: '已经是好友关系'
    }
  }

  // 检查是否已经发送过请求
  const requestResult = await db.collection('friend_requests').where({
    fromOpenid,
    targetOpenid,
    status: 'pending'
  }).get()

  if (requestResult.data.length > 0) {
    return {
      success: false,
      message: '已经发送过好友请求，请等待对方处理'
    }
  }

  // 创建好友请求
  await db.collection('friend_requests').add({
    data: {
      fromOpenid,
      targetOpenid,
      message,
      status: 'pending',
      createTime: new Date()
    }
  })

  return {
    success: true,
    message: '好友请求发送成功'
  }
}

// 处理好友请求
async function handleFriendRequest(openid, requestId, accept) {
  // 获取请求信息
  const requestResult = await db.collection('friend_requests').doc(requestId).get()
  
  if (!requestResult.data || requestResult.data.targetOpenid !== openid) {
    return {
      success: false,
      message: '请求不存在或无权限'
    }
  }

  const request = requestResult.data

  if (accept) {
    // 接受请求，创建好友关系
    await db.collection('friends').add({
      data: {
        userOpenid: request.fromOpenid,
        friendOpenid: request.targetOpenid,
        status: 'accepted',
        createTime: new Date()
      }
    })
  }

  // 更新请求状态
  await db.collection('friend_requests').doc(requestId).update({
    data: {
      status: accept ? 'accepted' : 'rejected',
      handleTime: new Date()
    }
  })

  return {
    success: true,
    message: accept ? '已接受好友请求' : '已拒绝好友请求'
  }
}