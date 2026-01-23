// miniprogram/pages/wallet/wallet.ts
Page({
  data: { 
    balance: '0.00', 
    amount: 0 
  },

  onShow() {
    const w = wx.getStorageSync('myWallet') || 0;
    this.setData({ balance: w.toFixed(2) });
  },

  onInput(e: any) { 
    this.setData({ amount: Number(e.detail.value) }); 
  },

  onTopUp() {
    // 修改处：分开写，不要直接 return wx.showToast
    if (this.data.amount <= 0) {
      wx.showToast({title:'请输入金额', icon:'none'});
      return; 
    }
    
    // 模拟充值逻辑
    let current = wx.getStorageSync('myWallet') || 0;
    current += this.data.amount;
    wx.setStorageSync('myWallet', current);
    
    wx.showToast({title: '充值成功', icon:'success'});
    
    setTimeout(() => { 
      wx.navigateBack(); 
    }, 1500);
  }
});