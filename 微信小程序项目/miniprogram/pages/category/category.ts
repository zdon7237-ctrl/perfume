// miniprogram/pages/category/category.ts
import { allPerfumes } from '../../data/perfumes';
// [新增] 引入 App 类型定义和 MemberManager
import { IAppOption } from '../../app';
import { MemberManager } from '../../utils/memberManager';

const app = getApp<IAppOption>();

Page({
  data: {
    perfumes: [] as any[], 
    activeTab: 0,
    searchQuery: '', 
    sortAsc: false,
    
    // 这里的 isMember 主要用于控制前端"会员价"标签的显示
    isMember: false,
    coupons: [] as any[]
  },

  onShow() {
    // [修改] 1. 获取实际累计消费额，而不是依赖简单的 isMember 布尔值
    // 优先从 globalData 获取，确保数据最新
    const totalSpend = app.globalData.totalSpend || wx.getStorageSync('totalSpend') || 0;
    
    // 计算当前等级信息
    const currentLevel = MemberManager.getCurrentLevel(totalSpend);
    
    // 只要折扣率小于 1 (即不是原价)，就视为会员状态，界面上显示"会员价"标签
    const isMember = currentLevel.discount < 1;

    // 2. 获取有效优惠券 (从缓存读取)
    const myCoupons = wx.getStorageSync('myCoupons') || [];
    const validCoupons = myCoupons.filter((c: any) => c.status === 0);

    this.setData({ 
      isMember,
      coupons: validCoupons
    });

    // 3. 恢复搜索状态 (如果有)
    const tempFilter = wx.getStorageSync('tempSearchFilter');
    if (tempFilter) {
      this.setData({ searchQuery: tempFilter });
      wx.removeStorageSync('tempSearchFilter');
    }

    // 重新计算列表展示
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
    const { searchQuery, activeTab, sortAsc, coupons } = this.data;
    
    // [新增] 获取消费额用于计算实时会员价
    const totalSpend = app.globalData.totalSpend || wx.getStorageSync('totalSpend') || 0;

    // 1. 筛选逻辑
    if (searchQuery) {
      const key = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(key) || 
        item.brand.toLowerCase().includes(key)
      );
    }

    // 2. 排序逻辑
    switch (activeTab) {
      case 0: list.sort((a, b) => a.id - b.id); break;
      case 1: list.sort((a, b) => b.sales - a.sales); break;
      case 2: 
        if (sortAsc) list.sort((a, b) => a.price - b.price);
        else list.sort((a, b) => b.price - a.price);
        break;
      case 3: list = list.filter(item => item.isNew); break;
    }

    // 3. 计算展示价格 (核心修改部分)
    const displayList = list.map(item => {
      // 基础原价 (数据库价格)
      const originalPrice = item.price;

      // [核心修改] 使用 MemberManager 统一计算会员价
      // 这会根据用户的 totalSpend 自动匹配 95折、9折、85折等
      const basePrice = MemberManager.calculateDiscountPrice(originalPrice, totalSpend);

      // 在 basePrice (会员价) 基础上计算最优券后价
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
          // 折扣券是在当前会员价基础上再打折
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
        currentPrice: basePrice.toFixed(0),      // 当前价：计算出的会员价
        lowestPrice: bestPrice.toFixed(0),       // 券后价
        
        hasDiscount: bestPrice < basePrice,      // 是否有券后优惠
        
        // [逻辑更新] 如果计算出的会员价小于原价，则标记为会员商品
        isMember: basePrice < originalPrice
      };
    });

    this.setData({ perfumes: displayList });
  }
});