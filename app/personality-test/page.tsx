"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { getUserProfile, updateUserProfile } from "../../lib/firestore";

const QUESTIONS = [
  "気が乗らないときでも配信・作業を続けられる",   // Q1 idx 0
  "相手のペースに合わせるのが得意だ",             // Q2 idx 1
  "予定外のハプニングを楽しめる方だ",             // Q3 idx 2
  "自分の意見はちゃんと言える方だ",               // Q4 idx 3
  "一人でもくもくと作業する時間が好きだ",         // Q5 idx 4
  "褒められるより結果で評価されたい",             // Q6 idx 5
  "場の空気を読んで動くのが得意だ",               // Q7 idx 6
  "やると決めたことは最後までやり遂げる",         // Q8 idx 7
  "新しい環境や変化にワクワクする方だ",           // Q9 idx 8
];

const OPTIONS = [
  { label: "当てはまる", score: 2 },
  { label: "どちらともいえない", score: 1 },
  { label: "当てはまらない", score: 0 },
];

type TypeDef = {
  emoji: string;
  name: string;
  questions: number[];
  desc: string;
  compatible: string[];
};

const TYPES: TypeDef[] = [
  {
    emoji: "🎭",
    name: "ムードメーカー型",
    questions: [0, 2, 6],
    desc: "場を盛り上げる天才！明るいエネルギーでコラボを楽しくします。",
    compatible: ["🎭ムードメーカー型", "🧠戦略家型"],
  },
  {
    emoji: "🎯",
    name: "職人クリエイター型",
    questions: [4, 5, 7],
    desc: "こだわりと実力派！クオリティへの追求心がコラボを高めます。",
    compatible: ["🎯職人クリエイター型", "🎭ムードメーカー型"],
  },
  {
    emoji: "🌟",
    name: "アイドル型",
    questions: [1, 3, 6],
    desc: "ファンを魅了する存在感！愛されるキャラでコラボを華やかに。",
    compatible: ["🌟アイドル型", "🔥チャレンジャー型"],
  },
  {
    emoji: "🧠",
    name: "戦略家型",
    questions: [5, 7, 8],
    desc: "計画的に動く頭脳派！目標に向かってコラボを成功に導きます。",
    compatible: ["🧠戦略家型", "🌿癒し系型"],
  },
  {
    emoji: "🌿",
    name: "癒し系型",
    questions: [1, 6, 7],
    desc: "温かみと安心感が魅力！一緒にいるだけでほっとするタイプ。",
    compatible: ["🌿癒し系型", "🎯職人クリエイター型"],
  },
  {
    emoji: "🔥",
    name: "チャレンジャー型",
    questions: [2, 3, 8],
    desc: "挑戦を楽しむ冒険家！新しいことへの勇気でコラボを刺激的に。",
    compatible: ["🔥チャレンジャー型", "🌟アイドル型"],
  },
];

function calcResult(answers: number[]): TypeDef {
  let best = TYPES[0];
  let bestScore = -1;
  for (const type of TYPES) {
    const score = type.questions.reduce((sum, qi) => sum + (answers[qi] ?? 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}

// personalityType 文字列（例: "🎭ムードメーカー型"）から TypeDef を逆引き
function findTypeByLabel(label: string): TypeDef | null {
  return TYPES.find((t) => label === `${t.emoji}${t.name}`) ?? null;
}

export default function PersonalityTestPage() {
  const { user } = useAuth();
  const router = useRouter();

  // 診断済み結果の表示モード
  const [existingType, setExistingType] = useState<TypeDef | null | undefined>(undefined);
  const [showRetry, setShowRetry] = useState(false);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<TypeDef | null>(null);

  // ログイン済みなら既存の診断結果を取得
  useEffect(() => {
    if (!user) {
      setExistingType(null);
      return;
    }
    getUserProfile(user.uid).then((p) => {
      const label = p?.personalityType;
      setExistingType(label ? (findTypeByLabel(label) ?? null) : null);
    });
  }, [user]);

  const handleAnswer = async (score: number) => {
    const newAnswers = [...answers, score];
    if (step < 8) {
      setAnswers(newAnswers);
      setStep(step + 1);
    } else {
      const res = calcResult(newAnswers);
      setAnswers(newAnswers);
      setResult(res);
      setStep(9);
      // 診断完了時に自動保存
      if (user) {
        try {
          await updateUserProfile(user.uid, { personalityType: res.emoji + res.name });
          setExistingType(res);
        } catch (e) {
          console.error("[personality save]", e);
        }
      }
    }
  };

  const startRetry = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
    setShowRetry(true);
  };

  // 既存結果を表示する条件:
  // - ロード完了 (existingType !== undefined)
  // - 診断済み (existingType !== null)
  // - やり直しモードでない (!showRetry)
  // - 新しい診断を完了していない (step !== 9)
  const showExisting = existingType !== undefined && existingType !== null && !showRetry && step !== 9;

  // ---- 既存結果表示 ----
  if (showExisting) {
    const shareText = encodeURIComponent(
      `私は【${existingType.emoji}${existingType.name}】でした！🎉 Vクリマッチングで相性の良いVTuberを探そう👇 https://v-kuri.com/personality-test #Vクリマッチング #VTuber`
    );
    return (
      <div className="min-h-screen bg-gray-950 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-xs mb-4">あなたの診断結果</p>
            <div className="text-7xl mb-4">{existingType.emoji}</div>
            <p className="text-gray-400 text-sm mb-1">あなたのタイプは</p>
            <h1 className="text-3xl font-bold text-white mb-3">{existingType.name}</h1>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">{existingType.desc}</p>

            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-xs mb-3">相性の良いタイプ</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {existingType.compatible.map((c) => (
                  <span key={c} className="text-sm bg-purple-900/40 text-purple-300 px-3 py-1.5 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition-colors text-center"
              >
                𝕏でシェアする
              </a>
              <button
                onClick={() => router.push("/explore")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                相性の良い人を探す
              </button>
              <button
                onClick={startRetry}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                🔄 やり直す
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 新しい診断の結果画面 ----
  if (step === 9 && result) {
    const shareText = encodeURIComponent(
      `私は【${result.emoji}${result.name}】でした！🎉 Vクリマッチングで相性の良いVTuberを探そう👇 https://v-kuri.com/personality-test #Vクリマッチング #VTuber`
    );
    return (
      <div className="min-h-screen bg-gray-950 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <div className="text-7xl mb-4">{result.emoji}</div>
            <p className="text-gray-400 text-sm mb-1">あなたのタイプは</p>
            <h1 className="text-3xl font-bold text-white mb-3">{result.name}</h1>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">{result.desc}</p>

            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-xs mb-3">相性の良いタイプ</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {result.compatible.map((c) => (
                  <span key={c} className="text-sm bg-purple-900/40 text-purple-300 px-3 py-1.5 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition-colors text-center"
              >
                𝕏でシェアする
              </a>
              <button
                onClick={() => router.push("/explore?tab=compatibility")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                相性の良い相手を探す
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 質問画面（ロード中 or 未診断 or やり直し中） ----
  // existingType が undefined のうちはローディング中のため表示しない
  if (existingType === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-white mb-1 text-center">VTuber性格診断</h1>
        <p className="text-gray-400 text-sm text-center mb-6">あなたのVTuberタイプを診断します</p>

        {/* 進行バー */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Q{step + 1} / 9</span>
            <span>{Math.round((step / 9) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 9) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8">
          <p className="text-white text-lg font-medium leading-relaxed mb-8 text-center min-h-[4rem] flex items-center justify-center">
            {QUESTIONS[step]}
          </p>
          <div className="flex flex-col gap-3">
            {OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.score)}
                className="w-full py-4 px-6 rounded-xl border-2 border-gray-700 hover:border-purple-500 hover:bg-purple-600/10 text-gray-200 font-medium transition-all text-sm"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push("/explore")}
          className="mt-4 w-full text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors"
        >
          スキップしてコラボ相手を探す →
        </button>
      </div>
    </div>
  );
}
