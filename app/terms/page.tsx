export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">利用規約</h1>
        <p className="text-gray-400 text-sm mb-10">最終更新日：2025年2月21日</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第1条（適用）</h2>
            <p>
              本規約は、Vクリ（以下「当サービス」）が提供するVTuberおよびクリエイター向けマッチングサービスの利用に関し、
              すべての利用者（以下「ユーザー」）に適用されます。
              ユーザーは、本規約に同意した上で当サービスを利用するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第2条（サービス内容）</h2>
            <p>当サービスは、VTuberおよびクリエイターが以下の目的で利用できるプラットフォームを提供します。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>コラボ相手・制作パートナーの募集・探索</li>
              <li>プロフィールの公開によるセルフプロモーション</li>
              <li>ユーザー間のコラボ申請・マッチング機能の利用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第3条（登録・アカウント）</h2>
            <p>
              ユーザーは正確な情報を用いてアカウントを作成する義務を負います。
              虚偽情報の登録、他者へのなりすまし、または複数アカウントの作成は禁止します。
              アカウントの管理責任はユーザー本人にあり、第三者による不正利用について当サービスは責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第4条（禁止事項）</h2>
            <p>ユーザーは以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>法令または公序良俗に反する行為</li>
              <li>他のユーザーへの誹謗中傷・ハラスメント・脅迫</li>
              <li>当サービスのシステムへの不正アクセスや妨害行為</li>
              <li>スパム行為・無差別なマッチング申請</li>
              <li>営利目的の宣伝・勧誘（当サービスが許可した場合を除く）</li>
              <li>著作権・肖像権その他の知的財産権を侵害する行為</li>
              <li>未成年者が成人向けコンテンツを扱う行為</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第5条（コンテンツの取り扱い）</h2>
            <p>
              ユーザーが投稿したプロフィール情報・画像・テキスト等のコンテンツの著作権はユーザー本人に帰属します。
              ただし当サービスは、サービス運営・改善・広報の目的に限り、無償でこれらを利用できるものとします。
              ユーザーは、投稿するコンテンツが第三者の権利を侵害しないことを保証するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第6条（マッチング機能）</h2>
            <p>
              当サービスのマッチング機能はユーザー間の出会いを仲介するものであり、
              コラボの成立・内容・結果について当サービスは一切の責任を負いません。
              ユーザー間のトラブルは当事者間で解決するものとし、当サービスへの責任転嫁はできません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第7条（サービスの変更・停止）</h2>
            <p>
              当サービスは、ユーザーへの事前通知なく、サービスの内容変更・機能追加・一時停止・終了を行う場合があります。
              これによりユーザーに生じた損害について、当サービスは責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第8条（免責事項）</h2>
            <p>
              当サービスは、サービスの完全性・正確性・安全性を保証しません。
              当サービスの利用によって生じた直接・間接的な損害について、当サービスは法令上の責任を負う場合を除き一切責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第9条（規約の変更）</h2>
            <p>
              当サービスは、必要に応じて本規約を変更することがあります。
              変更後の規約はサービス上に掲示した時点で効力を生じるものとし、
              変更後も当サービスを継続して利用した場合は、変更後の規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">第10条（準拠法・管轄）</h2>
            <p>
              本規約は日本法に準拠し、本規約に関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
