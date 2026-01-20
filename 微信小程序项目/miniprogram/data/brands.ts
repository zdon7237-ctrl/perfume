// miniprogram/data/brands.ts

export interface BrandItem {
  name: string;
  logo: string;
  letter: string; // 用于排序的分组首字母 (A, B, C...)
}

export interface CategoryData {
  id: string;
  name: string;
  items: BrandItem[];
}

export const brandCategories: CategoryData[] = [
  {
    id: 'hot',
    name: '热门推荐',
    items: [
      { name: "Roja Dove", letter: "R", logo: "/images/roja_logo.jpg" },
      { name: "Frederic Malle", letter: "F", logo: "/images/fm_logo.jpg" },
      { name: "Sultan Pasha", letter: "S", logo: "/images/sultan_logo.jpg" },
      { name: "Le Labo", letter: "L", logo: "" },
      { name: "Byredo", letter: "B", logo: "" },
      { name: "观夏", letter: "G", logo: "" }
    ]
  },
  {
    id: 'foreign',
    name: '国外沙龙',
    items: [
      { name: "Acqua di Parma", letter: "A", logo: "" },
      { name: "Atelier Cologne", letter: "A", logo: "" },
      { name: "Byredo", letter: "B", logo: "" },
      { name: "Creed", letter: "C", logo: "" },
      { name: "Diptyque", letter: "D", logo: "" },
      { name: "Frederic Malle", letter: "F", logo: "/images/fm_logo.jpg" },
      { name: "Jo Malone", letter: "J", logo: "" },
      { name: "Le Labo", letter: "L", logo: "" },
      { name: "L'Artisan", letter: "L", logo: "/images/lartisan_logo.jpg" },
      { name: "Maison Margiela", letter: "M", logo: "" },
      { name: "Penhaligon's", letter: "P", logo: "" },
      { name: "Roja Dove", letter: "R", logo: "/images/roja_logo.jpg" },
      { name: "Serge Lutens", letter: "S", logo: "" },
      { name: "Tom Ford", letter: "T", logo: "" }
    ]
  },
  {
    id: 'chinese',
    name: '中国沙龙',
    items: [
      { name: "Document (文档)", letter: "D", logo: "" },
      { name: "馥生六记", letter: "F", logo: "" },
      { name: "观夏 (To Summer)", letter: "G", logo: "" },
      { name: "Melt Season", letter: "M", logo: "" },
      { name: "五朵里 (Wuduo)", letter: "W", logo: "" }
    ]
  }
];