export type CatalogMedia = {
  id: string;
  src: string;
  alt: string;
};

export type CatalogOption = {
  id: string;
  label: string;
  representativeMediaId: string;
  media: [CatalogMedia, ...CatalogMedia[]];
};

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  collection: string;
  category: "tile" | "big-slab";
  coverMedia?: CatalogMedia;
  defaultOptionId: string;
  price: string;
  numericPrice: number | null;
  badge?: "NEW" | "MD PICK";
  options: [CatalogOption, ...CatalogOption[]];
  sizes: string[];
  colors: string[];
  patterns: string[];
  surfaces: string[];
  uses: string[];
  styles: string[];
  thicknesses?: string[];
  createdOrder: number;
};

const ivory = "/images/products/travertine-slab-ivory.png";
const silver = "/images/products/travertine-slab-silver.png";
const terrazzo = "/images/products/tile-warm-terrazzo.png";
const green = "/images/products/tile-forest-marble.png";
const greige = "/images/products/tile-greige-concrete.png";
const black = "/images/products/tile-charcoal-slate.png";

function createOption(
  id: string,
  label: string,
  src: string,
  alt: string,
): CatalogOption {
  const representativeMediaId = `${id}-representative`;
  return {
    id,
    label,
    representativeMediaId,
    media: [{ id: representativeMediaId, src, alt }],
  };
}

export function getRepresentativeMedia(option: CatalogOption) {
  return (
    option.media.find((item) => item.id === option.representativeMediaId) ??
    option.media[0]
  );
}

const stoneOptions: [CatalogOption, ...CatalogOption[]] = [
  createOption("ivory", "아이보리", ivory, "아이보리 트래버틴 타일"),
  createOption("silver", "실버", silver, "실버 트래버틴 타일"),
];

const neutralOptions: [CatalogOption, ...CatalogOption[]] = [
  createOption("greige", "그레이지", greige, "그레이지 콘크리트 타일"),
  createOption("black", "차콜", black, "차콜 스톤 타일"),
];

const materialOptions: [CatalogOption, ...CatalogOption[]] = [
  createOption("ivory", "아이보리", ivory, "아이보리 트래버틴 타일"),
  createOption("silver", "실버", silver, "실버 트래버틴 타일"),
  createOption("greige", "그레이지", greige, "그레이지 콘크리트 타일"),
  createOption("verde", "베르데", green, "베르데 마블 타일"),
  createOption("charcoal", "차콜", black, "차콜 스톤 타일"),
  createOption("terrazzo", "테라조", terrazzo, "웜 테라조 타일"),
];

type CatalogProductSeed = Omit<
  CatalogProduct,
  "coverMedia" | "defaultOptionId" | "options"
> & {
  image: string;
  alt: string;
  options?: CatalogProduct["options"];
  coverMedia?: CatalogMedia;
};

const catalogProductSeeds: CatalogProductSeed[] = [
  {
    id: "terra-ivory-600",
    name: "트래버틴 아이보리 포세린 타일",
    brand: "LOMEN",
    collection: "TERRA LINE",
    category: "tile",
    image: ivory,
    alt: "따뜻한 아이보리 트래버틴 무늬 포세린 타일",
    price: "29,000원 ~ 34,000원",
    numericPrice: 29000,
    options: materialOptions,
    sizes: ["600×600", "600×1200"],
    colors: ["아이보리", "그레이"],
    patterns: ["스톤"],
    surfaces: ["무광"],
    uses: ["벽·바닥"],
    styles: ["포세린"],
    createdOrder: 3,
  },
  {
    id: "atelier-terrazzo-600",
    name: "아틀리에 웜 테라조 타일",
    brand: "MATERA",
    collection: "ATELIER",
    category: "tile",
    image: terrazzo,
    alt: "잔잔한 골재가 섞인 웜 그레이 테라조 타일",
    price: "24,000원",
    numericPrice: 24000,
    badge: "NEW",
    sizes: ["600×600"],
    colors: ["베이지", "그레이"],
    patterns: ["테라조"],
    surfaces: ["무광"],
    uses: ["벽·바닥"],
    styles: ["포세린"],
    createdOrder: 12,
  },
  {
    id: "clay-greige-600",
    name: "클레이 그레이지 콘크리트 타일",
    brand: "NORU",
    collection: "CLAY",
    category: "tile",
    image: greige,
    alt: "부드러운 그레이지 콘크리트 질감의 타일",
    price: "21,500원 ~ 27,000원",
    numericPrice: 21500,
    options: neutralOptions,
    sizes: ["300×600", "600×600"],
    colors: ["베이지", "그레이"],
    patterns: ["콘크리트"],
    surfaces: ["소프트 매트"],
    uses: ["벽·바닥"],
    styles: ["포세린"],
    createdOrder: 8,
  },
  {
    id: "noir-slate-600",
    name: "누아르 슬레이트 논슬립 타일",
    brand: "MATERA",
    collection: "NOIR",
    category: "tile",
    image: black,
    alt: "층리 질감이 보이는 차콜 블랙 슬레이트 타일",
    price: "32,000원",
    numericPrice: 32000,
    sizes: ["600×600"],
    colors: ["블랙"],
    patterns: ["스톤"],
    surfaces: ["논슬립"],
    uses: ["바닥"],
    styles: ["포세린"],
    createdOrder: 7,
  },
  {
    id: "verde-marble-600",
    name: "베르데 마블 폴리싱 타일",
    brand: "LOMEN",
    collection: "VERDE",
    category: "tile",
    image: green,
    alt: "옅은 결이 흐르는 짙은 녹색 마블 타일",
    price: "38,000원 ~ 46,000원",
    numericPrice: 38000,
    sizes: ["600×600", "600×1200"],
    colors: ["컬러"],
    patterns: ["마블"],
    surfaces: ["유광"],
    uses: ["벽·바닥"],
    styles: ["폴리싱"],
    createdOrder: 10,
  },
  {
    id: "milk-wall-3060",
    name: "밀크 화이트 세라믹 벽타일",
    brand: "SEN",
    collection: "MILK",
    category: "tile",
    image: ivory,
    alt: "잔잔한 아이보리 결이 있는 밝은 벽타일",
    price: "18,000원",
    numericPrice: 18000,
    sizes: ["300×600"],
    colors: ["화이트", "아이보리"],
    patterns: ["솔리드"],
    surfaces: ["유광"],
    uses: ["벽"],
    styles: ["도기질"],
    createdOrder: 2,
  },
  {
    id: "silver-stone-600",
    name: "실버 스톤 포세린 타일",
    brand: "NORU",
    collection: "SILVA",
    category: "tile",
    image: silver,
    alt: "은은한 회색 천연석 결의 포세린 타일",
    price: "가격 문의",
    numericPrice: null,
    sizes: ["600×600"],
    colors: ["그레이"],
    patterns: ["스톤"],
    surfaces: ["무광"],
    uses: ["벽·바닥"],
    styles: ["포세린"],
    createdOrder: 5,
  },
  {
    id: "micro-terrazzo-300",
    name: "마이크로 테라조 모자이크 타일",
    brand: "SEN",
    collection: "MICRO",
    category: "tile",
    image: terrazzo,
    alt: "작은 골재 무늬의 베이지 모자이크 타일",
    price: "15,500원",
    numericPrice: 15500,
    sizes: ["300×300"],
    colors: ["베이지"],
    patterns: ["테라조"],
    surfaces: ["무광"],
    uses: ["벽·바닥"],
    styles: ["모자이크"],
    createdOrder: 9,
  },
  {
    id: "verde-slab-1224",
    name: "베르데 알피 빅슬랩",
    brand: "LOMEN",
    collection: "VERDE",
    category: "big-slab",
    image: green,
    alt: "깊은 녹색과 밝은 결이 대비되는 마블 빅슬랩",
    price: "가격 문의",
    numericPrice: null,
    badge: "NEW",
    sizes: ["1200×2400", "1600×3200"],
    thicknesses: ["6mm", "12mm"],
    colors: ["컬러"],
    patterns: ["마블"],
    surfaces: ["유광"],
    uses: ["벽", "상판"],
    styles: [],
    createdOrder: 11,
  },
  {
    id: "terra-slab-1226",
    name: "테라 아이보리 빅슬랩",
    brand: "LOMEN",
    collection: "TERRA LINE",
    category: "big-slab",
    image: ivory,
    alt: "아이보리 트래버틴 결의 대형 세라믹 슬랩",
    price: "74,000원 ~ 92,000원",
    numericPrice: 74000,
    options: stoneOptions,
    sizes: ["1200×2600"],
    thicknesses: ["6mm", "9mm"],
    colors: ["아이보리", "그레이"],
    patterns: ["스톤"],
    surfaces: ["무광"],
    uses: ["벽", "상판", "가구 마감"],
    styles: [],
    createdOrder: 6,
  },
  {
    id: "noir-slab-1632",
    name: "누아르 스톤 빅슬랩",
    brand: "MATERA",
    collection: "NOIR",
    category: "big-slab",
    image: black,
    alt: "차콜 블랙 슬레이트 질감의 대형 세라믹 슬랩",
    price: "가격 문의",
    numericPrice: null,
    sizes: ["1600×3200"],
    thicknesses: ["12mm"],
    colors: ["블랙"],
    patterns: ["스톤"],
    surfaces: ["무광"],
    uses: ["벽", "상판"],
    styles: [],
    createdOrder: 4,
  },
  {
    id: "greige-slab-1224",
    name: "모노 그레이지 빅슬랩",
    brand: "NORU",
    collection: "MONO",
    category: "big-slab",
    image: greige,
    alt: "차분한 그레이지 콘크리트 질감의 빅슬랩",
    price: "89,000원 ~ 118,000원",
    numericPrice: 89000,
    sizes: ["1200×2400"],
    thicknesses: ["6mm", "9mm"],
    colors: ["베이지", "그레이"],
    patterns: ["콘크리트"],
    surfaces: ["소프트 매트"],
    uses: ["벽", "바닥", "가구 마감"],
    styles: [],
    createdOrder: 1,
  },
];

export const catalogProducts: CatalogProduct[] = catalogProductSeeds.map(
  ({ image, alt, options: seedOptions, ...product }) => {
    const options = seedOptions ?? [
      createOption(
        `${product.id}-default`,
        product.colors[0] ?? "기본",
        image,
        alt,
      ),
    ];
    return {
      ...product,
      defaultOptionId: options[0].id,
      options,
    };
  },
);
