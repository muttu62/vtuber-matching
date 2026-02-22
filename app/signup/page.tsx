"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { createUserProfile } from "../../lib/firestore";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user.uid, email);
      await sendEmailVerification(result.user);
      // セッションクッキーは設定しない（メール確認後にログインしてもらう）
      setEmailSent(true);
    } catch (err: any) {
      setError("登録に失敗しました: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-white mb-3">確認メールを送信しました</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            <span className="text-white font-medium">{email}</span> に確認メールを送りました。
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            メールのリンクをクリックして登録を完了してください。確認後、下のボタンからログインしてプロフィールを設定してください。
          </p>
          <Link
            href="/login"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            ログインへ
          </Link>
          <p className="text-gray-500 text-xs mt-4">
            メールが届かない場合は迷惑メールフォルダをご確認ください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">新規登録</h1>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
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
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          すでにアカウントをお持ちの方は
          <a href="/login" className="text-purple-400 hover:underline ml-1">ログイン</a>
        </p>
      </div>
    </div>
  );
}
