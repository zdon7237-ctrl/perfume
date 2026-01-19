// miniprogram/pages/user/user.ts
import { PointManager } from '../../utils/pointManager';
import { MemberManager } from '../../utils/memberManager';
import { IAppOption } from '../../app';

const app = getApp<IAppOption>();

// 定义用于 Swiper 展示的等级配置数据
const LEVEL_CONFIG = [
  { level: 1, name: '闻屿', className: 'level-1', benefits: ['全场95折', '全场包邮'] },
  { level: 2, name: '识香', className: 'level-2', benefits: ['全场9折', '全场包邮'] },
  { level: 3, name: '馥行', className: 'level-3', benefits: ['全场85折', '生日礼遇'] },
  { level: 4, name: '屿居', className: 'level-4', benefits: ['全场85折', '双倍积分'] },
  { level: 5, name: '香主', className: 'level-5', benefits: ['8折', '私享沙龙', '双倍积分'] }
];

Page({
  data: {
    // 页面布局适配数据
    paddingTop: 0, // 动态计算的顶部内边距

    userInfo: {
      nickName: "ScentAtoll 会员",
      avatarUrl: ""
    },

    // Swiper 相关数据
    levelList: LEVEL_CONFIG, // 所有等级列表
    currentSwiperIndex: 0,   // Swiper 当前显示的索引
    userLevelIndex: 0,       // 用户实际的等级索引 (用于显示"当前等级"标签)
    
    // 用户实际数据
    userSpend: 0,
    nextLevelSpend: 0,
    
    stats: {
      points: 0,
      coupons: 0,
      wallet: '0.00'
    }
  },

  onLoad() {
    this.calcNavBarHeight();
  },

  onShow() {
    this.updateData();
  },

  // 1. 解决顶部遮挡：计算状态栏高度
  calcNavBarHeight() {
    const sysInfo = wx.getSystemInfoSync();
    // 状态栏高度 + 胶囊按钮的大致高度预留 (通常44px)
    // 这里增加 20rpx 的额外呼吸空间
    const topPadding = sysInfo.statusBarHeight + 44; 
    this.setData({ paddingTop: topPadding });
  },

  updateData() {
    const totalSpend = app.globalData.totalSpend || 0;
    
    // 获取当前逻辑等级
    const currentLevelInfo = MemberManager.getCurrentLevel(totalSpend);
    
    // 计算当前等级在数组中的索引 (假设 level 1 对应索引 0)
    // LEVEL_CONFIG 中 level 是 1-5，所以 index = level - 1
    const currentIndex = currentLevelInfo.level - 1;

    // 获取升级进度
    const upgradeInfo = MemberManager.getUpgradeProgress(totalSpend);

    this.setData({
      userSpend: totalSpend,
      nextLevelSpend: upgradeInfo ? upgradeInfo.needSpend : 0,
      
      // 核心交互：让 Swiper 默认选中当前等级
      currentSwiperIndex: currentIndex,
      userLevelIndex: currentIndex, 

      'stats.points': PointManager.getTotalPoints(),
      'stats.coupons': 2,
      'stats.wallet': (wx.getStorageSync('myWallet') || 0).toFixed(2)
    });
  },

  // 页面路由跳转保持不变
  onGoToWallet() { wx.navigateTo({ url: '/pages/wallet/wallet' }); },
  onGoToPointHistory() { wx.navigateTo({ url: '/pages/pointHistory/pointHistory' }); },
  onGoToCoupons() { wx.navigateTo({ url: '/pages/coupons/coupons' }); },
  onGoToPointShop() { wx.navigateTo({ url: '/pages/pointShop/pointShop' }); },
  onGoToCart() { wx.switchTab({ url: '/pages/cart/cart' }); },
  onGoToOrders(e: WechatMiniprogram.TouchEvent) { 
    const type = e.currentTarget.dataset.type || 0;
    wx.navigateTo({ url: `/pages/orders/orders?type=${type}` }); 
  },
  onGoToAdmin() { wx.navigateTo({ url: '/pages/admin/admin' }); },
  onMemberCode() { wx.showToast({ title: '会员码生成中...', icon: 'loading' }); }
})