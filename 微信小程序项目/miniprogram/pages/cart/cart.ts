// miniprogram/pages/cart/cart.ts
import { IAppOption } from '../../app';
import { MemberManager } from '../../utils/memberManager';

const app = getApp<IAppOption>();

Page({
  data: {
    cartList: [] as any[],
    isAllSelected: false,
    isEditMode: false,

    totalPrice: '0',     // 原始总价
    finalPrice: '0',     // 最终支付价
    discountAmount: '0', // 优惠券减免
    memberSavings: '0',  // 会员等级减免
    selectedCount: 0,
    
    selectedCoupon: null as any
  },

  onShow() {
    this.initData();
  },

  initData() {
    const cart = wx.getStorageSync('myCart') || [];
    const coupon = wx.getStorageSync('selectedCoupon') || null;
    
    // 初始化 x 坐标用于左滑删除
    const formattedCart = cart.map((item: any) => ({
      ...item,
      x: 0 
    }));
    
    this.setData({ 
      cartList: formattedCart,
      selectedCoupon: coupon
    });
    
    this.calculateTotal();
  },

  // --- 交互模式 ---
  toggleEditMode() {
    this.setData({
      isEditMode: !this.data.isEditMode
    });
  },

  toggleSelect(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const key = `cartList[${index}].selected`;
    this.setData({ [key]: !this.data.cartList[index].selected });
    this.calculateTotal();
  },

  toggleAll() {
    const isAll = !this.data.isAllSelected;
    const newList = this.data.cartList.map(item => ({ ...item, selected: isAll }));
    this.setData({ 
      cartList: newList,
      isAllSelected: isAll 
    });
    this.calculateTotal();
  },

  updateQuantity(e: WechatMiniprogram.TouchEvent) {
    const { index, type } = e.currentTarget.dataset;
    const list = this.data.cartList;
    
    if (type === 'minus') {
      if (list[index].quantity > 1) {
        list[index].quantity--;
      } else {
        return; 
      }
    } else {
      list[index].quantity++;
    }
    
    this.setData({ cartList: list });
    wx.setStorageSync('myCart', list);
    this.calculateTotal();
  },

  // --- 删除逻辑 (已修复警告) ---
  deleteItem(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    this.performDelete([index]);
  },

  batchDelete() {
    const list = this.data.cartList;
    const indexesToDelete: number[] = [];
    
    list.forEach((item, index) => {
      if (item.selected) indexesToDelete.push(index);
    });

    if (indexesToDelete.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除这 ${indexesToDelete.length} 件商品吗？`,
      confirmColor: '#D63031',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(indexesToDelete);
        }
      }
    });
  },

  performDelete(indexes: number[]) {
    // 1. 降序排序，防止索引塌陷
    const sortedIndexes = indexes.sort((a, b) => b - a);
    const list = this.data.cartList;

    // 2. 依次删除
    sortedIndexes.forEach(idx => {
      list.splice(idx, 1);
    });

    // 3. 更新状态
    this.setData({ cartList: list });
    wx.setStorageSync('myCart', list);
    this.calculateTotal();

    if (list.length === 0) {
      this.setData({ isEditMode: false });
    }
  },

  goToCoupons() {
    wx.navigateTo({
      url: '/pages/coupons/coupons?source=cart'
    });
  },

  // === 核心计算逻辑 (接入 MemberManager) ===
  calculateTotal() {
    const list = this.data.cartList;
    const coupon = this.data.selectedCoupon;
    // 获取当前用户的累计消费，用于计算折扣
    const totalSpend = app.globalData.totalSpend || 0;

    let totalOrigin = 0;   // 吊牌原价总额
    let totalMember = 0;   // 会员折后总额
    let selectedCount = 0;
    let isAll = list.length > 0;

    // 1. 商品层面计算
    list.forEach(item => {
      if (item.selected) {
        selectedCount++;
        
        // 原价累加
        totalOrigin += item.price * item.quantity;

        // 会员价累加 (使用 MemberManager 动态计算折扣)
        const unitMemberPrice = MemberManager.calculateDiscountPrice(item.price, totalSpend);
        totalMember += unitMemberPrice * item.quantity;

      } else {
        isAll = false;
      }
    });

    if (list.length === 0) isAll = false;

    // 2. 优惠券层面计算 (基于会员折后价)
    let couponDiscount = 0;
    let eligibleAmount = 0;

    if (coupon) {
      list.forEach(item => {
        if (item.selected) {
          // 检查品牌限制
          let isEligible = true;
          if (coupon.limitBrands && coupon.limitBrands.length > 0) {
            const match = coupon.limitBrands.some((b: string) => item.brand.includes(b));
            if (!match) isEligible = false;
          }

          if (isEligible) {
            // 使用会员折后价计算门槛
            const unitMemberPrice = MemberManager.calculateDiscountPrice(item.price, totalSpend);
            eligibleAmount += unitMemberPrice * item.quantity;
          }
        }
      });

      // 满足门槛则计算优惠
      if (eligibleAmount >= coupon.min) {
        if (coupon.type === 'cash') {
          couponDiscount = coupon.value;
        } else if (coupon.type === 'discount') {
          // 折扣券 (假设是对折后价再打折，例如9折券)
          // 注意：coupon.value 如果是 0.9，这里减免金额应该是 eligible * (1 - 0.9)
          // 这里的逻辑根据 coupon.value 的定义来，通常 0.9 代表 9折
          // 如果 value 是减免额度则不需要转换
          // 假设 value 是 0.9 (9折)
           if (coupon.value < 1) {
              couponDiscount = eligibleAmount * (1 - coupon.value);
           }
        }
      }
    }

    // 3. 最终汇总
    let final = totalMember - couponDiscount;
    if (final < 0) final = 0;

    const fmt = (num: number) => Number(num.toFixed(2)).toString();

    this.setData({
      isAllSelected: isAll,
      totalPrice: fmt(totalMember), // 显示给用户看的是"会员折后总价"
      discountAmount: fmt(couponDiscount),
      memberSavings: fmt(totalOrigin - totalMember), // 显示会员权益省了多少
      finalPrice: fmt(final),
      hasDiscount: couponDiscount > 0,
      selectedCount: selectedCount
    });
  },

  // === 结算 ===
  onCheckout() {
    if (Number(this.data.finalPrice) <= 0 && this.data.selectedCount === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }

    const payAmount = this.data.finalPrice;
    const selectedItems = this.data.cartList.filter(item => item.selected);
    const savings = this.data.memberSavings;

    wx.showModal({
      title: '确认付款',
      content: `合计 ¥${payAmount}\n(会员已省 ¥${savings})`,
      confirmColor: '#121212',
      success: (res) => {
        if (res.confirm) {
          this.processPayment(selectedItems, payAmount);
        }
      }
    });
  },

  processPayment(items: any[], totalAmountStr: string) {
    wx.showLoading({ title: '支付中...' });

    setTimeout(() => {
      wx.hideLoading();
      
      const payAmount = Number(totalAmountStr);
      const currentTotalSpend = app.globalData.totalSpend || 0;

      // 1. 更新全局消费累计 (触发会员升级)
      const newTotalSpend = currentTotalSpend + payAmount;
      app.globalData.totalSpend = newTotalSpend;
      wx.setStorageSync('totalSpend', newTotalSpend);

      // 2. 计算本单积分 (基于实付金额)
      const earnedPoints = MemberManager.calculatePoints(payAmount, currentTotalSpend); 
      // 这里可以将积分加到积分管理器中，如果 PointManager 支持 addPoints
      // 此处仅做展示或存入订单

      // 3. 标记优惠券已使用
      if (this.data.selectedCoupon) {
        const couponId = this.data.selectedCoupon.id;
        const allCoupons = wx.getStorageSync('myCoupons') || [];
        const newCoupons = allCoupons.map((c: any) => {
          if (c.id === couponId) return { ...c, status: 1 };
          return c;
        });
        wx.setStorageSync('myCoupons', newCoupons);
        wx.removeStorageSync('selectedCoupon');
        this.setData({ selectedCoupon: null });
      }

      // 4. 创建订单
      const newOrder = {
        id: Date.now(),
        status: 1, // 待发货
        items: items,
        total: totalAmountStr,
        pointsEarned: earnedPoints,
        createTime: new Date().toLocaleString(),
        orderNo: 'ORD' + Date.now()
      };

      const orders = wx.getStorageSync('myOrders') || [];
      orders.unshift(newOrder);
      wx.setStorageSync('myOrders', orders);

      // 5. 清理购物车
      const remainingCart = this.data.cartList.filter(item => !item.selected);
      this.setData({ 
        cartList: remainingCart,
        selectedCount: 0,
        finalPrice: '0',
        totalPrice: '0',
        discountAmount: '0',
        hasDiscount: false,
        isEditMode: false
      });
      wx.setStorageSync('myCart', remainingCart);

      // 6. 反馈
      wx.showToast({ 
        title: `支付成功 +${earnedPoints}积分`, 
        icon: 'none',
        duration: 2000 
      });
      
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/orders/orders?type=2' });
      }, 1500);

    }, 1000);
  }
});