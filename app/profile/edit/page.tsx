"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { getUserProfile, updateUserProfile } from "../../../lib/firestore";
import AvatarUpload from "../../../components/AvatarUpload";

const VTUBER_GENRES = ["ゲーム", "雑談", "歌", "料理", "学習", "その他"];
const CREATOR_GENRES = ["イラスト", "アニメーション", "動画編集", "デザイン", "作曲", "3Dモデリング", "その他"];

function getGenreOptions(userType: string): string[] {
  if (userType === "vtuber") return VTUBER_GENRES;
  if (userType === "creator" || userType === "vtuber_creator") return CREATOR_GENRES;
  return [...VTUBER_GENRES, ...CREATOR_GENRES];
}

type FormValues = {
  name: string;
  userType: string;
  genre: string;
  activityTime: string;
  description: string;
  snsLinks: string;
  avatarUrl: string;
};

const EMPTY_FORM: FormValues = {
  name: "",
  userType: "",
  genre: "",
  activityTime: "",
  description: "",
  snsLinks: "",
  avatarUrl: "",
};

export default function ProfileEditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const savedRef = useRef<FormValues>(EMPTY_FORM);

  const [acceptsRequests, setAcceptsRequests] = useState(false);
  const savedAcceptsRequestsRef = useRef(false);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then((profile) => {
        if (profile) {
          const values: FormValues = {
            name: profile.name ?? "",
            userType: profile.userType ?? "",
            genre: profile.genre ?? "",
            activityTime: profile.activityTime ?? "",
            description: profile.description ?? "",
            snsLinks: profile.snsLinks ?? "",
            avatarUrl: profile.avatarUrl ?? "",
          };
          setForm(values);
          savedRef.current = values;
          setAcceptsRequests(profile.acceptsRequests ?? false);
          savedAcceptsRequestsRef.current = profile.acceptsRequests ?? false;
        }
      })
      .finally(() => setFetching(false));
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
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
      const changed = (Object.keys(form) as Array<keyof FormValues>).reduce(
        (acc, key) => {
          if (form[key] !== savedRef.current[key]) acc[key] = form[key];
          return acc;
        },
        {} as Partial<FormValues>
      );

      const isCreatorType = form.userType === "creator" || form.userType === "vtuber_creator";
      const wasCreatorType = savedRef.current.userType === "creator" || savedRef.current.userType === "vtuber_creator";

      const updates: Record<string, unknown> = { ...changed };
      if (isCreatorType && acceptsRequests !== savedAcceptsRequestsRef.current) {
        updates.acceptsRequests = acceptsRequests;
      }
      if (!isCreatorType && wasCreatorType) {
        updates.acceptsRequests = false;
      }

      if (Object.keys(updates).length > 0) {
        await updateUserProfile(user.uid, updates);
        savedRef.current = { ...form };
        savedAcceptsRequestsRef.current = acceptsRequests;
      }

      router.push("/mypage");
    } catch (err: any) {
      setError("保存に失敗しました: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-2">プロフィール編集</h1>
        <p className="text-gray-400 text-sm mb-6">情報を更新して保存してください</p>

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
            <label className="block text-gray-300 text-sm mb-1">活動タイプ</label>
            <select
              name="userType"
              value={form.userType}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            >
              <option value="">選択してください</option>
              <option value="vtuber">VTuber</option>
              <option value="creator">クリエイター</option>
              <option value="vtuber_creator">VTuber兼クリエイター</option>
            </select>
          </div>

          {(form.userType === "creator" || form.userType === "vtuber_creator") && (
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

          <div>
            <label className="block text-gray-300 text-sm mb-1">活動ジャンル</label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            >
              <option value="">選択してください</option>
              {getGenreOptions(form.userType).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

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

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
