import Link from "next/link";

export function HomeVariantSwitcher({ active }: { active: "a" | "b" }) {
  return (
    <aside className="variant-switcher" aria-label="홈 시안 비교">
      <span>홈 비교</span>
      <Link className={active === "a" ? "is-active" : ""} href="/home-a">
        A
      </Link>
      <Link className={active === "b" ? "is-active" : ""} href="/home-b">
        B
      </Link>
    </aside>
  );
}
