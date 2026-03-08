"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import Link from "next/link";

export default function AuthActionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (mode !== "verifyEmail" || !oobCode) {
      setStatus("error");
      return;
    }
    applyActionCode(auth, oobCode)
      .then(() => {
        router.replace("/login?verified=true");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [mode, oobCode, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">確認中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-white mb-3">リンクが無効または期限切れです</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          再度登録からやり直してください。
        </p>
        <Link
          href="/signup"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
        >
          新規登録へ
        </Link>
      </div>
    </div>
  );
}
