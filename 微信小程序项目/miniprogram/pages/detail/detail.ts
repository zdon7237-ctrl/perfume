// miniprogram/pages/detail/detail.ts
import { allPerfumes, PerfumeItem } from '../../data/perfumes';

Page({
  data: {
    info: null as PerfumeItem | null,
    showShare: false
  },

  onLoad(options: any) {
    const id = Number(options.id);
    const target = allPerfumes.find(p => p.id === id);
    if (target) {
      this.setData({ info: target });
      wx.setNavigationBarTitle({ title: target.name });
    }
  },

  openShareModal() {
    this.setData({ showShare: true });
  },

  closeShareModal() {
    this.setData({ showShare: false });
  },

  copyLink() {
    const item = this.data.info;
    if (!item) return;
    const promoText = `【馥屿ScentAtoll】${item.brand} - ${item.name}\n价格：¥${item.price}\n点击查看：#小程序://馥屿/detail?id=${item.id}`;
    wx.setClipboardData({
      data: promoText,
      success: () => {
        this.closeShareModal();
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  },

  onShareAppMessage() {
    const item = this.data.info;
    this.closeShareModal();
    return {
      title: item ? `推荐：${item.brand} ${item.name}` : '馥屿ScentAtoll',
      path: `/pages/detail/detail?id=${item?.id}`,
      imageUrl: item?.image || ''
    };
  },

  onShareTimeline() {
    const item = this.data.info;
    return {
      title: item ? `${item.name} - 馥屿ScentAtoll` : '馥屿香水',
      query: `id=${item?.id}`,
      imageUrl: item?.image || ''
    };
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goToCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

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
    
    // 已移除震动 wx.vibrateShort
    wx.showToast({ title: '已加入购物袋', icon: 'success' });
  },

  buyNow() {
    this.addToCart();
    setTimeout(() => {
      wx.switchTab({ url: '/pages/cart/cart' });
    }, 500);
  }
});