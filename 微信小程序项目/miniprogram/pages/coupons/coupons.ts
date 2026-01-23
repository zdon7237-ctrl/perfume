// miniprogram/pages/coupons/coupons.ts
Page({
  data: {
    // 选项卡状态: 0-可使用, 1-已失效
    activeTab: 0, 
    exchangeCode: '',
    allCoupons: [] as any[],
    displayList: [] as any[],
    selectedId: 0
  },

  onLoad(options: any) {
    if (options.source === 'cart') {
      wx.setNavigationBarTitle({ title: '选择优惠券' });
      const current = wx.getStorageSync('selectedCoupon');
      if (current) {
        this.setData({ selectedId: current.id });
      }
    }
    this.loadCoupons();
  },

  loadCoupons() {
    // === 模拟数据 ===
    const mockData = [
      {
        id: 101,
        name: 'Roja 品牌专属礼',
        value: 500,
        min: 2000,
        type: 'cash',
        startTime: '2023.10.01',
        endTime: '2025.12.31',
        status: 0, 
        limitBrands: ['Roja'], // 【限制】Roja
        desc: '仅限 Roja Dove 品牌香水'
      },
      {
        id: 102,
        name: 'Byredo 新人礼',
        value: 50,
        min: 500,
        type: 'cash',
        startTime: '2023.01.01',
        endTime: '2024.12.31',
        status: 0,
        limitBrands: ['Byredo', '百瑞德'], // 【限制】Byredo
        desc: '仅限 Byredo 品牌商品'
      },
      {
        id: 103,
        name: '全场通用9折',
        value: 0.9,
        min: 0,
        type: 'discount',
        startTime: '2023.06.01',
        endTime: '2025.06.01',
        status: 0,
        limitBrands: [], // 【通用】无限制
        desc: '全场通用，无门槛'
      },
      {
        id: 104,
        name: '双11限时券 (已过期)',
        value: 100,
        min: 1000,
        type: 'cash',
        startTime: '2022.11.01',
        endTime: '2022.11.11',
        status: 2, 
        limitBrands: [],
        desc: '限时活动'
      }
    ];

    let list = wx.getStorageSync('myCoupons') || [];
    const ids = list.map((c:any) => c.id);
    mockData.forEach(m => {
      if (!ids.includes(m.id)) list.push(m);
    });
    wx.setStorageSync('myCoupons', list);

    this.setData({ allCoupons: list });
    this.updateDisplayList();
  },

  onTabChange(e: any) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ activeTab: index });
    this.updateDisplayList();
  },

  updateDisplayList() {
    const { activeTab, allCoupons } = this.data;
    let filtered = [];
    if (activeTab === 0) {
      filtered = allCoupons.filter((c: any) => c.status === 0);
    } else {
      filtered = allCoupons.filter((c: any) => c.status !== 0);
    }
    this.setData({ displayList: filtered });
  },

  // 【核心修改】智能使用逻辑
  // 无论是点击卡片还是点击按钮，都触发这个
  onUseCoupon(e: any) {
    // 1. 如果在“已失效”列表，禁止点击
    if (this.data.activeTab !== 0) return;

    const index = e.currentTarget.dataset.index;
    const coupon = this.data.displayList[index];

    // 2. 场景A：从购物车进来选券 -> 保持选中并返回的逻辑
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.route.includes('cart')) {
      wx.setStorageSync('selectedCoupon', coupon);
      this.setData({ selectedId: coupon.id });
      wx.navigateBack();
      return;
    }

    // 3. 场景B：正常浏览 -> 跳转去凑单 (方案B)
    
    if (coupon.limitBrands && coupon.limitBrands.length > 0) {
      // === 情况1：指定商品/品牌券 ===
      const targetBrand = coupon.limitBrands[0];
      
      // 把品牌名存入缓存，category 页面会读取它作为搜索关键词
      wx.setStorageSync('tempSearchFilter', targetBrand);
      
      wx.showToast({ title: `前往 ${targetBrand} 专区`, icon: 'none' });
    } else {
      // === 情况2：全场通用券 ===
      // 清除之前的搜索条件，确保显示全部商品
      wx.removeStorageSync('tempSearchFilter');
      wx.showToast({ title: '前往全部商品', icon: 'none' });
    }

    // 延迟跳转，让用户看清提示
    setTimeout(() => {
      wx.switchTab({ url: '/pages/category/category' });
    }, 500);
  },

  // 保留：空状态跳转首页
  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },
  
  // 保留：输入框逻辑
  onInputCode(e: any) { this.setData({ exchangeCode: e.detail.value }); },
  onExchange() { /* ...兑换逻辑... */ }
});