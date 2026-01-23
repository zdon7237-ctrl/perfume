// miniprogram/pages/pointHistory/pointHistory.ts
import { PointManager } from '../../utils/pointManager';

Page({
  data: { 
    list: [] as any[],
    totalPoints: 0
  },
  
  onShow() {
    // 1. 获取当前总积分 (用于头部展示)
    const total = PointManager.getTotalPoints();

    // 2. 获取明细列表
    const rawList = PointManager.getHistoryList();
    
    const list = rawList.map(item => {
      const d = new Date(item.time);
      // 简单的格式化：2026.01.17 15:30
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const date = d.getDate().toString().padStart(2, '0');
      const hour = d.getHours().toString().padStart(2, '0');
      const minute = d.getMinutes().toString().padStart(2, '0');

      return {
        ...item,
        timeStr: `${year}.${month}.${date} ${hour}:${minute}`
      };
    });
    
    this.setData({ 
      list,
      totalPoints: total
    });
  }
});