// miniprogram/pages/category/category.ts
import { allPerfumes } from '../../data/perfumes';
import { IAppOption } from '../../app';
import { MemberManager } from '../../utils/memberManager';

const app = getApp<IAppOption>();

Page({
  data: {
    perfumes: [] as any[], 
    activeTab: 0,
    searchQuery: '', 
    sortAsc: false,
    coupons: [] as any[]
  },

  onShow() {
    // 1. 【核心逻辑】接收从优惠券页面传来的筛选指令
    const tempFilter = wx.getStorageSync('tempSearchFilter');
    
    if (tempFilter) {
      // 如果有指令（如 "Roja"），直接设为搜索词
      this.setData({ searchQuery: tempFilter });
      // 重要：用完即焚，防止用户下次点分类页还卡在这里
      wx.removeStorageSync('tempSearchFilter');
    } else {
      // 如果没有指令，是否重置搜索框？
      // 建议：如果之前有搜索词但不是这次传来的，可以保留或清空。
      // 这里我们选择不清空，保持用户上次的操作习惯，或者你可以 uncomment 下行强制清空
      // this.setData({ searchQuery: '' });
    }

    // 2. 正常获取优惠券和会员数据
    const myCoupons = wx.getStorageSync('myCoupons') || [];
    const validCoupons = myCoupons.filter((c: any) => c.status === 0);

    this.setData({ coupons: validCoupons });

    // 3. 执行渲染 (此时 searchQuery 可能已经被 updateListPrices 内部逻辑用到，或者直接调用 filterAndSort)
    this.filterAndSort();
  },

  resetSearch() {
    this.setData({ searchQuery: '' });
    this.filterAndSort();
  },

  goToDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  addToCart(e: any) {
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

  onSearchInput(e: any) {
    this.setData({ searchQuery: e.detail.value });
    this.filterAndSort();
  },

  onTabClick(e: any) {
    const index = Number(e.currentTarget.dataset.index);
    if (index === 2 && this.data.activeTab === 2) {
      this.setData({ sortAsc: !this.data.sortAsc });
    } else {
      this.setData({ sortAsc: false });
    }
    this.setData({ activeTab: index });
    this.filterAndSort();
  },

  // === 筛选与排序 ===
  filterAndSort() {
    let list = [...allPerfumes];
    const { searchQuery, activeTab, sortAsc, coupons } = this.data;
    
    const totalSpend = app.globalData.totalSpend || wx.getStorageSync('totalSpend') || 0;
    const currentLevel = MemberManager.getCurrentLevel(totalSpend);
    const isVip = currentLevel.discount < 1.0;

    // 1. 筛选 (支持品牌或名称)
    if (searchQuery) {
      const key = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(key) || 
        item.brand.toLowerCase().includes(key) ||
        // 增加对 tag 的搜索支持，更加智能
        (item.tags && item.tags.some((t:string) => t.toLowerCase().includes(key)))
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

    // 3. 计算价格
    const displayList = list.map(item => {
      const isAllowed = item.allowMemberDiscount !== false; 
      let currentPrice = item.price;
      if (isVip && isAllowed) {
        currentPrice = MemberManager.calculateDiscountPrice(item.price, totalSpend);
      }

      let bestPrice = currentPrice;
      coupons.forEach((coupon: any) => {
        if (currentPrice < coupon.min) return;
        if (coupon.limitBrands && coupon.limitBrands.length > 0) {
           const match = coupon.limitBrands.some((b: string) => item.brand.includes(b));
           if (!match) return;
        }
        let temp = currentPrice;
        if (coupon.type === 'cash') temp = currentPrice - coupon.value;
        else if (coupon.type === 'discount') temp = currentPrice * coupon.value;
        if (temp < bestPrice) bestPrice = temp;
      });

      return {
        ...item,
        originalPrice: item.price.toFixed(0),
        displayPrice: currentPrice.toFixed(0),
        lowestPrice: bestPrice.toFixed(0),
        showMemberTag: isVip && isAllowed && (currentPrice < item.price),
        showExcludedTag: isVip && !isAllowed,
        hasCouponDiscount: bestPrice < currentPrice
      };
    });

    this.setData({ perfumes: displayList });
  }
});