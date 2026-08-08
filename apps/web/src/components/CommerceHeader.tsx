"use client";

import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SHOP_CATEGORIES = [
  { title: "타일", items: ["타일", "빅슬랩"] },
  { title: "수전", items: ["세면 수전", "주방 수전", "샤워·욕조 수전"] },
  { title: "조명", items: ["펜던트 조명", "천장 조명", "벽 조명"] },
] as const;

export function CommerceHeader() {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
    mobileMenu.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable: HTMLElement[] = [
        ...(menuButton ? [menuButton] : []),
        ...Array.from(
          mobileMenu.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
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
          <Link href="/#graf">GRAF</Link>
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
              href="/#products"
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
                    <Link className="shop-reveal__title" href="/#products">
                      {category.title}
                    </Link>
                    <ul>
                      {category.items.map((item) => (
                        <li key={item}>
                          <Link href="/#products">{item}</Link>
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
            onClick={() => setIsMobileOpen(!isMobileOpen)}
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
            <Link href="/#graf" onClick={() => setIsMobileOpen(false)}>
              GRAF
            </Link>
            <Link href="/#products" onClick={() => setIsMobileOpen(false)}>
              SHOP
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
