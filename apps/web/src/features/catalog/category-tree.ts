export type ShopCategory = {
  title: string;
  href?: string;
  items: readonly {
    label: string;
    href?: string;
  }[];
};

export const SHOP_CATEGORIES: readonly ShopCategory[] = [
  {
    title: "타일",
    href: "/shop/tile?type=tile",
    items: [
      { label: "타일", href: "/shop/tile?type=tile" },
      { label: "빅슬랩", href: "/shop/tile?type=big-slab" },
    ],
  },
  {
    title: "수전",
    items: [
      { label: "세면 수전" },
      { label: "주방 수전" },
      { label: "샤워·욕조 수전" },
    ],
  },
  {
    title: "조명",
    items: [
      { label: "펜던트 조명" },
      { label: "천장 조명" },
      { label: "벽 조명" },
    ],
  },
] as const;
