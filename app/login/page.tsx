"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setResendDone(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        // メール未確認 — セッションクッキーは AuthContext が設定しないので画面でも伝える
        setUnverified(true);
        return;
      }
      router.push("/explore");
    } catch (err: any) {
      setError("ログインに失敗しました: " + err.message);
    }
  };

  const handleResendVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await sendEmailVerification(currentUser);
      setResendDone(true);
    } catch (err: any) {
      setError("再送に失敗しました: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">ログイン</h1>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        {unverified && (
          <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-4 mb-4">
            <p className="text-yellow-300 text-sm mb-2">
              メールアドレスの確認が完了していません。届いた確認メールのリンクをクリックしてください。
            </p>
            {resendDone ? (
              <p className="text-green-400 text-xs">確認メールを再送しました。</p>
            ) : (
              <button
                onClick={handleResendVerification}
                className="text-yellow-400 hover:text-yellow-300 text-xs underline"
              >
                確認メールを再送する
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              tabIndex={-1}
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg"
          >
            ログイン
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          アカウントをお持ちでない方は
          <a href="/signup" className="text-purple-400 hover:underline ml-1">新規登録</a>
        </p>
      </div>
    </div>
  );
}
