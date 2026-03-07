"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { updateUserProfile } from "../../lib/firestore";
import AvatarUpload from "../../components/AvatarUpload";

const VTUBER_GENRES = ["ゲーム", "雑談", "歌", "料理", "学習", "その他"];
const CREATOR_GENRES = ["イラスト", "アニメーション", "動画編集", "デザイン", "作曲", "3Dモデリング", "その他"];


export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    userType: "",
    genre: "",
    genreCreator: "",
    activityTime: "",
    description: "",
    snsLinks: "",
    avatarUrl: "",
    privateContact: "",
    youtubeUrl: "",
    collaboWant: "",
    collaboStyle: "",
    activityGoal: "",
  });
  const [acceptsRequests, setAcceptsRequests] = useState(false);
  const [youtubeTags, setYoutubeTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagError, setTagError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "userType") {
        next.genre = "";
        next.genreCreator = "";
      }
      return next;
    });
  };

  const handleFetchTags = async () => {
    if (!form.youtubeUrl) return;
    setLoadingTags(true);
    setTagError("");
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.youtubeUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setTagError(data.error || "取得に失敗しました"); return; }
      if (data.tags.length === 0) { setTagError("タグが見つかりませんでした"); return; }
      setYoutubeTags(data.tags);
    } catch {
      setTagError("取得に失敗しました");
    } finally {
      setLoadingTags(false);
    }
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
        youtubeTags,
      });
      router.push("/personality-test");
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

  const isCreatorType = form.userType === "creator" || form.userType === "vtuber_creator";
  const isVtuberCreator = form.userType === "vtuber_creator";

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
            <div>
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
              {!acceptsRequests && (
                <p className="text-red-400 text-xs mt-1">チェックが無い場合はユーザー一覧に表示されません</p>
              )}
            </div>
          )}

          {form.userType === "vtuber" && (
            <div>
              <label className="block text-gray-300 text-sm mb-1">活動ジャンル</label>
              <select
                name="genre"
                value={form.genre}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              >
                <option value="">選択してください</option>
                {VTUBER_GENRES.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
          )}

          {form.userType === "creator" && (
            <div>
              <label className="block text-gray-300 text-sm mb-1">活動ジャンル</label>
              <select
                name="genre"
                value={form.genre}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              >
                <option value="">選択してください</option>
                {CREATOR_GENRES.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
          )}

          {isVtuberCreator && (
            <>
              <div>
                <label className="block text-gray-300 text-sm mb-1">活動ジャンル[VTuber]</label>
                <select
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="">選択してください</option>
                  {VTUBER_GENRES.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">活動ジャンル[クリエイター]</label>
                <select
                  name="genreCreator"
                  value={form.genreCreator}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="">選択してください</option>
                  {CREATOR_GENRES.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
            </>
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
            <label className="block text-gray-300 text-sm mb-1">YouTubeチャンネルURL</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="youtubeUrl"
                value={form.youtubeUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/@channelname"
                className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleFetchTags}
                disabled={loadingTags || !form.youtubeUrl}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {loadingTags ? "取得中..." : "タグを自動取得"}
              </button>
            </div>
            {tagError && <p className="text-red-400 text-xs mt-1">{tagError}</p>}
            {youtubeTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {youtubeTags.map((tag) => (
                  <span key={tag} className="text-xs bg-red-900/40 text-red-300 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">一緒にやりたいこと</label>
            <textarea
              name="collaboWant"
              value={form.collaboWant}
              onChange={handleChange}
              placeholder="どんな人とどんな配信をしたいですか？"
              rows={3}
              maxLength={200}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">コラボのお誘い</label>
            <div className="flex flex-col gap-2">
              {["いつでもOK！", "ある程度仲良くなってから"].map((option) => (
                <label key={option} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="collaboStyle"
                    value={option}
                    checked={form.collaboStyle === option}
                    onChange={handleChange}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <span className="text-gray-300 text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">活動目標</label>
            <textarea
              name="activityGoal"
              value={form.activityGoal}
              onChange={handleChange}
              placeholder="今の活動目標はなんですか？"
              rows={3}
              maxLength={200}
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
