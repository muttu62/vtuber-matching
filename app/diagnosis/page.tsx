import Link from "next/link";

export default function DiagnosisPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">相性診断</h1>
        <p className="text-gray-400 text-sm mb-8">
          診断を受けると、あなたと相性の良い仲間が自動で提案されます
        </p>

        <div className="space-y-4">
          {/* 性格診断 */}
          <Link
            href="/personality-test"
            className="block bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 transition-colors border border-gray-800 hover:border-purple-600"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎭</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg mb-1">性格診断</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  あなたの活動スタイルや個性を診断！相性の良いVTuber・クリエイターが見つかります
                </p>
              </div>
              <span className="text-purple-400 text-lg shrink-0">→</span>
            </div>
          </Link>

          {/* 今後追加予定 */}
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-dashed border-gray-700">
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-40">✨</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-gray-500 font-bold text-lg">新しい診断</h2>
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">準備中</span>
                </div>
                <p className="text-gray-600 text-sm">
                  今後もコラボスタイル診断・活動タイプ診断など、新しい診断を追加予定です！
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-2xl p-6 border border-dashed border-gray-700">
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-40">🌟</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-gray-500 font-bold text-lg">さらに診断を追加予定</h2>
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">準備中</span>
                </div>
                <p className="text-gray-600 text-sm">
                  お楽しみに！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
