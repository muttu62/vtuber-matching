"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700"
            required
          />
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
