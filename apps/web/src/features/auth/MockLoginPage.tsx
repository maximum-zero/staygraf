"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  sanitizeReturnTo,
  useAuthStore,
} from "./auth-store";

const subscribeToMount = () => () => undefined;

export function MockLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const member = useAuthStore((state) => state.member);
  const hydrated = useAuthStore((state) => state.hydrated);
  const login = useAuthStore((state) => state.login);
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  useEffect(() => {
    if (mounted && hydrated && member) router.replace(returnTo);
  }, [hydrated, member, mounted, returnTo, router]);

  if (!mounted || !hydrated || member) {
    return (
      <main className="login-page" id="main-content" aria-busy="true">
        <p>로그인 상태를 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main className="login-page" id="main-content">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card__heading">
          <h1 id="login-title">로그인</h1>
          <p>주문을 계속하려면 화면 검증용 계정으로 로그인해 주세요.</p>
        </div>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            if (!login(email, password)) {
              setError("이메일 또는 비밀번호를 확인해 주세요.");
              return;
            }
            router.replace(returnTo);
          }}
        >
          <label className="checkout-field">
            <span>이메일</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error)}
            />
          </label>
          <label className="checkout-field">
            <span>비밀번호</span>
            <span className="login-password">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
              />
              <button
                type="button"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && (
            <p className="checkout-field-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="login-demo-button"
            type="button"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setError("");
            }}
          >
            데모 계정 입력
          </button>
          <button className="checkout-primary-button" type="submit">
            로그인하고 주문 계속하기
          </button>
          <small>실제 계정이나 결제정보는 사용하지 않습니다.</small>
        </form>
      </section>
    </main>
  );
}
