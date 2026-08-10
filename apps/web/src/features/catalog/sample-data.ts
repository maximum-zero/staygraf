export type Product = {
  id: string;
  brand: string;
  collection: string;
  name: string;
  image: string;
  alt: string;
  price: string;
  badge?: "NEW" | "MD PICK";
  options?: ProductOption[];
};

export type ProductOption = {
  id: string;
  label: string;
  image: string;
  alt: string;
};

export type Graf = {
  slug: string;
  title: string;
  summary: string;
  spaceType: string;
  area: string;
  contractor: string;
  contractorInitial: string;
  image: string;
  alt: string;
  products: Product[];
  scenes: GrafScene[];
};

export type GrafScene = {
  id: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  markers: Array<{
    productId: string;
    left: string;
    top: string;
  }>;
};

export const products: Product[] = [
  {
    id: "terra-line-ivory",
    brand: "LOMEN",
    collection: "TERRA LINE",
    name: "아이보리 트래버틴 빅슬랩",
    image: "/images/products/travertine-slab-ivory.png",
    alt: "아이보리색 트래버틴 무늬의 대형 타일 샘플",
    price: "74,000원 ~ 92,000원",
    badge: "MD PICK",
    options: [
      {
        id: "ivory",
        label: "아이보리",
        image: "/images/products/travertine-slab-ivory.png",
        alt: "아이보리 트래버틴 옵션",
      },
      {
        id: "silver",
        label: "실버",
        image: "/images/products/travertine-slab-silver.png",
        alt: "실버 트래버틴 옵션",
      },
    ],
  },
  {
    id: "arc-basin-120",
    brand: "VERO",
    collection: "ARC",
    name: "브러시드 브론즈 세면 수전",
    image: "/images/products/basin-faucet-brushed-bronze.png",
    alt: "브러시드 브론즈 마감의 세면 수전",
    price: "248,000원 ~ 318,000원",
    badge: "NEW",
    options: [
      {
        id: "bronze",
        label: "브러시드 브론즈",
        image: "/images/products/basin-faucet-brushed-bronze.png",
        alt: "브러시드 브론즈 수전 옵션",
      },
      {
        id: "matte-black",
        label: "매트 블랙",
        image: "/images/products/basin-faucet-matte-black.png",
        alt: "매트 블랙 수전 옵션",
      },
    ],
  },
  {
    id: "flow-kitchen-420",
    brand: "VERO",
    collection: "FLOW",
    name: "브러시드 스틸 키친 수전",
    image: "/images/products/kitchen-faucet-brushed-steel.png",
    alt: "브러시드 스틸 마감의 곡선형 주방 수전",
    price: "389,000원",
  },
  {
    id: "orb-pendant-250",
    brand: "LUUM",
    collection: "ORB",
    name: "오팔 글로브 펜던트 250",
    image: "/images/products/opal-globe-pendant.png",
    alt: "유백색 구형 유리 펜던트 조명",
    price: "286,000원 ~ 356,000원",
    options: [
      {
        id: "opal",
        label: "오팔 화이트",
        image: "/images/products/opal-globe-pendant.png",
        alt: "오팔 화이트 글로브 옵션",
      },
      {
        id: "smoke",
        label: "스모크 글라스",
        image: "/images/products/opal-globe-pendant-smoke.png",
        alt: "스모크 글라스 글로브 옵션",
      },
    ],
  },
  {
    id: "line-03-pendant",
    brand: "LUUM",
    collection: "LINE",
    name: "리니어 실린더 펜던트 03",
    image: "/images/products/linear-cylinder-pendant.png",
    alt: "세 개의 검은 실린더형 펜던트 조명",
    price: "가격 문의",
  },
];

export const grafs: Graf[] = [
  {
    slug: "warm-stone-living",
    title: "빛이 오래 머무는 스톤 리빙",
    summary:
      "따뜻한 석재의 결을 중심으로 낮의 빛과 가구의 밀도를 차분하게 조율한 거실입니다.",
    spaceType: "아파트 · 거실",
    area: "32평",
    contractor: "스튜디오 모노",
    contractorInitial: "M",
    image: "/images/pilots/graf-01-living.png",
    alt: "자연광이 드는 따뜻한 석재 마감의 현대적인 거실",
    products: [products[0], products[3], products[4]],
    scenes: [
      {
        id: "living-wide",
        image: "/images/pilots/graf-01-living.png",
        width: 1536,
        height: 1024,
        alt: "자연광이 드는 따뜻한 석재 마감의 현대적인 거실 전체",
        caption: "거실에서 다이닝까지 이어지는 석재 바닥과 낮은 가구의 균형",
        markers: [
          { productId: "terra-line-ivory", left: "54%", top: "76%" },
          { productId: "orb-pendant-250", left: "73%", top: "29%" },
        ],
      },
      {
        id: "living-detail",
        image: "/images/pilots/graf-01-living-detail.png",
        width: 1536,
        height: 1024,
        alt: "곡선형 소파와 오크 수납, 오팔 펜던트를 가까이 담은 거실",
        caption: "부드러운 곡선과 오크, 빛의 온도를 맞춘 생활 공간",
        markers: [{ productId: "line-03-pendant", left: "61%", top: "22%" }],
      },
      {
        id: "living-portrait",
        image: "/images/pilots/graf-01-living-portrait.png",
        width: 1122,
        height: 1402,
        alt: "석재 바닥과 곡선형 소파, 오팔 펜던트를 세로 구도로 담은 거실",
        caption: "공간의 높이와 바닥 재료를 함께 담은 세로 시공 사진",
        markers: [
          { productId: "terra-line-ivory", left: "65%", top: "76%" },
          { productId: "orb-pendant-250", left: "84%", top: "31%" },
        ],
      },
    ],
  },
  {
    slug: "quiet-sand-bath",
    title: "모래빛 질감으로 정돈한 배스",
    summary:
      "차분한 베이지 타일과 브론즈 수전으로 촉감이 느껴지는 욕실을 완성했습니다.",
    spaceType: "아파트 · 욕실",
    area: "28평",
    contractor: "결 스페이스",
    contractorInitial: "G",
    image: "/images/pilots/graf-02-bathroom.png",
    alt: "베이지 타일과 브론즈 수전으로 마감한 욕실",
    products: [products[0], products[1]],
    scenes: [
      {
        id: "bath-wide",
        image: "/images/pilots/graf-02-bathroom.png",
        width: 1536,
        height: 1024,
        alt: "베이지 타일과 브론즈 수전으로 마감한 욕실 전체",
        caption: "큰 면의 타일과 브론즈 금속을 절제해 배치한 욕실",
        markers: [
          { productId: "terra-line-ivory", left: "58%", top: "31%" },
          { productId: "arc-basin-120", left: "73%", top: "55%" },
        ],
      },
      {
        id: "bath-detail",
        image: "/images/pilots/graf-02-bathroom-detail.png",
        width: 1536,
        height: 1024,
        alt: "베이지 타일과 브론즈 수전의 질감을 가까이 담은 욕실",
        caption: "타일 줄눈과 금속 마감이 만나는 세면 공간의 디테일",
        markers: [{ productId: "arc-basin-120", left: "84%", top: "56%" }],
      },
    ],
  },
  {
    slug: "soft-metal-kitchen",
    title: "부드러운 금속과 오크의 키친",
    summary:
      "결이 고운 오크와 차가운 금속의 대비를 자연광 안에서 부드럽게 연결한 주방입니다.",
    spaceType: "주택 · 주방",
    area: "41평",
    contractor: "레이어드 룸",
    contractorInitial: "L",
    image: "/images/pilots/graf-03-kitchen.png",
    alt: "오크 수납장과 스테인리스 수전이 있는 밝은 주방",
    products: [products[2], products[3]],
    scenes: [
      {
        id: "kitchen-wide",
        image: "/images/pilots/graf-03-kitchen.png",
        width: 1537,
        height: 1023,
        alt: "오크 수납장과 스테인리스 수전이 있는 밝은 주방 전체",
        caption: "오크 수납과 차가운 금속을 자연광으로 부드럽게 연결한 주방",
        markers: [
          { productId: "flow-kitchen-420", left: "48%", top: "54%" },
          { productId: "orb-pendant-250", left: "55%", top: "13%" },
        ],
      },
      {
        id: "kitchen-detail",
        image: "/images/pilots/graf-03-kitchen-detail.png",
        width: 1537,
        height: 1023,
        alt: "석재 아일랜드와 스틸 수전, 오크 수납을 가까이 담은 주방",
        caption: "자주 닿는 수전과 작업대의 재료감을 가까이서 확인한 장면",
        markers: [{ productId: "flow-kitchen-420", left: "67%", top: "55%" }],
      },
    ],
  },
];

export function getGraf(slug: string) {
  return grafs.find((graf) => graf.slug === slug);
}
