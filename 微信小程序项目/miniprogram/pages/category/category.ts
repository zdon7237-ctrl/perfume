// miniprogram/pages/category/category.ts
import { allPerfumes } from '../../data/perfumes';

Page({
  data: {
    perfumes: [] as any[], 
    activeTab: 0,
    searchQuery: '', 
    sortAsc: false,
    
    isMember: false,
    coupons: [] as any[]
  },

  onShow() {
    // 1. 获取会员状态
    const isMember = wx.getStorageSync('isMember') || false;
    
    // 2. 获取有效优惠券 (从缓存读取，确保同步使用状态)
    const myCoupons = wx.getStorageSync('myCoupons') || [];
    const validCoupons = myCoupons.filter((c: any) => c.status === 0);

    this.setData({ 
      isMember,
      coupons: validCoupons
    });

    // 3. 恢复搜索状态
    const tempFilter = wx.getStorageSync('tempSearchFilter');
    if (tempFilter) {
      this.setData({ searchQuery: tempFilter });
      wx.removeStorageSync('tempSearchFilter');
    }

    this.filterAndSort();
  },

  resetSearch() {
    this.setData({ searchQuery: '' });
    this.filterAndSort();
  },

  goToDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    }
  },

  addToCart(e: WechatMiniprogram.TouchEvent) {
    const item = e.currentTarget.dataset.item;
    let cart = wx.getStorageSync('myCart') || [];
    const index = cart.findIndex((p: any) => p.id === item.id);
    if (index > -1) {
      cart[index].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1, selected: true, spec: "标准装" });
    }
    wx.setStorageSync('myCart', cart);
    wx.showToast({ title: '已加入', icon: 'success', duration: 800 });
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value;
    this.setData({ searchQuery: keyword });
    this.filterAndSort();
  },

  onTabClick(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index);
    if (index === 2 && this.data.activeTab === 2) {
      this.setData({ sortAsc: !this.data.sortAsc });
    } else {
      this.setData({ sortAsc: false });
    }
    this.setData({ activeTab: index });
    this.filterAndSort();
  },

  filterAndSort() {
    let list = [...allPerfumes];
    const { searchQuery, activeTab, sortAsc, isMember, coupons } = this.data;

    // 1. 筛选
    if (searchQuery) {
      const key = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(key) || 
        item.brand.toLowerCase().includes(key)
      );
    }

    // 2. 排序
    switch (activeTab) {
      case 0: list.sort((a, b) => a.id - b.id); break;
      case 1: list.sort((a, b) => b.sales - a.sales); break;
      case 2: 
        if (sortAsc) list.sort((a, b) => a.price - b.price);
        else list.sort((a, b) => b.price - a.price);
        break;
      case 3: list = list.filter(item => item.isNew); break;
    }

    // 3. 计算展示价格
    const displayList = list.map(item => {
      // 基础原价 (数据库价格)
      const originalPrice = item.price;

      // 用户基准价：如果是会员打9折，否则原价
      const basePrice = isMember ? (originalPrice * 0.9) : originalPrice;

      // 在 basePrice 基础上计算最优券后价
      let bestPrice = basePrice;
      
      coupons.forEach((coupon: any) => {
        // 门槛判断 (用 basePrice 判断)
        if (basePrice < coupon.min) return;

        // 品牌判断
        if (coupon.limitBrands && coupon.limitBrands.length > 0) {
          const isMatch = coupon.limitBrands.some((b: string) => item.brand.includes(b));
          if (!isMatch) return;
        }

        let tempPrice = basePrice;
        if (coupon.type === 'cash') {
          tempPrice = basePrice - coupon.value;
        } else if (coupon.type === 'discount') {
          tempPrice = basePrice * coupon.value;
        }

        if (tempPrice < bestPrice) {
          bestPrice = tempPrice;
        }
      });

      return {
        ...item,
        // 数据字段标准化，供 WXML 使用
        originalPrice: originalPrice.toFixed(0), // 划线价：始终是原价
        currentPrice: basePrice.toFixed(0),      // 当前价：会员价或原价
        lowestPrice: bestPrice.toFixed(0),       // 券后价
        
        hasDiscount: bestPrice < basePrice,      // 是否有券
        isMember: isMember                       // 用于显示"会员价"标签
      };
    });

    this.setData({ perfumes: displayList });
  }
});