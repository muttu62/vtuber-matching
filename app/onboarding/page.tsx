"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { updateUserProfile } from "../../lib/firestore";
import AvatarUpload from "../../components/AvatarUpload";

const VTUBER_GENRES = ["ゲーム", "雑談", "歌", "料理", "学習", "その他"];
const CREATOR_GENRES = ["イラスト", "アニメーション", "動画編集", "デザイン", "作曲", "3Dモデリング", "その他"];

function getGenreOptions(userType: string): string[] {
  if (userType === "vtuber") return VTUBER_GENRES;
  if (userType === "creator" || userType === "vtuber_creator") return CREATOR_GENRES;
  return [];
}

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    userType: "",
    genre: "",
    activityTime: "",
    description: "",
    snsLinks: "",
    avatarUrl: "",
    privateContact: "",
  });
  const [acceptsRequests, setAcceptsRequests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // userType 変更時に無効なジャンルをリセット
      if (name === "userType") {
        const valid = getGenreOptions(value);
        if (!valid.includes(prev.genre)) next.genre = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const isCreatorType = form.userType === "creator" || form.userType === "vtuber_creator";
      await updateUserProfile(user.uid, {
        ...form,
        userType: form.userType as "vtuber" | "creator" | "vtuber_creator" | undefined,
        acceptsRequests: isCreatorType ? acceptsRequests : false,
      });
      router.push("/explore");
    } catch (err: any) {
      setError("保存に失敗しました: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-xl font-bold text-white mb-3">メール確認が必要です</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            登録時に送信した確認メールのリンクをクリックしてからログインしてください。
          </p>
          <a
            href="/login"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            ログインへ
          </a>
        </div>
      </div>
    );
  }

  const genreOptions = getGenreOptions(form.userType);
  const isCreatorType = form.userType === "creator" || form.userType === "vtuber_creator";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-2">プロフィール設定</h1>
        <p className="text-gray-400 text-sm mb-6">コラボ相手に表示される情報を入力してください</p>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AvatarUpload
            currentUrl={form.avatarUrl}
            onUploaded={(url) => setForm((prev) => ({ ...prev, avatarUrl: url }))}
          />

          <div>
            <label className="block text-gray-300 text-sm mb-1">名前 <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="配信者名・ハンドルネーム"
              required
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">活動タイプ <span className="text-red-400">*</span></label>
            <select
              name="userType"
              value={form.userType}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            >
              <option value="">選択してください</option>
              <option value="vtuber">VTuber</option>
              <option value="creator">クリエイター</option>
              <option value="vtuber_creator">VTuber兼クリエイター</option>
            </select>
          </div>

          {isCreatorType && (
            <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                id="acceptsRequests"
                checked={acceptsRequests}
                onChange={(e) => setAcceptsRequests(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-purple-500 shrink-0"
              />
              <label htmlFor="acceptsRequests" className="text-gray-300 text-sm cursor-pointer">
                制作依頼を受け付ける
                <span className="block text-gray-500 text-xs mt-0.5">チェックするとユーザー一覧に表示されます</span>
              </label>
            </div>
          )}

          {genreOptions.length > 0 && (
            <div>
              <label className="block text-gray-300 text-sm mb-1">活動ジャンル</label>
              <select
                name="genre"
                value={form.genre}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              >
                <option value="">選択してください</option>
                {genreOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm mb-1">活動時間帯</label>
            <select
              name="activityTime"
              value={form.activityTime}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            >
              <option value="">選択してください</option>
              <option value="朝（6〜12時）">朝（6〜12時）</option>
              <option value="昼（12〜18時）">昼（12〜18時）</option>
              <option value="夜（18〜24時）">夜（18〜24時）</option>
              <option value="深夜（0〜6時）">深夜（0〜6時）</option>
              <option value="不定期">不定期</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">自己紹介</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="コラボしたい内容や自分のことを書いてください"
              rows={4}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">SNSリンク</label>
            <input
              type="text"
              name="snsLinks"
              value={form.snsLinks}
              onChange={handleChange}
              placeholder="Twitter・YouTubeなどのURL"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">
              非公開の連絡先 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="privateContact"
              value={form.privateContact}
              onChange={handleChange}
              placeholder="例: Discord: username#1234"
              required
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            />
            <p className="text-gray-500 text-xs mt-2 leading-relaxed">
              Xのユーザー名を記載してDMのやりとりなどでもOKですが、Xでの設定によりDMが送れない場合もありますので、多くのユーザーが使用しているDiscordのIDがおすすめです。マッチングが成立した相手にのみ公開されます。
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {saving ? "保存中..." : "プロフィールを保存して始める"}
          </button>
        </form>
      </div>
    </div>
  );
}
