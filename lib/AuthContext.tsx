"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth } from "./firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged は認証状態の変化だけでなく、
    // Firebaseがトークンを自動更新するたびにも発火するため
    // セッションクッキーを常に最新の状態に保てる
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      // setLoading(false) は Cookie のセット完了後に呼ぶ。
      // 先に false にすると「loading=false かつ Cookie 未セット」の瞬間が生まれ、
      // ミドルウェアが Cookie を確認できず /login へリダイレクトするループが起きる。
      if (user && user.emailVerified) {
        const token = await user.getIdToken();
        // HttpOnly Cookie はサーバーサイドでのみ設定可能なため API 経由でセット
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).catch(() => {});
      } else {
        // 未確認ユーザーまたはログアウト時はサーバー側でクッキーをクリア
        await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
