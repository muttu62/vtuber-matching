"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { getUserProfile, updateUserProfile } from "../../../lib/firestore";
import AvatarUpload from "../../../components/AvatarUpload";

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
  // Firestoreから取得した元の値を保持（差分検出用）
  const savedRef = useRef<FormValues>(EMPTY_FORM);

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
          savedRef.current = values; // 元の値を記録
        }
      })
      .finally(() => setFetching(false));
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      // 変更されたフィールドのみ抽出
      const changed = (Object.keys(form) as Array<keyof FormValues>).reduce(
        (acc, key) => {
          if (form[key] !== savedRef.current[key]) acc[key] = form[key];
          return acc;
        },
        {} as Partial<FormValues>
      );

      if (Object.keys(changed).length > 0) {
        await updateUserProfile(user.uid, changed);
        savedRef.current = { ...form }; // 保存成功後に元の値を更新
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
              <option value="creator">クリエイター（イラスト・動画編集・作曲など）</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">活動ジャンル</label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
            >
              <option value="">選択してください</option>
              <option value="ゲーム">ゲーム</option>
              <option value="雑談">雑談</option>
              <option value="歌">歌</option>
              <option value="イラスト">イラスト</option>
              <option value="料理">料理</option>
              <option value="学習">学習</option>
              <option value="その他">その他</option>
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
