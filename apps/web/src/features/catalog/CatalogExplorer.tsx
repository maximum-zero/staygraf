"use client";

import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CatalogProductCard } from "./CatalogProductCard";
import { SHOP_CATEGORIES } from "./category-tree";
import type { CatalogProduct } from "./catalog-data";

type Category = "tile" | "big-slab";
type FilterKey =
  | "sizes"
  | "colors"
  | "patterns"
  | "surfaces"
  | "uses"
  | "styles"
  | "thicknesses"
  | "price"
  | "brand";
type Filters = Record<FilterKey, string[]>;

const EMPTY_FILTERS: Filters = {
  sizes: [],
  colors: [],
  patterns: [],
  surfaces: [],
  uses: [],
  styles: [],
  thicknesses: [],
  price: [],
  brand: [],
};
const FILTER_LABELS: Record<FilterKey, string> = {
  sizes: "규격",
  colors: "색상",
  patterns: "패턴",
  surfaces: "표면",
  uses: "용도",
  styles: "스타일",
  thicknesses: "두께",
  price: "가격 방식",
  brand: "브랜드",
};
const SORTS = [
  ["recommended", "추천순"],
  ["new", "신상품순"],
  ["low", "낮은 가격순"],
  ["high", "높은 가격순"],
] as const;

function parseFilters(params: URLSearchParams): Filters {
  return Object.fromEntries(
    Object.keys(EMPTY_FILTERS).map((key) => [key, params.getAll(key)]),
  ) as Filters;
}

export function CatalogExplorer({ products }: { products: CatalogProduct[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const category: Category =
    params.get("type") === "big-slab" ? "big-slab" : "tile";
  const applied = useMemo(
    () => parseFilters(new URLSearchParams(params.toString())),
    [params],
  );
  const sort = SORTS.some(([key]) => key === params.get("sort"))
    ? params.get("sort")!
    : "recommended";
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [openNavCategory, setOpenNavCategory] = useState("타일");
  const [openFilterGroups, setOpenFilterGroups] = useState<FilterKey[]>([
    "sizes",
  ]);
  const [draft, setDraft] = useState<Filters>(applied);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isFilterOpen) return;
    const root = document.documentElement;
    const triggerElement = filterTrigger.current;
    const background = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".site-header, .catalog-page > *:not(.catalog-filter-layer)",
      ),
    );
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    background.forEach((element) => {
      element.inert = true;
    });
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFilterOpen(false);
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button, input, [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      background.forEach((element) => {
        element.inert = false;
      });
      triggerElement?.focus();
    };
  }, [isFilterOpen]);

  const categoryProducts = products.filter(
    (product) => product.category === category,
  );
  const filterDefinitions = useMemo(() => {
    const keys: FilterKey[] =
      category === "tile"
        ? [
            "sizes",
            "uses",
            "styles",
            "colors",
            "patterns",
            "surfaces",
            "brand",
            "price",
          ]
        : [
            "sizes",
            "thicknesses",
            "uses",
            "colors",
            "patterns",
            "surfaces",
            "brand",
            "price",
          ];
    return keys.map((key) => ({
      key,
      label: FILTER_LABELS[key],
      values:
        key === "price"
          ? ["구매 가능", "가격 문의"]
          : [
              ...new Set(
                categoryProducts.flatMap((product) =>
                  key === "brand" ? [product.brand] : (product[key] ?? []),
                ),
              ),
            ],
    }));
  }, [category, categoryProducts]);

  const matchesFilters = (product: CatalogProduct, filters: Filters) =>
    Object.entries(filters).every(([rawKey, selected]) => {
      if (selected.length === 0) return true;
      const key = rawKey as FilterKey;
      const values =
        key === "price"
          ? [product.numericPrice === null ? "가격 문의" : "구매 가능"]
          : key === "brand"
            ? [product.brand]
            : (product[key] ?? []);
      return selected.some((value) => values.includes(value));
    });

  const filtered = categoryProducts
    .filter((product) => matchesFilters(product, applied))
    .toSorted((a, b) => {
      if (sort === "new") return b.createdOrder - a.createdOrder;
      if (sort === "low")
        return (a.numericPrice ?? Infinity) - (b.numericPrice ?? Infinity);
      if (sort === "high")
        return (b.numericPrice ?? -1) - (a.numericPrice ?? -1);
      return 0;
    });
  const draftCount = categoryProducts.filter((product) =>
    matchesFilters(product, draft),
  ).length;
  const appliedEntries = Object.entries(applied).flatMap(([key, values]) =>
    values.map((value) => ({ key: key as FilterKey, value })),
  );

  const writeParams = (
    nextFilters: Filters,
    nextSort = sort,
    nextCategory = category,
  ) => {
    const next = new URLSearchParams();
    next.set("type", nextCategory);
    Object.entries(nextFilters).forEach(([key, values]) =>
      values.forEach((value) => next.append(key, value)),
    );
    if (nextSort !== "recommended") next.set("sort", nextSort);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const toggleDraft = (key: FilterKey, value: string) =>
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  const toggleFilterGroup = (key: FilterKey) =>
    setOpenFilterGroups((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );

  return (
    <main className="catalog-page" id="main-content">
      <section className="catalog-main shell" aria-labelledby="catalog-title">
        <h1 className="sr-only" id="catalog-title">
          타일 {category === "big-slab" ? "빅슬랩" : "타일"} 상품
        </h1>

        <aside className="catalog-category-nav" aria-label="상품 카테고리">
          <h2>카테고리</h2>
          {SHOP_CATEGORIES.map((navCategory) => {
            const isOpen = openNavCategory === navCategory.title;
            return (
              <div key={navCategory.title}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenNavCategory(isOpen ? "" : navCategory.title)
                  }
                >
                  {navCategory.title}
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {isOpen && (
                  <ul>
                    {navCategory.items.map((item) => {
                      const isCurrent =
                        navCategory.title === "타일" &&
                        ((category === "tile" && item.label === "타일") ||
                          (category === "big-slab" && item.label === "빅슬랩"));
                      return (
                        <li key={item.label}>
                          {item.href ? (
                            <Link
                              className={isCurrent ? "is-current" : ""}
                              href={item.href}
                              aria-current={isCurrent ? "page" : undefined}
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <span aria-disabled="true">{item.label}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </aside>

        <div className="catalog-content">
          <nav className="catalog-breadcrumb" aria-label="현재 카테고리">
            <span>타일</span>
            <ChevronRight size={15} aria-hidden="true" />
            <strong>{category === "big-slab" ? "빅슬랩" : "타일"}</strong>
          </nav>

          <div className="catalog-toolbar">
            <span aria-live="polite">{filtered.length}개의 상품</span>
            <div className="catalog-toolbar__actions">
              <button
                ref={filterTrigger}
                type="button"
                onClick={() => {
                  setDraft(applied);
                  setIsFilterOpen(true);
                }}
              >
                <SlidersHorizontal size={17} /> 필터
                {appliedEntries.length > 0 && (
                  <strong>{appliedEntries.length}</strong>
                )}
              </button>
              <div className="catalog-sort">
                <button
                  type="button"
                  aria-expanded={isSortOpen}
                  onClick={() => setIsSortOpen((open) => !open)}
                >
                  {SORTS.find(([key]) => key === sort)?.[1]}{" "}
                  <ChevronDown size={16} />
                </button>
                {isSortOpen && (
                  <div className="catalog-sort__menu" role="menu">
                    {SORTS.map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        role="menuitemradio"
                        aria-checked={sort === key}
                        onClick={() => {
                          writeParams(applied, key);
                          setIsSortOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {appliedEntries.length > 0 && (
            <div className="catalog-applied" aria-label="적용된 필터">
              <div>
                {appliedEntries.map(({ key, value }) => (
                  <button
                    key={`${key}-${value}`}
                    type="button"
                    onClick={() =>
                      writeParams({
                        ...applied,
                        [key]: applied[key].filter((item) => item !== value),
                      })
                    }
                  >
                    {value} <X size={13} />
                  </button>
                ))}
              </div>
              <button
                className="catalog-applied__reset"
                type="button"
                onClick={() => writeParams(EMPTY_FILTERS)}
              >
                <RotateCcw size={14} /> 초기화
              </button>
            </div>
          )}

          {filtered.length > 0 ? (
            <div className="catalog-grid">
              {filtered.map((product, index) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <p>선택한 조건에 맞는 상품이 없습니다.</p>
              <button type="button" onClick={() => writeParams(EMPTY_FILTERS)}>
                초기화
              </button>
            </div>
          )}
        </div>
      </section>

      {isFilterOpen && (
        <div
          className="catalog-filter-layer"
          onMouseDown={() => setIsFilterOpen(false)}
        >
          <aside
            ref={panel}
            className="catalog-filter-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-filter-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 id="catalog-filter-title">필터</h2>
                <span>선택한 조건 {Object.values(draft).flat().length}개</span>
              </div>
              <button
                ref={closeButton}
                type="button"
                aria-label="필터 닫기"
                onClick={() => setIsFilterOpen(false)}
              >
                <X />
              </button>
            </header>
            <div className="catalog-filter-panel__body">
              {filterDefinitions.map((filter, index) => {
                const isOpen = openFilterGroups.includes(filter.key);
                const selectedCount = draft[filter.key].length;
                return (
                  <section
                    className={`catalog-filter-group${index === 2 || index === 5 ? " is-cluster-end" : ""}`}
                    key={filter.key}
                  >
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`catalog-filter-${filter.key}`}
                        onClick={() => toggleFilterGroup(filter.key)}
                      >
                        <span>{filter.label}</span>
                        <span>
                          {selectedCount > 0 && (
                            <strong aria-label={`${selectedCount}개 선택`}>
                              {selectedCount}
                            </strong>
                          )}
                          <ChevronDown size={17} aria-hidden="true" />
                        </span>
                      </button>
                    </h3>
                    {isOpen && (
                      <div
                        className="catalog-filter-options"
                        id={`catalog-filter-${filter.key}`}
                        role="group"
                        aria-label={filter.label}
                      >
                        {filter.values.map((value) => (
                          <label key={value}>
                            <input
                              type="checkbox"
                              checked={draft[filter.key].includes(value)}
                              onChange={() => toggleDraft(filter.key, value)}
                            />
                            <span>{value}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
            <footer>
              <button type="button" onClick={() => setDraft(EMPTY_FILTERS)}>
                초기화
              </button>
              <button
                type="button"
                onClick={() => {
                  writeParams(draft);
                  setIsFilterOpen(false);
                }}
              >
                {draftCount}개 상품 보기
              </button>
            </footer>
          </aside>
        </div>
      )}
    </main>
  );
}
