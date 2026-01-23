// miniprogram/pages/admin/admin.ts
import { allPerfumes } from '../../data/perfumes';
import { IAppOption } from '../../app';

const app = getApp<IAppOption>();

Page({
  data: {
    perfumes: [] as any[],
    currentSpend: 0,
    userLevel: '加载中'
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const spend = app.globalData.totalSpend || 0;
    // 简单判断等级名称用于显示
    let levelName = '普通会员';
    if (spend >= 20000) levelName = '钻石 (88折)';
    else if (spend >= 1000) levelName = '黄金 (95折)';

    this.setData({ 
      perfumes: allPerfumes,
      currentSpend: spend,
      userLevel: levelName
    });
  },

  // 开关折扣
  toggleDiscountStatus(e: any) {
    const id = e.currentTarget.dataset.id;
    const target = allPerfumes.find(p => p.id === id);
    if (target) {
      const isAllowed = target.allowMemberDiscount !== false;
      target.allowMemberDiscount = !isAllowed;
      this.setData({ perfumes: allPerfumes });
    }
  },

  // 【测试神器】一键升级
  simulateVip() {
    const newSpend = 25000; // 升到钻石
    app.globalData.totalSpend = newSpend;
    wx.setStorageSync('totalSpend', newSpend);
    this.loadData();
    wx.showToast({ title: '已升级! 去首页看看', icon: 'none' });
  },

  // 重置回普通会员
  resetUser() {
    app.globalData.totalSpend = 0;
    wx.setStorageSync('totalSpend', 0);
    this.loadData();
    wx.showToast({ title: '已重置为路人', icon: 'none' });
  }
});