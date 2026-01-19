// miniprogram/pages/coupons/coupons.ts

export interface Coupon {
  id: number;
  type: 'cash' | 'discount'; 
  value: number; 
  min: number; 
  name: string;
  date: string;
  status: 0 | 1 | 2; // 0: 可使用, 1: 已使用, 2: 已失效
  reason?: string;
  expanded?: boolean; 
  conditions?: string[];
  productLink?: string; 
  limitBrands?: string[]; // 品牌限制
}

// 默认初始优惠券
const DEFAULT_COUPONS: Coupon[] = [
  { 
    id: 1, type: 'cash', value: 50, min: 500, name: '新人见面礼', date: '2026.12.31', status: 0, 
    expanded: false,
    conditions: ['支持线上商城使用', '全场通用', '不可与其他优惠叠加'] 
  },
  { 
    id: 2, type: 'discount', value: 0.9, min: 0, name: '9折优惠券', date: '长期有效', status: 0,
    expanded: false,
    conditions: ['仅限正价商品', '会员专享'],
    productLink: '/pages/category/category' 
  },
  { 
    id: 3, type: 'cash', value: 100, min: 1000, name: '百瑞德专属券', date: '2025.12.25', status: 0, 
    expanded: false,
    conditions: ['仅限Byredo品牌', '可叠加会员折扣'],
    productLink: '/pages/category/category',
    limitBrands: ['Byredo']
  },
  { 
    id: 4, type: 'cash', value: 20, min: 200, name: '过期快闪券', date: '2025.11.11', status: 2, reason: '已过期',
    expanded: false,
    conditions: ['限时活动使用']
  }
];

Page({
  data: {
    tabs: ['可使用', '已使用', '已失效'],
    activeTab: 0,
    displayList: [] as Coupon[],
    isFromCart: false
  },

  onLoad(options: any) {
    if (options.source === 'cart') {
      this.setData({ isFromCart: true });
      wx.setNavigationBarTitle({ title: '选择优惠券' });
    }
  },

  onShow() {
    // 每次显示时重新读取缓存，确保状态最新
    this.initCoupons();
    this.filterCoupons(this.data.activeTab);
  },

  // 初始化优惠券数据 (如果缓存没有，就写入默认的)
  initCoupons() {
    const stored = wx.getStorageSync('myCoupons');
    if (!stored) {
      wx.setStorageSync('myCoupons', DEFAULT_COUPONS);
    }
  },

  onTabClick(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    this.filterCoupons(index);
  },

  filterCoupons(status: number) {
    const all = wx.getStorageSync('myCoupons') || [];
    const list = all.filter((c: Coupon) => c.status === status);
    this.setData({ displayList: list });
  },

  toggleExpand(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    const list = this.data.displayList.map(item => {
      if (item.id === id) {
        return { ...item, expanded: !item.expanded };
      }
      return item;
    });
    this.setData({ displayList: list });
  },

  onSelectCoupon(e: WechatMiniprogram.TouchEvent) {
    const item = e.currentTarget.dataset.item;
    
    // 只有"可使用"且"从购物车进来"时，才执行选择
    if (this.data.activeTab === 0 && this.data.isFromCart) {
      wx.setStorageSync('selectedCoupon', item);
      wx.navigateBack();
    }
  },

  viewProductList(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.switchTab({ url });
  },

  onNoUse() {
    wx.removeStorageSync('selectedCoupon');
    wx.navigateBack();
  }
});