// 积分记录的结构
export interface PointRecord {
  id: number;       // 唯一ID
  amount: number;   // 剩余可用积分（会随着使用减少）
  createTime: number; // 获得时间
  expireTime: number; // 过期时间（一年后）
}

const STORAGE_KEY = 'point_ledger';

export const PointManager = {
  // 1. 获取当前所有有效积分的总和
  getTotalPoints(): number {
    const ledger = this.getValidLedger();
    // 累加所有记录的 amount
    return ledger.reduce((sum, record) => sum + record.amount, 0);
  },

  // 2. 增加积分（存入一笔新积分）
  addPoints(amount: number) {
    let ledger = this.getLedger();
    const now = Date.now();
    // 增加一年保质期 (365天 * 24小时 * 60分 * 60秒 * 1000毫秒)
    const oneYearLater = now + (365 * 24 * 60 * 60 * 1000);

    const newRecord: PointRecord = {
      id: now, // 简单用时间戳做ID
      amount: amount,
      createTime: now,
      expireTime: oneYearLater
    };

    ledger.push(newRecord);
    wx.setStorageSync(STORAGE_KEY, ledger);
  },

  // 3. 消耗积分（核心算法：FIFO）
  // 返回 true 表示扣除成功，false 表示积分不足
  usePoints(cost: number): boolean {
    if (this.getTotalPoints() < cost) return false;

    let ledger = this.getValidLedger();
    // 按过期时间排序：先过期的排前面 (First In First Out)
    ledger.sort((a, b) => a.expireTime - b.expireTime);

    let remainingCost = cost;
    
    // 遍历每一笔积分记录
    for (let i = 0; i < ledger.length; i++) {
      if (remainingCost <= 0) break;

      let record = ledger[i];

      if (record.amount >= remainingCost) {
        // 这笔积分够扣，扣完收工
        record.amount -= remainingCost;
        remainingCost = 0;
      } else {
        // 这笔积分不够扣，把它扣光，然后继续扣下一笔
        remainingCost -= record.amount;
        record.amount = 0; // 这笔废了
      }
    }

    // 过滤掉已经用光(0)的记录，保存回去
    const newLedger = ledger.filter(r => r.amount > 0);
    wx.setStorageSync(STORAGE_KEY, newLedger);
    return true;
  },

  // 4. 获取清理过期的账本（内部辅助函数）
  getValidLedger(): PointRecord[] {
    const rawList = wx.getStorageSync(STORAGE_KEY) || [];
    const now = Date.now();
    // 过滤掉：过期时间 < 当前时间 的记录
    // 也就是只保留：过期时间 > 当前时间
    return rawList.filter((r: any) => r.expireTime > now);
  },

  // 获取原始账本（不过滤，用于写入）
  getLedger(): PointRecord[] {
    return wx.getStorageSync(STORAGE_KEY) || [];
  }
};