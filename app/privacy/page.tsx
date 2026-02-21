export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">プライバシーポリシー</h1>
        <p className="text-gray-400 text-sm mb-10">最終更新日：2025年2月21日</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. 基本方針</h2>
            <p>
              Vクリ（以下「当サービス」）は、ユーザーの個人情報の保護を重要な責務と認識し、
              個人情報の保護に関する法律（個人情報保護法）および関連法令を遵守します。
              本ポリシーは当サービスが収集・利用する情報の取り扱いについて説明するものです。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. 収集する情報</h2>
            <p className="mb-3">当サービスは以下の情報を収集します。</p>

            <h3 className="font-bold text-gray-200 mb-2">ユーザーが提供する情報</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mb-4">
              <li>メールアドレス（アカウント登録・ログインに使用）</li>
              <li>プロフィール情報（名前・活動ジャンル・活動時間帯・自己紹介文・SNSリンク）</li>
              <li>アバター画像（任意でアップロードした画像ファイル）</li>
            </ul>

            <h3 className="font-bold text-gray-200 mb-2">自動的に収集される情報</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>アクセスログ（IPアドレス・ブラウザ種別・アクセス日時）</li>
              <li>Cookie および類似技術による情報（セッション管理に使用）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. 情報の利用目的</h2>
            <p className="mb-2">収集した情報は以下の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>アカウントの作成・認証・管理</li>
              <li>プロフィールのほかのユーザーへの表示</li>
              <li>コラボ申請・マッチング機能の提供</li>
              <li>マッチング成立・申請通知メールの送信</li>
              <li>サービスの改善・新機能の開発</li>
              <li>不正利用の検知・防止</li>
              <li>法令に基づく対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. 第三者への情報提供</h2>
            <p className="mb-3">
              当サービスは、以下の場合を除きユーザーの個人情報を第三者に提供しません。
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>ユーザー本人の同意がある場合</li>
              <li>法令に基づき開示が必要な場合</li>
              <li>人の生命・身体・財産の保護のために必要な場合</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              ※ サービス運営に必要な範囲で、以下の業務委託先に情報を提供する場合があります（いずれも当ポリシーと同等の保護水準を要求しています）。
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500 text-sm mt-2">
              <li>Firebase（Google LLC） — 認証・データベース</li>
              <li>Cloudinary, Inc. — 画像ストレージ</li>
              <li>Resend, Inc. — メール送信</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. 情報の保存と管理</h2>
            <p>
              収集した個人情報は、Firebase（Googleのクラウドサービス）上に保存されます。
              パスワードはFirebase Authenticationによって安全に管理されており、当サービスが直接参照することはありません。
              アバター画像はCloudinaryのサーバーに保存されます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. ユーザーの権利</h2>
            <p className="mb-2">ユーザーは以下の権利を有します。</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>自身のプロフィール情報の閲覧・修正（プロフィール編集ページから）</li>
              <li>アカウントの削除（お問い合わせよりご連絡ください）</li>
              <li>個人情報の開示・訂正・利用停止の請求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Cookieの使用</h2>
            <p>
              当サービスはセッション管理のためにCookieを使用します。
              ブラウザの設定によりCookieを無効にすることができますが、その場合サービスの一部機能が利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. 未成年者のプライバシー</h2>
            <p>
              当サービスは13歳未満の方を対象としていません。
              13歳未満の方の個人情報を意図的に収集することはなく、発覚した場合は速やかに削除します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. ポリシーの変更</h2>
            <p>
              本ポリシーは必要に応じて変更されることがあります。
              重要な変更がある場合はサービス上でお知らせします。
              変更後も当サービスを継続して利用した場合、変更後のポリシーに同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. お問い合わせ</h2>
            <p>
              個人情報の取り扱いに関するお問い合わせは、サービス内のお問い合わせフォームよりご連絡ください。
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
