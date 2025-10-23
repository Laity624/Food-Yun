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
      case 'createOrder':
        return await createOrder(wxContext.OPENID, event.orderData)
      
      case 'getOrderList':
        return await getOrderList(wxContext.OPENID, event.status, event.page, event.limit, event.searchValue)
      
      case 'getOrderDetail':
        return await getOrderDetail(wxContext.OPENID, event.orderId)
      
      case 'updateOrderStatus':
        return await updateOrderStatus(wxContext.OPENID, event.orderId, event.status)
      
      case 'cancelOrder':
        return await cancelOrder(wxContext.OPENID, event.orderId)
      
      
      case 'getOrderStatistics':
        return await getOrderStatistics(wxContext.OPENID)
      
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

// 创建订单
async function createOrder(openid, orderData) {
  const { recipes, assigneeId, mealType, orderDate, orderTime, notes } = orderData

  if (!recipes || recipes.length === 0) {
    return {
      success: false,
      message: '订单菜谱不能为空'
    }
  }

  if (!assigneeId) {
    return {
      success: false,
      message: '请选择制作者'
    }
  }

  if (!mealType) {
    return {
      success: false,
      message: '请选择餐次类型'
    }
  }

  // 生成订单号
  const orderNo = generateOrderNo()

  // 计算预计制作时间
  const estimatedTime = recipes.reduce((total, recipe) => {
    const time = parseInt(recipe.preparationTime) || 30
    return total + time
  }, 0)

  const order = {
    orderNo,
    creatorId: openid,
    assigneeId,
    mealType,
    orderDate,
    orderTime,
    recipes,
    status: 'pending', // pending: 待处理, processing: 处理中, completed: 已完成, cancelled: 已取消
    notes: notes || '',
    totalRecipes: recipes.length,
    estimatedTime,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await db.collection('orders').add({
    data: order
  })

  return {
    success: true,
    data: {
      orderId: result._id,
      orderNo,
      message: '订单创建成功'
    }
  }
}

// 获取订单列表
async function getOrderList(openid, status = null, page = 1, limit = 10, searchValue = '') {
  let query = db.collection('orders').where({
    $or: [
      { creatorId: openid },
      { assigneeId: openid }
    ]
  })

  if (status && status !== 'all') {
    query = query.where({
      status
    })
  }

  // 先获取基础订单数据
  const result = await query
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get()

  // 获取创建者和制作者信息
  let orders = await Promise.all(result.data.map(async (order) => {
    try {
      const [creatorResult, assigneeResult] = await Promise.all([
        db.collection('users').where({ openid: order.creatorId }).get(),
        db.collection('users').where({ openid: order.assigneeId }).get()
      ])

      const creator = creatorResult.data.length > 0 ? creatorResult.data[0] : null
      const assignee = assigneeResult.data.length > 0 ? assigneeResult.data[0] : null

      return {
        ...order,
        creator: creator ? { 
          nickname: creator.nickname || '未知用户', 
          avatar: creator.avatar || '' 
        } : { nickname: '未知用户', avatar: '' },
        assignee: assignee ? { 
          nickname: assignee.nickname || '未知用户', 
          avatar: assignee.avatar || '' 
        } : { nickname: '未知用户', avatar: '' },
        mealTypeLabel: getMealTypeLabel(order.mealType),
        mealTypeIcon: getMealTypeIcon(order.mealType),
        statusLabel: getStatusLabel(order.status)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return {
        ...order,
        creator: { nickname: '未知用户', avatar: '' },
        assignee: { nickname: '未知用户', avatar: '' },
        mealTypeLabel: getMealTypeLabel(order.mealType),
        mealTypeIcon: getMealTypeIcon(order.mealType),
        statusLabel: getStatusLabel(order.status)
      }
    }
  }))

  // 如果有搜索条件，进行客户端过滤（支持制作者昵称搜索）
  if (searchValue && searchValue.trim()) {
    const searchTerm = searchValue.trim().toLowerCase()
    orders = orders.filter(order => {
      // 搜索订单号
      if (order.orderNo && order.orderNo.toLowerCase().includes(searchTerm)) {
        return true
      }
      // 搜索制作者昵称
      if (order.assignee && order.assignee.nickname && 
          order.assignee.nickname.toLowerCase().includes(searchTerm)) {
        return true
      }
      // 搜索创建者昵称
      if (order.creator && order.creator.nickname && 
          order.creator.nickname.toLowerCase().includes(searchTerm)) {
        return true
      }
      // 搜索菜品名称
      if (order.recipes && order.recipes.some(recipe => 
          (recipe.recipeName && recipe.recipeName.toLowerCase().includes(searchTerm))
        )) {
        return true
      }
      return false
    })
  }

  // 获取总数（如果有搜索条件，需要重新计算）
  let total = result.data.length
  if (searchValue && searchValue.trim()) {
    // 对于搜索情况，总数就是过滤后的结果数量
    total = orders.length
  } else {
    const countResult = await query.count()
    total = countResult.total
  }

  return {
    success: true,
    data: {
      orders,
      total,
      page,
      limit,
      hasMore: result.data.length === limit
    }
  }
}

// 获取订单详情
async function getOrderDetail(openid, orderId) {
  const result = await db.collection('orders').doc(orderId).get()

  if (!result.data) {
    return {
      success: false,
      message: '订单不存在'
    }
  }

  const order = result.data

  // 检查权限：只有创建者或制作者可以查看订单
  if (order.creatorId !== openid && order.assigneeId !== openid) {
    return {
      success: false,
      message: '无权限查看此订单'
    }
  }

  try {
    // 获取创建者和制作者信息
    const [creatorResult, assigneeResult] = await Promise.all([
      db.collection('users').where({ openid: order.creatorId }).get(),
      db.collection('users').where({ openid: order.assigneeId }).get()
    ])

    const creator = creatorResult.data.length > 0 ? creatorResult.data[0] : null
    const assignee = assigneeResult.data.length > 0 ? assigneeResult.data[0] : null

    // 构建订单详情数据
    const orderDetail = {
      ...order,
      creatorName: creator ? creator.nickname || '未知用户' : '未知用户',
      creatorAvatar: creator ? creator.avatar || '/images/default-avatar.png' : '/images/default-avatar.png',
      assigneeName: assignee ? assignee.nickname || '未知用户' : '未知用户',
      assigneeAvatar: assignee ? assignee.avatar || '/images/default-avatar.png' : '/images/default-avatar.png',
      mealTypeLabel: getMealTypeLabel(order.mealType),
      mealTypeIcon: getMealTypeIcon(order.mealType),
      statusLabel: getStatusLabel(order.status),
      orderDate: order.orderDate || new Date(order.createdAt).toLocaleDateString(),
      orderTime: order.orderTime || new Date(order.createdAt).toLocaleTimeString().slice(0, 5),
      createdAt: new Date(order.createdAt).toLocaleString(),
      updatedAt: new Date(order.updatedAt).toLocaleString()
    }

    return {
      success: true,
      data: orderDetail
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return {
      success: false,
      message: '获取订单详情失败'
    }
  }
}

// 更新订单状态
async function updateOrderStatus(openid, orderId, status) {
  // 验证状态值
  const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      message: '无效的订单状态'
    }
  }

  // 检查订单权限
  const orderResult = await db.collection('orders').doc(orderId).get()
  if (!orderResult.data) {
    return {
      success: false,
      message: '订单不存在'
    }
  }

  const order = orderResult.data
  // 检查权限：只有创建者或制作者可以更新订单状态
  if (order.creatorId !== openid && order.assigneeId !== openid) {
    return {
      success: false,
      message: '无权限更新此订单'
    }
  }

  await db.collection('orders').doc(orderId).update({
    data: {
      status,
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '订单状态更新成功'
  }
}

// 取消订单
async function cancelOrder(openid, orderId) {
  const orderResult = await db.collection('orders').doc(orderId).get()
  
  if (!orderResult.data) {
    return {
      success: false,
      message: '订单不存在'
    }
  }

  const order = orderResult.data
  // 检查权限：只有创建者或制作者可以取消订单
  if (order.creatorId !== openid && order.assigneeId !== openid) {
    return {
      success: false,
      message: '无权限取消此订单'
    }
  }

  // 只有待处理的订单可以取消
  if (order.status !== 'pending') {
    return {
      success: false,
      message: '当前订单状态不允许取消'
    }
  }

  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'cancelled',
      cancelTime: new Date(),
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '订单取消成功'
  }
}



// 获取订单统计
async function getOrderStatistics(openid) {
  const allOrders = await db.collection('orders').where({
    $or: [
      { creatorId: openid },
      { assigneeId: openid }
    ]
  }).get()

  const stats = {
    total: allOrders.data.length,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  }

  allOrders.data.forEach(order => {
    stats[order.status]++
  })

  return {
    success: true,
    data: stats
  }
}

// 生成订单号
function generateOrderNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `FY${year}${month}${day}${hour}${minute}${second}${random}`
}

// 获取餐次标签
function getMealTypeLabel(mealType) {
  const labels = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐'
  }
  return labels[mealType] || '未知'
}

// 获取餐次图标
function getMealTypeIcon(mealType) {
  const icons = {
    breakfast: '🌅',
    lunch: '🌞',
    dinner: '🌙'
  }
  return icons[mealType] || '🍽️'
}

// 获取状态标签
function getStatusLabel(status) {
  const labels = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status] || '未知'
}