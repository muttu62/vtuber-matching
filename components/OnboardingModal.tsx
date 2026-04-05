"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";

const STEPS = [
  {
    title: "ようこそ、Vクリマッチングへ！",
    body: "ここから気になるユーザーを探すことができます。ラベルで分類ごとにユーザーをチェックできます。",
  },
  {
    title: "相性のいい人",
    body: "相性診断の結果から導き出された、あなたと相性ぴったりのおすすめの人です。相性診断は「相性診断」タブから行うことができます。",
  },
  {
    title: "みんなと共有",
    body: "VTuber活動に役立つ情報をみんなと共有できる場所です。気軽に投稿してみてください！",
  },
  {
    title: "プロフィールを設定しよう",
    body: "まずはマイページにてプロフィールと非公開の連絡先を設定しましょう。",
  },
  {
    title: "非公開の連絡先について",
    body: "非公開の連絡先が設定されていないと、フレンド申請をしても相手と連絡をとることができません。かならず！マイページから設定してください。",
  },
  {
    title: "準備完了！",
    body: "それではよいVライフを！✨",
  },
];

const STORAGE_KEY = "onboarding_completed";

export default function OnboardingModal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, [user, loading]);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleFinish = () => {
    complete();
    router.push("/profile/edit");
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isFinal = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/70" onClick={complete} />

      {/* モーダル本体 */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* ステップ番号 */}
        <p className="text-purple-400 text-xs font-medium mb-5 tracking-wider">
          STEP {step + 1} / {STEPS.length}
        </p>

        {/* タイトル */}
        <h2 className="text-xl font-bold text-white mb-3 leading-snug">
          {current.title}
        </h2>

        {/* 本文 */}
        <p className="text-gray-300 text-sm leading-relaxed mb-8">
          {current.body}
        </p>

        {/* ステップインジケーター */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? "w-4 h-2 bg-purple-500"
                  : "w-2 h-2 bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* ボタン */}
        {isFinal ? (
          <button
            onClick={handleFinish}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c6aff, #ff6ab0)" }}
          >
            さっそくはじめる
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={complete}
              className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium text-sm transition-colors"
            >
              スキップ
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors"
            >
              次へ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
