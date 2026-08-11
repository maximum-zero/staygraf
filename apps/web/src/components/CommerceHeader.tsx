"use client";

import {
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SHOP_CATEGORIES } from "@/features/catalog/category-tree";

export function CommerceHeader() {
  const pathname = usePathname();
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState("타일");
  const [currentTileType, setCurrentTileType] = useState("tile");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const header = useRef<HTMLElement>(null);
  const shopMenu = useRef<HTMLDivElement>(null);
  const shopTrigger = useRef<HTMLAnchorElement>(null);
  const shopWasOpenOnPointerDown = useRef(false);
  const mobileMenuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);

  const openShop = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsShopOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsShopOpen(false), 220);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isShopOpen && shopMenu.current?.contains(document.activeElement)) {
        shopTrigger.current?.focus();
      }
      setIsShopOpen(false);
      setIsMobileOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) {
        setIsShopOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [isShopOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const root = document.documentElement;
    const body = document.body;
    const menuButton = mobileMenuButton.current;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousOverscrollBehavior = body.style.overscrollBehavior;
    const background = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer"),
    );

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    background.forEach((element) => {
      element.inert = true;
    });
    mobileMenu.current?.querySelector<HTMLElement>("a, button")?.focus();

    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable: HTMLElement[] = [
        ...(menuButton ? [menuButton] : []),
        ...Array.from(
          mobileMenu.current?.querySelectorAll<HTMLElement>("a, button") ?? [],
        ),
      ];
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
    document.addEventListener("keydown", containFocus);

    return () => {
      document.removeEventListener("keydown", containFocus);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousOverscrollBehavior;
      background.forEach((element) => {
        element.inert = false;
      });
      menuButton?.focus();
    };
  }, [isMobileOpen]);

  return (
    <header ref={header} className="site-header commerce-header">
      <a className="skip-link" href="#main-content">
        본문 바로가기
      </a>
      <div className="site-header__inner">
        <Link className="wordmark" href="/" aria-label="STAYGRAF 홈">
          STAYGRAF
        </Link>
        <nav className="primary-nav" aria-label="주요 메뉴">
          <Link href="/graf">GRAF</Link>
          <div
            ref={shopMenu}
            className="shop-menu"
            onMouseEnter={openShop}
            onMouseLeave={scheduleClose}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsShopOpen(false);
              }
            }}
          >
            <Link
              ref={shopTrigger}
              className={isShopOpen ? "shop-trigger is-active" : "shop-trigger"}
              href="/shop/tile?type=tile"
              aria-expanded={isShopOpen}
              aria-controls="shop-reveal"
              onFocus={openShop}
              onPointerDown={() => {
                shopWasOpenOnPointerDown.current = isShopOpen;
              }}
              onClick={(event) => {
                if (
                  window.matchMedia("(hover: none), (pointer: coarse)")
                    .matches &&
                  !shopWasOpenOnPointerDown.current
                ) {
                  event.preventDefault();
                  openShop();
                  return;
                }
                setIsShopOpen(false);
              }}
            >
              SHOP
            </Link>
            <div
              className={isShopOpen ? "shop-reveal is-open" : "shop-reveal"}
              id="shop-reveal"
            >
              <div
                className="shop-reveal__inner shell"
                role="group"
                aria-label="SHOP 세부 카테고리"
              >
                {SHOP_CATEGORIES.map((category) => (
                  <div key={category.title}>
                    {category.href ? (
                      <Link className="shop-reveal__title" href={category.href}>
                        {category.title}
                      </Link>
                    ) : (
                      <span className="shop-reveal__title is-unavailable">
                        {category.title}
                      </span>
                    )}
                    <ul>
                      {category.items.map((item) => (
                        <li key={item.label}>
                          {item.href ? (
                            <Link href={item.href}>{item.label}</Link>
                          ) : (
                            <span aria-disabled="true">{item.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <div className="header-actions" aria-label="사용자 메뉴">
          <button type="button" aria-label="검색">
            <Search size={20} strokeWidth={1.7} />
          </button>
          <button type="button" aria-label="내 정보">
            <UserRound size={20} strokeWidth={1.7} />
          </button>
          <button type="button" aria-label="장바구니">
            <ShoppingBag size={20} strokeWidth={1.7} />
          </button>
          <button
            ref={mobileMenuButton}
            className="mobile-menu-button"
            type="button"
            aria-label={isMobileOpen ? "전체 메뉴 닫기" : "전체 메뉴"}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-commerce-menu"
            onClick={() => {
              const willOpen = !isMobileOpen;
              setIsMobileOpen(willOpen);
              if (willOpen && pathname.startsWith("/shop/")) {
                setIsMobileShopOpen(true);
                setMobileCategoryOpen("타일");
                setCurrentTileType(
                  new URLSearchParams(window.location.search).get("type") ===
                    "big-slab"
                    ? "big-slab"
                    : "tile",
                );
              }
            }}
          >
            {isMobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div
          className="mobile-commerce-menu"
          id="mobile-commerce-menu"
          role="dialog"
          aria-modal="true"
          aria-label="전체 메뉴"
        >
          <nav
            ref={mobileMenu}
            className="mobile-commerce-menu__primary"
            aria-label="모바일 주요 메뉴"
          >
            <Link href="/graf" onClick={() => setIsMobileOpen(false)}>
              GRAF
            </Link>
            <button
              className="mobile-commerce-menu__shop-trigger"
              type="button"
              aria-expanded={isMobileShopOpen}
              aria-controls="mobile-shop-categories"
              onClick={() => setIsMobileShopOpen((open) => !open)}
            >
              SHOP
              <ChevronDown size={20} aria-hidden="true" />
            </button>
            {isMobileShopOpen && (
              <div
                className="mobile-shop-categories"
                id="mobile-shop-categories"
              >
                <p>상품 카테고리</p>
                {SHOP_CATEGORIES.map((category) => {
                  const isOpen = mobileCategoryOpen === category.title;
                  return (
                    <div key={category.title}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setMobileCategoryOpen(isOpen ? "" : category.title)
                        }
                      >
                        {category.title}
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                      {isOpen && (
                        <ul>
                          {category.items.map((item) => (
                            <li key={item.label}>
                              {item.href ? (
                                <Link
                                  className={
                                    category.title === "타일" &&
                                    ((currentTileType === "tile" &&
                                      item.label === "타일") ||
                                      (currentTileType === "big-slab" &&
                                        item.label === "빅슬랩"))
                                      ? "is-current"
                                      : ""
                                  }
                                  href={item.href}
                                  aria-current={
                                    category.title === "타일" &&
                                    ((currentTileType === "tile" &&
                                      item.label === "타일") ||
                                      (currentTileType === "big-slab" &&
                                        item.label === "빅슬랩"))
                                      ? "page"
                                      : undefined
                                  }
                                  onClick={() => setIsMobileOpen(false)}
                                >
                                  {item.label}
                                </Link>
                              ) : (
                                <span aria-disabled="true">{item.label}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
