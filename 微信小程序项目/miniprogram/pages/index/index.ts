// 引入刚才定义的接口和数据
import { perfumeList, PerfumeItem } from '../../data/perfumes';

Page({
  // 定义页面数据的类型
  data: {
    perfumes: [] as PerfumeItem[] 
  },

  onLoad() {
    // 页面加载时，把数据塞进去
    this.setData({
      perfumes: perfumeList
    });
    console.log('香水数据已加载', this.data.perfumes);
  },
})