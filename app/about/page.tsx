import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ロゴ + キャッチコピー */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">Vクリ</h1>
          <p className="text-xl text-gray-300">
            <p>「VTuberとVTuber」「VTuberとクリエイター」</p><p>が出会う、無料マッチングサービス</p>
          </p>
        </div>

        {/* サービス説明 */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Vクリとは</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            「Vクリ」は、活動中の<span className="text-purple-400 font-semibold">VTuber</span>と、
            イラスト・動画編集・作曲などを手がける
            <span className="text-green-400 font-semibold">クリエイター</span>が
            コラボ相手・依頼先を見つけるためのマッチングサービスです。
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            プロフィールを公開して申請を送るだけで、活動ジャンルや時間帯が合う相手と
            簡単につながることができます。
          </p>
          <div className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300">
            一覧に並んでいるクリエイターは全員、有償依頼「受付中」のため、確認の手間が不要です。
            <span className="text-purple-400 font-medium"> ※販売手数料はかかりません</span>
          </div>
        </div>

        {/* 特徴 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-white font-bold mb-2">探す</h3>
            <p className="text-gray-400 text-sm">
              VTuberまたはクリエイターでフィルターしてコラボ相手・依頼先を探せます
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="text-white font-bold mb-2">申請する</h3>
            <p className="text-gray-400 text-sm">
              気になった相手に、気軽にフレンド申請を送れます
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">🎉</div>
            <h3 className="text-white font-bold mb-2">マッチング</h3>
            <p className="text-gray-400 text-sm">
              承認されたらマッチング成立！メール通知でお知らせし、非公開の連絡先がお互いに確認できます
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/signup"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-xl transition-colors text-lg"
          >
            無料ではじめる
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            すでにアカウントをお持ちの方は
            <Link href="/login" className="text-purple-400 hover:underline ml-1">
              ログイン
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
