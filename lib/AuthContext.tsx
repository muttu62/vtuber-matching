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
      setLoading(false);
      if (user && user.emailVerified) {
        const token = await user.getIdToken();
        document.cookie = `session=${token}; path=/; max-age=3600`;
      } else {
        // 未確認ユーザーまたはログアウト時はクッキーをクリア
        document.cookie = `session=; path=/; max-age=0`;
      }
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
