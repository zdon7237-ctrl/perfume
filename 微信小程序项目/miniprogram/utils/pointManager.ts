// miniprogram/utils/pointManager.ts

// 积分记录（用于计算总额）
export interface PointRecord {
  id: number;
  amount: number;
  createTime: number;
  expireTime: number;
}

// 积分流水日志（用于展示明细）
export interface PointLog {
  id: number;
  type: 'gain' | 'use' | 'expire'; // 获取 | 使用 | 过期
  amount: number;
  desc: string; // 描述，例如 "购买商品获得"
  time: number;
}

const STORAGE_KEY = 'point_ledger';
const HISTORY_KEY = 'point_history';

export const PointManager = {
  // --- 基础功能 ---
  getTotalPoints(): number {
    const ledger = this.getValidLedger();
    return ledger.reduce((sum, record) => sum + record.amount, 0);
  },

  // --- 核心修改：增加积分同时记录日志 ---
  addPoints(amount: number, desc: string = "购物获得") {
    let ledger = this.getLedger();
    const now = Date.now();
    const oneYearLater = now + (365 * 24 * 60 * 60 * 1000);

    const newRecord: PointRecord = {
      id: now,
      amount: amount,
      createTime: now,
      expireTime: oneYearLater
    };

    ledger.push(newRecord);
    wx.setStorageSync(STORAGE_KEY, ledger);

    // 记录流水
    this.addHistoryLog('gain', amount, desc);
  },

  // --- 核心修改：消耗积分同时记录日志 ---
  usePoints(cost: number, desc: string = "兑换商品"): boolean {
    if (this.getTotalPoints() < cost) return false;

    let ledger = this.getValidLedger();
    ledger.sort((a, b) => a.expireTime - b.expireTime);

    let remainingCost = cost;
    for (let i = 0; i < ledger.length; i++) {
      if (remainingCost <= 0) break;
      let record = ledger[i];
      if (record.amount >= remainingCost) {
        record.amount -= remainingCost;
        remainingCost = 0;
      } else {
        remainingCost -= record.amount;
        record.amount = 0;
      }
    }

    const newLedger = ledger.filter(r => r.amount > 0);
    wx.setStorageSync(STORAGE_KEY, newLedger);

    // 记录流水
    this.addHistoryLog('use', cost, desc);
    return true;
  },

  // --- 新增：记录流水 ---
  addHistoryLog(type: 'gain' | 'use' | 'expire', amount: number, desc: string) {
    let history = wx.getStorageSync(HISTORY_KEY) || [];
    const log: PointLog = {
      id: Date.now(),
      type,
      amount,
      desc,
      time: Date.now()
    };
    // 新的在最前面
    history.unshift(log); 
    wx.setStorageSync(HISTORY_KEY, history);
  },

  // --- 新增：获取流水列表 ---
  getHistoryList(): PointLog[] {
    return wx.getStorageSync(HISTORY_KEY) || [];
  },

  getValidLedger(): PointRecord[] {
    const rawList = wx.getStorageSync(STORAGE_KEY) || [];
    const now = Date.now();
    return rawList.filter((r: any) => r.expireTime > now);
  },

  getLedger(): PointRecord[] {
    return wx.getStorageSync(STORAGE_KEY) || [];
  }
};