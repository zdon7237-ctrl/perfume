// miniprogram/pages/detail/detail.ts
import { allPerfumes, PerfumeItem } from '../../data/perfumes';
import { MemberManager } from '../../utils/memberManager';
import { IAppOption } from '../../app';

Page({
  data: {
    info: null as PerfumeItem | null,
    showShare: false,
    
    // UI状态字段
    currentPrice: 0,      // 大字显示的价格
    showMemberPrice: false, // 是否处于会员折扣状态
    showExcludedTag: false  // 是否显示"不参与折扣"
  },

  onLoad(options: any) {
    const id = Number(options.id);
    const target = allPerfumes.find(p => p.id === id);
    
    if (target) {
      const app = getApp<IAppOption>();
      const totalSpend = app.globalData.totalSpend || 0;

      // 1. 获取用户会员状态
      const level = MemberManager.getCurrentLevel(totalSpend);
      const isVip = level.discount < 1.0; 

      // 2. 检查商品属性
      const isAllowed = target.allowMemberDiscount !== false;

      // 3. 计算逻辑
      // 只有 (是VIP) 且 (允许打折) 才显示会员价
      const showMemberPrice = isVip && isAllowed;
      
      // 如果 (是VIP) 但 (不允许打折)，则显示“不参与折扣”
      const showExcludedTag = isVip && !isAllowed;

      // 4. 确定最终价格
      const finalPrice = showMemberPrice 
        ? MemberManager.calculateDiscountPrice(target.price, totalSpend)
        : target.price;

      this.setData({ 
        info: target,
        currentPrice: finalPrice,
        showMemberPrice: showMemberPrice,
        showExcludedTag: showExcludedTag
      });

      wx.setNavigationBarTitle({ title: target.name });
    }
  },

  // ... 其他方法(分享、添加购物车等)保持不变，直接复制之前的即可
  openShareModal() { this.setData({ showShare: true }); },
  closeShareModal() { this.setData({ showShare: false }); },
  
  addToCart() {
    const item = this.data.info;
    if (!item) return;

    let cart = wx.getStorageSync('myCart') || [];
    const index = cart.findIndex((p: any) => p.id === item.id);
    if (index > -1) {
      cart[index].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1, selected: true, spec: "标准装" });
    }
    wx.setStorageSync('myCart', cart);
    wx.showToast({ title: '已加入购物袋', icon: 'success' });
  },

  buyNow() {
    this.addToCart();
    setTimeout(() => { wx.switchTab({ url: '/pages/cart/cart' }); }, 500);
  },
  
  goHome() { wx.switchTab({ url: '/pages/index/index' }); },
  goToCart() { wx.switchTab({ url: '/pages/cart/cart' }); }
});