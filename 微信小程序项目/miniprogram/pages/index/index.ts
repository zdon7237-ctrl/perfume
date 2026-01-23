// miniprogram/pages/index/index.ts
import { IAppOption } from '../../app';
import { allPerfumes } from '../../data/perfumes';
import { MemberManager } from '../../utils/memberManager'; // 【必须引入】

const app = getApp<IAppOption>();

Page({
  data: {
    perfumeList: [] as any[], // 列表数据
    // ... 其他数据保持不变
  },

  onShow() {
    // 每次显示页面时，重新计算价格（因为用户等级可能刚变了）
    this.updateListPrices();
    
    // 如果有 tabbar 设置，这里保留
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  // 【核心修复】计算列表显示的实时价格
  updateListPrices() {
    const totalSpend = app.globalData.totalSpend || 0;
    const level = MemberManager.getCurrentLevel(totalSpend);
    const isVip = level.discount < 1.0; // 当前用户是否是VIP（有折扣）

    const formattedList = allPerfumes.map(item => {
      // 1. 判断商品是否允许折扣 (undefined 视为 true)
      const isAllowed = item.allowMemberDiscount !== false;

      // 2. 计算展示价格
      let displayPrice = item.price;
      
      // 只有当 (是VIP) 且 (商品允许打折) 时，才显示折后价
      if (isVip && isAllowed) {
        displayPrice = MemberManager.calculateDiscountPrice(item.price, totalSpend);
      }

      return {
        ...item,
        displayPrice: displayPrice, // 【新字段】用于显示
        showMemberTag: isVip && isAllowed,    // 是否显示“VIP”标签
        showExcludedTag: isVip && !isAllowed  // 是否显示“不参与折扣”标签 (只对VIP显示)
      };
    });

    this.setData({
      perfumeList: formattedList
    });
  },

  // ... 跳转详情页等其他方法保持不变
  goToDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});