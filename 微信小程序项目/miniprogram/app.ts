// miniprogram/app.ts

// 1. 定义全局接口 (这是解决报错的关键)
export interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    totalSpend: number; // 必须在这里声明，user.ts 才能识别
  }
  userInfoReadyCallback?: (res: WechatMiniprogram.UserInfo) => void
}

App<IAppOption>({
  globalData: {
    totalSpend: 45000 // 模拟初始消费金额
  },
  
  onLaunch() {
    // 优先读取本地缓存
    const localSpend = wx.getStorageSync('totalSpend');
    if (typeof localSpend === 'number') {
      this.globalData.totalSpend = localSpend;
    } else {
      wx.setStorageSync('totalSpend', this.globalData.totalSpend);
    }
    
    // 登录逻辑...
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})