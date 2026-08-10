"use client";

import { ChevronDown, RotateCcw, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Graf } from "@/features/catalog/sample-data";
import { GrafCard } from "@/features/graf/GrafCard";

const SPACE_TYPES = ["전체", "거실", "주방", "욕실"] as const;
const BUILDING_TYPES = ["전체", "아파트", "주택"] as const;
const AREA_RANGES = ["전체", "30평 이하", "31~40평", "41평 이상"] as const;
const SORT_OPTIONS = [
  ["default", "기본순"],
  ["area-asc", "면적 낮은순"],
  ["area-desc", "면적 높은순"],
] as const;

type FilterName = "space" | "building" | "area" | "sort";

function areaNumber(area: string) {
  return Number.parseInt(area, 10);
}

function validValue<T extends readonly string[]>(
  value: string | null,
  options: T,
  fallback: T[number],
) {
  return options.includes(value as T[number]) ? (value as T[number]) : fallback;
}

export function GrafIndexExplorer({ grafs }: { grafs: Graf[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const space = validValue(searchParams.get("space"), SPACE_TYPES, "전체");
  const building = validValue(
    searchParams.get("building"),
    BUILDING_TYPES,
    "전체",
  );
  const area = validValue(searchParams.get("area"), AREA_RANGES, "전체");
  const sortKeys = SORT_OPTIONS.map(([key]) => key);
  const sort = validValue(searchParams.get("sort"), sortKeys, "default");
  const [openFilter, setOpenFilter] = useState<FilterName | null>(null);
  const filterBar = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const triggers = useRef<Partial<Record<FilterName, HTMLButtonElement>>>({});

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!filterBar.current?.contains(event.target as Node))
        setOpenFilter(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilter(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    if (!openFilter || !window.matchMedia("(max-width: 620px)").matches)
      return;
    const triggerElement = triggers.current[openFilter];
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLElement>("button")?.focus();

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>("button") ?? [],
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
    document.addEventListener("keydown", trapFocus);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", trapFocus);
      triggerElement?.focus();
    };
  }, [openFilter]);

  const filteredGrafs = useMemo(() => {
    const result = grafs.filter((graf) => {
      const [grafBuilding, grafSpace] = graf.spaceType.split(" · ");
      const size = areaNumber(graf.area);
      const matchesArea =
        area === "전체" ||
        (area === "30평 이하" && size <= 30) ||
        (area === "31~40평" && size >= 31 && size <= 40) ||
        (area === "41평 이상" && size >= 41);
      return (
        (space === "전체" || grafSpace === space) &&
        (building === "전체" || grafBuilding === building) &&
        matchesArea
      );
    });
    if (sort === "area-asc")
      return result.toSorted((a, b) => areaNumber(a.area) - areaNumber(b.area));
    if (sort === "area-desc")
      return result.toSorted((a, b) => areaNumber(b.area) - areaNumber(a.area));
    return result;
  }, [area, building, grafs, sort, space]);

  const hasConditions =
    space !== "전체" ||
    building !== "전체" ||
    area !== "전체" ||
    sort !== "default";

  const updateParams = (name?: FilterName, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!name) {
      ["space", "building", "area", "sort"].forEach((key) =>
        params.delete(key),
      );
    } else {
      const defaultValue = name === "sort" ? "default" : "전체";
      if (value === defaultValue) params.delete(name);
      else params.set(name, value ?? defaultValue);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setOpenFilter(null);
  };

  const chips: Array<{
    name: FilterName;
    label: string;
    value: string;
    options: readonly string[] | typeof SORT_OPTIONS;
  }> = [
    { name: "space", label: "공간 유형", value: space, options: SPACE_TYPES },
    { name: "building", label: "주거 유형", value: building, options: BUILDING_TYPES },
    { name: "area", label: "평수", value: area, options: AREA_RANGES },
    {
      name: "sort",
      label: "정렬",
      value: SORT_OPTIONS.find(([key]) => key === sort)?.[1] ?? "기본순",
      options: SORT_OPTIONS,
    },
  ];

  return (
    <section className="graf-index__content shell" aria-labelledby="graf-list-title">
      <div className="graf-index__heading">
        <h1 id="graf-list-title">공간 둘러보기</h1>
      </div>

      <div className="graf-filter-bar" ref={filterBar}>
        <div className="graf-filter-bar__scroll">
          {chips.map((chip) => {
            const isSelected =
              chip.name === "sort" ? sort !== "default" : chip.value !== "전체";
            return (
              <div className={`graf-filter-chip-wrap graf-filter-chip-wrap--${chip.name}`} key={chip.name}>
                <button
                  ref={(element) => {
                    if (element) triggers.current[chip.name] = element;
                  }}
                  type="button"
                  className={isSelected ? "graf-filter-chip is-selected" : "graf-filter-chip"}
                  aria-expanded={openFilter === chip.name}
                  aria-controls={`graf-filter-${chip.name}`}
                  onClick={() => setOpenFilter((open) => open === chip.name ? null : chip.name)}
                >
                  <span>{isSelected ? chip.value : chip.label}</span>
                  <ChevronDown size={15} />
                </button>
                {openFilter === chip.name && (
                  <>
                    <button
                      className="graf-filter-backdrop"
                      type="button"
                      aria-label={`${chip.label} 선택 닫기`}
                      onClick={() => setOpenFilter(null)}
                    />
                    <div
                      ref={dialog}
                      className="graf-filter-popover"
                      id={`graf-filter-${chip.name}`}
                      role="dialog"
                      aria-modal="true"
                      aria-label={`${chip.label} 선택`}
                    >
                      <div className="graf-filter-popover__header">
                        <strong>{chip.label}</strong>
                        <button type="button" aria-label={`${chip.label} 닫기`} onClick={() => setOpenFilter(null)}>
                          <X size={19} />
                        </button>
                      </div>
                      <div className="graf-filter-options">
                        {chip.options.map((option) => {
                          const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option];
                          const current = chip.name === "sort" ? sort : chip.value;
                          return (
                            <button
                              type="button"
                              key={optionValue}
                              aria-pressed={current === optionValue}
                              onClick={() => updateParams(chip.name, optionValue)}
                            >
                              {optionLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="graf-index__results-meta">
        <span aria-live="polite">{filteredGrafs.length}개의 공간</span>
        <button
          type="button"
          className="graf-filter-reset-link"
          onClick={() => updateParams()}
          disabled={!hasConditions}
        >
          <RotateCcw size={14} /> 조건 초기화
        </button>
      </div>

      {filteredGrafs.length > 0 ? (
        <div className="graf-index__grid">
          {filteredGrafs.map((graf, index) => (
            <GrafCard key={graf.slug} graf={graf} priority={index < 3} />
          ))}
        </div>
      ) : (
        <div className="graf-index__empty">
          <p>선택한 조건에 맞는 GRAF가 없습니다.</p>
          <button type="button" onClick={() => updateParams()}>조건 초기화</button>
        </div>
      )}
    </section>
  );
}
