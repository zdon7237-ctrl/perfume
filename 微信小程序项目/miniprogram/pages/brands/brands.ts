// miniprogram/pages/brands/brands.ts
import { brandCategories, BrandItem } from '../../data/brands';

Page({
  data: {
    categories: brandCategories,
    curIndex: 0,            // 当前选中的左侧菜单索引
    currentList: [] as BrandItem[], // 当前右侧要展示的列表
    scrollTop: 0,           // 控制右侧滚动条回顶
    searchQuery: '',        // 搜索关键词
    isSearching: false      // 是否处于搜索状态
  },

  onLoad() {
    // 初始化显示第一个分类的数据
    this.updateRightList(0);
  },

  // 切换左侧分类
  switchCategory(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    
    // 如果处于搜索状态，先退出搜索状态
    if (this.data.isSearching) {
      this.setData({
        isSearching: false,
        searchQuery: '', // 清空搜索框
        curIndex: index,
        scrollTop: 0
      });
      this.updateRightList(index);
      return;
    }

    if (this.data.curIndex === index) return;

    this.setData({
      curIndex: index,
      scrollTop: 0
    });

    this.updateRightList(index);
  },

  // 更新右侧数据：显示指定分类下的品牌
  updateRightList(index: number) {
    const rawItems = this.data.categories[index].items;
    this.setData({ currentList: rawItems });
  },

  // --- 新增：搜索输入监听 ---
  onSearchInput(e: WechatMiniprogram.Input) {
    const query = e.detail.value.trim();
    
    this.setData({ searchQuery: query });

    if (!query) {
      // 如果清空了搜索，恢复显示当前选中的分类
      this.setData({ isSearching: false });
      this.updateRightList(this.data.curIndex);
      return;
    }

    // 开始全局搜索
    this.setData({ isSearching: true, scrollTop: 0 });
    this.doLocalSearch(query);
  },

  // --- 新增：执行本地搜索 ---
  doLocalSearch(keyword: string) {
    const lowerKey = keyword.toLowerCase();
    let results: BrandItem[] = [];

    // 遍历所有分类，找出匹配的品牌
    this.data.categories.forEach(cat => {
      const matches = cat.items.filter(item => 
        item.name.toLowerCase().includes(lowerKey)
      );
      // 把匹配的加入结果（去重逻辑可视情况添加，这里简单追加）
      results = results.concat(matches);
    });

    // 简单的去重（防止"热门"和"国外"里有同一个品牌出现两次）
    const uniqueResults = Array.from(new Set(results.map(b => b.name)))
      .map(name => results.find(b => b.name === name)!);

    this.setData({ currentList: uniqueResults });
  },

  // --- 新增：清空搜索 ---
  onClearSearch() {
    this.setData({ 
      searchQuery: '',
      isSearching: false
    });
    // 恢复原来的分类视图
    this.updateRightList(this.data.curIndex);
  },

  // 点击具体品牌 -> 跳转逻辑不变
  onBrandClick(e: WechatMiniprogram.TouchEvent) {
    const brandName = e.currentTarget.dataset.name;
    const realName = brandName.split('(')[0].trim();

    wx.setStorageSync('tempSearchFilter', realName);
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  goToCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  }
});