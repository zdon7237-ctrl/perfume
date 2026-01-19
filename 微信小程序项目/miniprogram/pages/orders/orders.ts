Page({
  data: {
    // 标签栏配置
    tabs: ['全部', '待付款', '待发货', '待收货', '待评价', '退款/售后'],
    activeTab: 0, // 当前选中的标签索引
    allOrders: [], // 所有订单的源数据
    displayOrders: [] // 当前展示的订单
  },

  onLoad(options: any) {
    // 如果从"我的"页面点进来带了参数(比如直接点待收货)，这里可以接收
    if (options.type) {
      this.setData({ activeTab: Number(options.type) });
    }
  },

  onShow() {
    this.loadOrders();
  },

  // 加载并筛选订单
  loadOrders() {
    const orders = wx.getStorageSync('myOrders') || [];
    this.setData({ allOrders: orders });
    this.filterOrders();
  },

  // 点击标签切换
  onTabClick(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    this.filterOrders();
  },

  // 核心筛选逻辑
  filterOrders() {
    const { activeTab, allOrders } = this.data;
    let list = [];

    if (activeTab === 0) {
      // 0 代表"全部"，显示所有
      list = allOrders;
    } else {
      // 其他情况：activeTab 刚好对应我们的 status 状态码
      // 注意：待付款是1(Tab索引)，但在我们的逻辑里可能对应状态0。
      // 为了简单，我们定义 Tab 索引即状态码：
      // Tab 0: 全部
      // Tab 1: 待付款 (status=0)
      // Tab 2: 待发货 (status=1) -> 这是我们支付后的默认状态
      // Tab 3: 待收货 (status=2)
      // Tab 4: 待评价 (status=3)
      // Tab 5: 退款/售后 (status=4)
      
      const targetStatus = activeTab - 1; 
      list = allOrders.filter((item: any) => item.status === targetStatus);
    }

    this.setData({ displayOrders: list });
  },

  // 模拟：确认收货
  onConfirmReceipt(e: WechatMiniprogram.TouchEvent) {
    const orderId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确认收到香水了吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, 3); // 3代表待评价/已完成
        }
      }
    });
  },

  // 模拟：申请退款
  onRefund(e: WechatMiniprogram.TouchEvent) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '申请售后',
      content: '确定要申请退款吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, 4); // 4代表售后中
        }
      }
    });
  },

  // 辅助函数：更新状态并保存
  updateOrderStatus(orderId: number, newStatus: number) {
    const list = this.data.allOrders.map((order: any) => {
      if (order.id === orderId) {
        order.status = newStatus;
      }
      return order;
    });

    wx.setStorageSync('myOrders', list);
    this.loadOrders(); // 刷新页面
    wx.showToast({ title: '操作成功', icon: 'success' });
  }
})