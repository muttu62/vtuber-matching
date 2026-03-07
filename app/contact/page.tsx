"use client";
import { useState } from "react";

const CATEGORIES = [
  "バグ・不具合報告",
  "機能のご要望",
  "ご意見・ご感想",
  "その他",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    body: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送信に失敗しました");
        return;
      }
      setSent(true);
    } catch {
      setError("送信に失敗しました。しばらく経ってから再度お試しください。");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-white mb-3">送信完了！</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            お問い合わせいただきありがとうございます。<br />
            内容を確認の上、必要に応じてご連絡いたします。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">お問い合わせ・ご意見箱</h1>
        <p className="text-gray-400 text-sm mb-8">
          バグ報告・機能要望・ご意見などお気軽にどうぞ
        </p>

        <div className="bg-gray-900 rounded-2xl p-8">
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-300 text-sm mb-1">お名前（任意）</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="ハンドルネームでもOK"
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">
                メールアドレス <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="返信が必要な場合に入力してください"
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">
                種別 <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              >
                <option value="">選択してください</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">
                内容 <span className="text-red-400">*</span>
              </label>
              <textarea
                name="body"
                value={form.body}
                onChange={handleChange}
                placeholder="お問い合わせ内容をご記入ください"
                rows={6}
                maxLength={500}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 resize-none"
              />
              <p className="text-gray-500 text-xs mt-1 text-right">
                {form.body.length} / 500
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {sending ? "送信中..." : "送信する"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
