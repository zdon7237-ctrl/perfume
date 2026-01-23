// miniprogram/pages/cart/cart.ts
import { IAppOption } from '../../app';
import { MemberManager } from '../../utils/memberManager';
import { PointManager } from '../../utils/pointManager';

const app = getApp<IAppOption>();

Page({
  data: {
    cartList: [] as any[],
    isAllSelected: false,
    isEditMode: false,
    originalPrice: '0.00',
    totalPrice: '0.00',
    discountAmount: '0.00',
    memberSavings: '0.00',
    finalPrice: '0.00',
    selectedCount: 0,
    selectedCoupon: null as any,
    hasDiscount: false
  },

  onShow() { this.initData(); },

  initData() {
    const cart = wx.getStorageSync('myCart') || [];
    const coupon = wx.getStorageSync('selectedCoupon') || null;
    // 初始化 x 坐标用于滑动删除
    const formattedCart = cart.map((item: any) => ({ ...item, x: 0 }));
    this.setData({ cartList: formattedCart, selectedCoupon: coupon });
    this.calculateTotal();
  },

  toggleEditMode() { this.setData({ isEditMode: !this.data.isEditMode }); },

  toggleSelect(e: any) {
    const index = e.currentTarget.dataset.index;
    const key = `cartList[${index}].selected`;
    this.setData({ [key]: !this.data.cartList[index].selected });
    this.calculateTotal();
  },

  toggleAll() {
    const isAll = !this.data.isAllSelected;
    const newList = this.data.cartList.map(item => ({ ...item, selected: isAll }));
    this.setData({ cartList: newList, isAllSelected: isAll });
    this.calculateTotal();
  },

  updateQuantity(e: any) {
    const { index, type } = e.currentTarget.dataset;
    const list = this.data.cartList;
    if (type === 'minus') {
      if (list[index].quantity > 1) list[index].quantity--;
      else return;
    } else {
      list[index].quantity++;
    }
    this.setData({ cartList: list });
    wx.setStorageSync('myCart', list);
    this.calculateTotal();
  },

  deleteItem(e: any) {
    const index = e.currentTarget.dataset.index;
    const list = this.data.cartList;
    list.splice(index, 1);
    this.setData({ cartList: list });
    wx.setStorageSync('myCart', list);
    this.calculateTotal();
    if (list.length === 0) this.setData({ isEditMode: false });
  },

  batchDelete() {
    // 简单的批量删除逻辑
    const list = this.data.cartList.filter(item => !item.selected);
    this.setData({ cartList: list, isAllSelected: false });
    wx.setStorageSync('myCart', list);
    this.calculateTotal();
  },

  goToCoupons() { wx.navigateTo({ url: '/pages/coupons/coupons?source=cart' }); },

  // === 核心计算逻辑 ===
  calculateTotal() {
    const list = this.data.cartList;
    const coupon = this.data.selectedCoupon;
    const totalSpend = app.globalData.totalSpend || 0;

    let totalOrigin = 0;   
    let totalMember = 0;   
    let selectedCount = 0;
    let isAll = list.length > 0;

    // 用于计算优惠券门槛的金额 (符合品牌限制的商品总价)
    let eligibleAmount = 0; 

    list.forEach(item => {
      if (item.selected) {
        selectedCount++;
        totalOrigin += item.price * item.quantity;

        // 1. 计算单品实际售价 (会员价 or 原价)
        let unitPrice = item.price;
        // 如果商品允许折扣，则计算会员价
        if (item.allowMemberDiscount !== false) {
           unitPrice = MemberManager.calculateDiscountPrice(item.price, totalSpend);
        }
        
        // 累加到订单总会员价
        totalMember += unitPrice * item.quantity;

        // 2. 检查该商品是否符合当前优惠券的品牌限制
        let isCouponEligible = true;
        if (coupon && coupon.limitBrands && coupon.limitBrands.length > 0) {
          // 只要商品品牌包含任意一个限制词，就算匹配
          const match = coupon.limitBrands.some((brandKey: string) => 
            item.brand.includes(brandKey)
          );
          if (!match) isCouponEligible = false;
        }

        // 如果符合券的限制，计入“可用券金额”
        if (isCouponEligible) {
          eligibleAmount += unitPrice * item.quantity;
        }

      } else {
        isAll = false;
      }
    });

    if (list.length === 0) isAll = false;

    // 3. 计算优惠券抵扣额
    let couponDiscount = 0;
    if (coupon) {
      // 只有当“符合条件的商品总额”达到门槛
      if (eligibleAmount >= coupon.min) {
        if (coupon.type === 'cash') {
          couponDiscount = coupon.value;
        } else if (coupon.type === 'discount') {
           // 折扣券：只针对符合条件的金额打折
           if (coupon.value < 1) {
             couponDiscount = eligibleAmount * (1 - coupon.value);
           }
        }
      }
    }

    // 防止负数
    let final = totalMember - couponDiscount;
    if (final < 0) final = 0;

    const fmt = (n: number) => n.toFixed(2);

    this.setData({
      isAllSelected: isAll,
      selectedCount: selectedCount,
      originalPrice: fmt(totalOrigin),
      totalPrice: fmt(totalMember),
      discountAmount: fmt(couponDiscount),
      memberSavings: fmt(totalOrigin - totalMember),
      finalPrice: fmt(final),
      hasDiscount: couponDiscount > 0
    });
  },

  onCheckout() {
    if (Number(this.data.finalPrice) <= 0 && this.data.selectedCount === 0) {
       wx.showToast({ title: '请选择商品', icon: 'none' });
       return;
    }
    
    // 模拟支付与积分逻辑
    const payAmount = Number(this.data.finalPrice);
    const currentTotalSpend = app.globalData.totalSpend || 0;
    
    // 增加积分
    const points = MemberManager.calculatePoints(payAmount, currentTotalSpend);
    if(points > 0) PointManager.addPoints(points, '购物获得');
    
    // 增加消费额
    const newSpend = currentTotalSpend + payAmount;
    app.globalData.totalSpend = newSpend;
    wx.setStorageSync('totalSpend', newSpend);
    
    // 核销优惠券
    if (this.data.selectedCoupon) {
       const allCoupons = wx.getStorageSync('myCoupons') || [];
       const updated = allCoupons.map((c:any) => 
         c.id === this.data.selectedCoupon.id ? {...c, status: 1} : c
       );
       wx.setStorageSync('myCoupons', updated);
       wx.removeStorageSync('selectedCoupon');
    }

    // 清空购物车选中项
    const remaining = this.data.cartList.filter(item => !item.selected);
    wx.setStorageSync('myCart', remaining);
    
    wx.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => {
       wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  }
});