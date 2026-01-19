// miniprogram/data/perfumes.ts

export interface PerfumeItem {
  id: number;
  brand: string; 
  name: string;  
  desc: string;  
  price: number; 
  priceStr: string; 
  sales: number; 
  isNew: boolean; 
  tags: string[]; 
  image: string; 
  stock: number; // 【新增】库存字段
}

export const allPerfumes: PerfumeItem[] = [
  {
    id: 1,
    brand: "Roja Dove",
    name: "Diaghilev",
    desc: "宏大的西普调，俄罗斯芭蕾的致敬之作。",
    price: 8500,
    priceStr: "¥8,500",
    sales: 120,
    isNew: false,
    tags: ["西普调", "浓香精"],
    image: "",
    stock: 3 // 【测试】库存紧张，应显示警告
  },
  {
    id: 2,
    brand: "Sultan Pasha",
    name: "Aurum d'Angkhor",
    desc: "极度奢华的沉香与藏红花，3ml纯香精。",
    price: 2100,
    priceStr: "¥2,100",
    sales: 45,
    isNew: true,
    tags: ["沉香", "以及"],
    image: "",
    stock: 12 // 库存充足
  },
  {
    id: 3,
    brand: "Fueguia 1833",
    name: "Muskara Phero J",
    desc: "费洛蒙与亚马逊植物的结合。",
    price: 2400,
    priceStr: "¥2,400",
    sales: 389,
    isNew: false,
    tags: ["伪体香", "麝香"],
    image: "",
    stock: 4 // 【测试】库存紧张
  },
  {
    id: 4,
    brand: "L'Artisan",
    name: "Passage d'Enfer",
    desc: "冥府之路，经典木质调。",
    price: 850,
    priceStr: "¥850",
    sales: 1200,
    isNew: false,
    tags: ["木质", "入门"],
    image: "",
    stock: 200
  },
  {
    id: 5,
    brand: "Frederic Malle",
    name: "Portrait of a Lady",
    desc: "贵妇肖像，广藿玫瑰的天花板。",
    price: 2680,
    priceStr: "¥2,680",
    sales: 600,
    isNew: true,
    tags: ["玫瑰", "广藿香"],
    image: "",
    stock: 1 // 【测试】极度紧张
  }
];