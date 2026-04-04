import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ロゴ + キャッチコピー */}
        <div className="text-center mb-14">
          <img
            src="https://res.cloudinary.com/djl6ceb4w/image/upload/v1772841919/logo_zbykjc.webp"
            alt="Vクリマッチング"
            className="h-24 w-auto mx-auto mb-6"
          />
          <p className="text-xl text-gray-300 leading-relaxed">
            「<span className="text-purple-400 font-semibold">VTuber</span>と<span className="text-purple-400 font-semibold">VTuber</span>」
            <br className="sm:hidden" />
            「<span className="text-purple-400 font-semibold">VTuber</span>と<span className="text-cyan-400 font-semibold">クリエイター</span>」<br />
            が出会う、無料マッチングサービス
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-xl transition-colors text-lg"
            >
              無料で始める
            </Link>
          </div>
        </div>

        {/* 特徴カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-white font-bold mb-2">探す＆提案</h3>
            <p className="text-gray-400 text-sm">
              自分で仲間を探したり、自動であなたと相性の良い相手が提案されます
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

        {/* 性格診断 */}
        <div className="bg-purple-900/30 border border-purple-700 rounded-2xl p-8 mb-8 text-center">
          <div className="text-4xl mb-3">🎭</div>
          <h3 className="text-xl font-bold text-white mb-2">性格診断</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-5">
            一緒にVTuber活動を楽しめる、あなたに合う仲間が見つかる！<br />
            性格タイプから相性の良い相手を自動で提案します。
          </p>
          <Link
            href="/diagnosis"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            診断を受ける →
          </Link>
        </div>

        {/* サービス説明 */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Vクリマッチングとは</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            「Vクリマッチング」は、活動中の<span className="text-purple-400 font-semibold">VTuber</span>と、
            イラスト・動画編集・作曲などを手がける
            <span className="text-cyan-400 font-semibold">クリエイター</span>が
            コラボ相手・依頼先を見つけるためのマッチングサービスです。
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            プロフィールを公開して申請を送るだけで、気になる相手と
            簡単につながることができます。
          </p>
          <div className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300">
            一覧に並んでいるクリエイターは全員、有償依頼を「受付中」です。
            <span className="text-cyan-400 font-medium"> ※販売手数料はかかりません</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/signup"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-xl transition-colors text-lg"
          >
            無料で始める
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
