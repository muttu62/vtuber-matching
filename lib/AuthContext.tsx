"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth } from "./firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  sessionReady: boolean; // Cookie が実際にセットされた後 true になる
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, sessionReady: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // onIdTokenChanged は認証状態の変化だけでなく、
    // Firebase がトークンを自動更新するたびにも発火するため
    // セッションクッキーを常に最新の状態に保てる
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);    // Firebase 認証状態が判明した時点で即座に false にする（UX 優先）
      setSessionReady(false); // Cookie セット前はリセット

      if (user && user.emailVerified) {
        const token = await user.getIdToken();
        // HttpOnly Cookie はサーバーサイドでのみ設定可能なため API 経由でセット
        // 完了後に sessionReady=true → ログインページの自動リダイレクトが発火する
        fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
          .then(() => setSessionReady(true))
          .catch(() => setSessionReady(true)); // エラーでも進める（次のナビで再試行される）
      } else {
        // 未確認ユーザーまたはログアウト時はサーバー側でクッキーをクリア
        fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        // sessionReady は false のまま（ログアウト済み）
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, sessionReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
