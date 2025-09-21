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
        return await getOrderList(wxContext.OPENID, event.status, event.page, event.limit)
      
      case 'getOrderDetail':
        return await getOrderDetail(wxContext.OPENID, event.orderId)
      
      case 'updateOrderStatus':
        return await updateOrderStatus(wxContext.OPENID, event.orderId, event.status)
      
      case 'cancelOrder':
        return await cancelOrder(wxContext.OPENID, event.orderId)
      
      case 'payOrder':
        return await payOrder(wxContext.OPENID, event.orderId)
      
      case 'confirmOrder':
        return await confirmOrder(wxContext.OPENID, event.orderId)
      
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
  const { items, totalAmount, deliveryAddress, remark } = orderData

  if (!items || items.length === 0) {
    return {
      success: false,
      message: '订单商品不能为空'
    }
  }

  if (!totalAmount || totalAmount <= 0) {
    return {
      success: false,
      message: '订单金额无效'
    }
  }

  // 生成订单号
  const orderNo = generateOrderNo()

  const order = {
    orderNo,
    userOpenid: openid,
    items,
    totalAmount,
    deliveryAddress,
    remark: remark || '',
    status: 'pending', // pending: 待支付, paid: 已支付, preparing: 制作中, delivering: 配送中, completed: 已完成, cancelled: 已取消
    createTime: new Date(),
    updateTime: new Date()
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
async function getOrderList(openid, status = null, page = 1, limit = 10) {
  let query = db.collection('orders').where({
    userOpenid: openid
  })

  if (status) {
    query = query.where({
      status
    })
  }

  const result = await query
    .orderBy('createTime', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get()

  // 获取总数
  const countResult = await query.count()

  return {
    success: true,
    data: {
      orders: result.data,
      total: countResult.total,
      page,
      limit,
      hasMore: result.data.length === limit
    }
  }
}

// 获取订单详情
async function getOrderDetail(openid, orderId) {
  const result = await db.collection('orders').doc(orderId).get()

  if (!result.data || result.data.userOpenid !== openid) {
    return {
      success: false,
      message: '订单不存在或无权限查看'
    }
  }

  return {
    success: true,
    data: result.data
  }
}

// 更新订单状态
async function updateOrderStatus(openid, orderId, status) {
  // 验证状态值
  const validStatuses = ['pending', 'paid', 'preparing', 'delivering', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      message: '无效的订单状态'
    }
  }

  // 检查订单权限
  const orderResult = await db.collection('orders').doc(orderId).get()
  if (!orderResult.data || orderResult.data.userOpenid !== openid) {
    return {
      success: false,
      message: '订单不存在或无权限'
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
  
  if (!orderResult.data || orderResult.data.userOpenid !== openid) {
    return {
      success: false,
      message: '订单不存在或无权限'
    }
  }

  const order = orderResult.data

  // 只有待支付和已支付的订单可以取消
  if (!['pending', 'paid'].includes(order.status)) {
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

// 支付订单
async function payOrder(openid, orderId) {
  const orderResult = await db.collection('orders').doc(orderId).get()
  
  if (!orderResult.data || orderResult.data.userOpenid !== openid) {
    return {
      success: false,
      message: '订单不存在或无权限'
    }
  }

  const order = orderResult.data

  if (order.status !== 'pending') {
    return {
      success: false,
      message: '订单状态不允许支付'
    }
  }

  // 这里应该调用微信支付API，暂时模拟支付成功
  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'paid',
      payTime: new Date(),
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '支付成功'
  }
}

// 确认收货
async function confirmOrder(openid, orderId) {
  const orderResult = await db.collection('orders').doc(orderId).get()
  
  if (!orderResult.data || orderResult.data.userOpenid !== openid) {
    return {
      success: false,
      message: '订单不存在或无权限'
    }
  }

  const order = orderResult.data

  if (order.status !== 'delivering') {
    return {
      success: false,
      message: '订单状态不允许确认收货'
    }
  }

  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'completed',
      completeTime: new Date(),
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '确认收货成功'
  }
}

// 获取订单统计
async function getOrderStatistics(openid) {
  const allOrders = await db.collection('orders').where({
    userOpenid: openid
  }).get()

  const stats = {
    total: allOrders.data.length,
    pending: 0,
    paid: 0,
    preparing: 0,
    delivering: 0,
    completed: 0,
    cancelled: 0,
    totalAmount: 0
  }

  allOrders.data.forEach(order => {
    stats[order.status]++
    if (order.status !== 'cancelled') {
      stats.totalAmount += order.totalAmount
    }
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