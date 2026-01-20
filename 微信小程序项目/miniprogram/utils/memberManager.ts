// miniprogram/utils/memberManager.ts

export interface MemberLevel {
  level: number;       // 等级编号 1-5
  name: string;        // 等级名称
  threshold: number;   // 升级门槛（累计消费）
  discount: number;    // 折扣率 (0.95 = 95折)
  pointRatio: number;  // 积分倍率 (1 = 1倍, 2 = 双倍)
  benefits: string[];  // 权益标签文案
}

// 核心配置：按门槛从高到低排序，方便逻辑判断
const LEVEL_RULES: MemberLevel[] = [
  { 
    level: 5, name: '香主', threshold: 100000, discount: 0.80, pointRatio: 2, 
    benefits: ['全场8折', '双倍积分', '全场包邮', '私享沙龙'] 
  },
  { 
    level: 4, name: '屿居', threshold: 70000, discount: 0.85, pointRatio: 2, 
    benefits: ['全场85折', '双倍积分', '全场包邮'] 
  },
  { 
    level: 3, name: '馥行', threshold: 40000, discount: 0.85, pointRatio: 1, 
    benefits: ['全场85折', '全场包邮', '生日礼遇'] 
  },
  { 
    level: 2, name: '识香', threshold: 10000, discount: 0.90, pointRatio: 1, 
    benefits: ['全场9折', '全场包邮'] 
  },
  { 
    level: 1, name: '闻屿', threshold: 0, discount: 0.95, pointRatio: 1, 
    benefits: ['全场95折', '全场包邮'] 
  }
];

export class MemberManager {
  
  /**
   * 根据累计消费金额获取当前会员等级信息
   */
  static getCurrentLevel(totalSpend: number): MemberLevel {
    // 找到第一个门槛小于等于当前消费的等级
    const level = LEVEL_RULES.find(rule => totalSpend >= rule.threshold);
    return level || LEVEL_RULES[LEVEL_RULES.length - 1]; // 默认最低等级
  }

  /**
   * 获取下一级升级信息
   * @returns { nextLevelName: string, needSpend: number } | null (如果是最高级返回null)
   */
  static getUpgradeProgress(totalSpend: number) {
    const currentLevel = this.getCurrentLevel(totalSpend);
    
    // 寻找比当前等级高的下一级 (数组是倒序的)
    // 比如当前是 Level 3 (index 2)，我们要找 Level 4 (index 1)
    const ruleIndex = LEVEL_RULES.findIndex(r => r.level === currentLevel.level);
    
    if (ruleIndex > 0) {
      const nextLevel = LEVEL_RULES[ruleIndex - 1];
      return {
        nextLevelName: nextLevel.name,
        needSpend: nextLevel.threshold - totalSpend,
        nextThreshold: nextLevel.threshold,
        currentThreshold: currentLevel.threshold
      };
    }
    return null; // 已经是最高级
  }

  /**
   * 计算折后价格
   */
  static calculateDiscountPrice(originalPrice: number, totalSpend: number): number {
    const level = this.getCurrentLevel(totalSpend);
    return Number((originalPrice * level.discount).toFixed(2));
  }

  /**
   * 计算应得积分 (金额 * 倍率)
   */
  static calculatePoints(paymentAmount: number, totalSpend: number): number {
    const level = this.getCurrentLevel(totalSpend);
    return Math.floor(paymentAmount * level.pointRatio);
  }
  
  /**
   * 格式化折扣显示 (如 0.85 -> 8.5折)
   */
  static formatDiscount(discount: number): string {
    if (discount >= 1) return '无折扣';
    const val = discount * 10;
    // 处理如 0.85 -> 8.5, 0.8 -> 8
    return val % 1 === 0 ? `${val}折` : `${val.toFixed(1)}折`;
  }
}