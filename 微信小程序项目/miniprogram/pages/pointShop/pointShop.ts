// miniprogram/pages/pointShop/pointShop.ts

interface GiftItem {
  id: number;
  name: string;
  points: number; 
  image: string;
  stock: number;
}

import { PointManager } from '../../utils/pointManager';

Page({
  data: {
    myPoints: 0, 
    giftList: [
      {
        id: 1,
        name: "Roja Dove 2ml 随机小样",
        points: 500,
        stock: 10,
        image: ""
      },
      {
        id: 2,
        name: "Sultan Pasha 0.2ml 纯精油",
        points: 2000,
        stock: 3, // 测试库存角标
        image: ""
      },
      {
        id: 3,
        name: "店铺 100元 无门槛代金券",
        points: 1000,
        stock: 99,
        image: ""
      }
    ] as GiftItem[]
  },

  onShow() {
    this.updatePoints();
  },

  updatePoints() {
    const p = PointManager.getTotalPoints();
    this.setData({ myPoints: p });
  },

  // 新增：跳转积分明细
  onGoToHistory() {
    wx.navigateTo({
      url: '/pages/pointHistory/pointHistory'
    });
  },

  onRedeem(e: WechatMiniprogram.TouchEvent) {
    const item = e.currentTarget.dataset.item;

    if (this.data.myPoints < item.points) {
      wx.showToast({ title: '积分不足哦', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认兑换',
      content: `确定消耗 ${item.points} 积分兑换 ${item.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doRedeem(item);
        }
      }
    });
  },

  doRedeem(item: GiftItem) {
    const success = PointManager.usePoints(item.points, `兑换：${item.name}`);

    if (success) {
      this.updatePoints();
      wx.showToast({ title: '兑换成功！', icon: 'success' });
    } else {
      wx.showToast({ title: '系统错误', icon: 'none' });
    }
  }
});