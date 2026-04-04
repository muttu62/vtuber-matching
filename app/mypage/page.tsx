"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { getUserProfile, updateUserProfile, toTagArray, UserProfile } from "../../lib/firestore";

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  // パスワード変更
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // メールアドレス変更
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emCurrent, setEmCurrent] = useState("");
  const [emNew, setEmNew] = useState("");
  const [emError, setEmError] = useState("");
  const [emSuccess, setEmSuccess] = useState("");
  const [savingEm, setSavingEm] = useState(false);

  // 非公開の連絡先変更
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInput, setContactInput] = useState("");
  const [contactPlatformInput, setContactPlatformInput] = useState("");
  const [contactValueInput, setContactValueInput] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  // アカウント公開設定
  const [savingPublic, setSavingPublic] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then((p) => {
        setProfile(p);
        // YouTubeキャッシュが未設定 or 7日以上経過していればバックグラウンドで更新
        if (p?.youtubeUrl) {
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          const cachedAt = p.youtubeVideosCachedAt ? new Date(p.youtubeVideosCachedAt).getTime() : 0;
          if (Date.now() - cachedAt > SEVEN_DAYS_MS) {
            (async () => {
              try {
                const token = await user.getIdToken();
                const res = await fetch("/api/youtube", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ url: p.youtubeUrl, type: "videos" }),
                });
                const data = await res.json();
                if (data.videos) {
                  await updateUserProfile(user.uid, {
                    youtubeVideos: data.videos,
                    youtubeVideosCachedAt: new Date().toISOString(),
                  });
                }
              } catch (e) {
                console.error("[youtube cache]", e);
              }
            })();
          }
        }
      })
      .finally(() => setFetching(false));
  }, [user]);

  const handleChangePassword = async () => {
    if (!user) return;
    if (pwNew !== pwConfirm) { setPwError("新しいパスワードが一致しません"); return; }
    if (pwNew.length < 6) { setPwError("パスワードは6文字以上で入力してください"); return; }
    setSavingPw(true);
    setPwError("");
    setPwSuccess("");
    try {
      const cred = EmailAuthProvider.credential(user.email!, pwCurrent);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwNew);
      setPwSuccess("パスワードを変更しました");
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      setShowPasswordForm(false);
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwError("現在のパスワードが正しくありません");
      } else {
        setPwError("変更に失敗しました: " + err.message);
      }
    } finally {
      setSavingPw(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user) return;
    setSavingEm(true);
    setEmError("");
    setEmSuccess("");
    try {
      const cred = EmailAuthProvider.credential(user.email!, emCurrent);
      await reauthenticateWithCredential(user, cred);
      await verifyBeforeUpdateEmail(user, emNew);
      setEmSuccess("確認メールを送信しました。新しいメールアドレスのリンクをクリックすると変更が完了します。");
      setEmCurrent(""); setEmNew("");
      setShowEmailForm(false);
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setEmError("現在のパスワードが正しくありません");
      } else if (err.code === "auth/email-already-in-use") {
        setEmError("そのメールアドレスはすでに使用されています");
      } else {
        setEmError("変更に失敗しました: " + err.message);
      }
    } finally {
      setSavingEm(false);
    }
  };

  const handleSaveContact = async () => {
    if (!user) return;
    setSavingContact(true);
    try {
      await updateUserProfile(user.uid, {
        contactPlatform: contactPlatformInput.trim(),
        contactValue: contactValueInput.trim(),
        // 後方互換のため旧フィールドも更新
        privateContact: contactPlatformInput.trim()
          ? `${contactPlatformInput.trim()}: ${contactValueInput.trim()}`
          : contactValueInput.trim(),
      });
      setProfile((prev) => prev
        ? { ...prev, contactPlatform: contactPlatformInput.trim(), contactValue: contactValueInput.trim() }
        : prev
      );
      setShowContactForm(false);
    } finally {
      setSavingContact(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!user || !profile) return;
    const next = !(profile.isPublic ?? true);
    setSavingPublic(true);
    try {
      await updateUserProfile(user.uid, { isPublic: next });
      setProfile((prev) => prev ? { ...prev, isPublic: next } : prev);
    } finally {
      setSavingPublic(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = "session=; path=/; max-age=0";
    router.push("/login");
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  const genreTags = toTagArray(profile?.genre);
  const activityTimeTags = toTagArray(profile?.activityTime);
  const isPublic = profile?.isPublic ?? true;

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">マイページ</h1>

        <div className="bg-gray-900 rounded-2xl p-8 mb-4">
          {/* アバター + 名前 */}
          <div className="flex items-center gap-4 mb-6">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl text-gray-400">
                ?
              </div>
            )}
            <div>
              <p className="text-2xl font-bold text-white">
                {profile?.name || "名前未設定"}
              </p>
              {genreTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {genreTags.map((g) => (
                    <span key={g} className="text-xs text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 活動時間帯 */}
          {activityTimeTags.length > 0 && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">活動時間帯</h2>
              <div className="flex flex-wrap gap-1">
                {activityTimeTags.map((t) => (
                  <span key={t} className="text-xs text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 自己紹介 */}
          {profile?.description && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">自己紹介</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
            </div>
          )}

          {/* 関連リンク */}
          {profile?.snsLinks && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">関連リンク</h2>
              {profile.snsLinks.startsWith("http") ? (
                <a
                  href={profile.snsLinks}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline break-all"
                >
                  {profile.snsLinks}
                </a>
              ) : (
                <p className="text-gray-200 break-all">{profile.snsLinks}</p>
              )}
            </div>
          )}

          {/* 非公開の連絡先（表示のみ） */}
          <div className="border-t border-gray-800 pt-4">
            <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">非公開の連絡先</h2>
            {(profile?.contactPlatform || profile?.contactValue) ? (
              <div className="flex items-center gap-2 text-sm">
                {profile?.contactPlatform && (
                  <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full text-xs">
                    {profile.contactPlatform}
                  </span>
                )}
                <span className="text-white">{profile?.contactValue || ""}</span>
              </div>
            ) : (
              <p className={`text-sm ${profile?.privateContact ? "text-white" : "text-gray-500"}`}>
                {profile?.privateContact || "未設定"}
              </p>
            )}
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-bold">パスワード変更</h2>
            <button
              onClick={() => { setShowPasswordForm((v) => !v); setPwError(""); setPwSuccess(""); }}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {showPasswordForm ? "閉じる" : "変更する"}
            </button>
          </div>
          {pwSuccess && <p className="text-green-400 text-sm mt-1">{pwSuccess}</p>}
          {showPasswordForm && (
            <div className="mt-3 space-y-2">
              {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
              <input
                type="password"
                placeholder="現在のパスワード"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
              <input
                type="password"
                placeholder="新しいパスワード（6文字以上）"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
              <input
                type="password"
                placeholder="新しいパスワード（確認）"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
              <button
                onClick={handleChangePassword}
                disabled={savingPw || !pwCurrent || !pwNew || !pwConfirm}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg transition-colors"
              >
                {savingPw ? "変更中..." : "パスワードを変更する"}
              </button>
            </div>
          )}
        </div>

        {/* メールアドレス変更 */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-bold">メールアドレス変更</h2>
            <button
              onClick={() => { setShowEmailForm((v) => !v); setEmError(""); setEmSuccess(""); }}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {showEmailForm ? "閉じる" : "変更する"}
            </button>
          </div>
          <p className="text-gray-500 text-xs">現在: {user?.email}</p>
          {emSuccess && <p className="text-green-400 text-sm mt-1">{emSuccess}</p>}
          {showEmailForm && (
            <div className="mt-3 space-y-2">
              {emError && <p className="text-red-400 text-sm">{emError}</p>}
              <input
                type="password"
                placeholder="現在のパスワード"
                value={emCurrent}
                onChange={(e) => setEmCurrent(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
              <input
                type="email"
                placeholder="新しいメールアドレス"
                value={emNew}
                onChange={(e) => setEmNew(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
              <button
                onClick={handleChangeEmail}
                disabled={savingEm || !emCurrent || !emNew}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg transition-colors"
              >
                {savingEm ? "送信中..." : "確認メールを送信する"}
              </button>
            </div>
          )}
        </div>

        {/* 非公開の連絡先変更 */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-bold">非公開の連絡先変更</h2>
            <button
              onClick={() => {
                setContactPlatformInput(profile?.contactPlatform ?? "");
                setContactValueInput(profile?.contactValue ?? (profile?.privateContact ?? ""));
                setShowContactForm((v) => !v);
              }}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {showContactForm ? "閉じる" : "変更する"}
            </button>
          </div>
          <p className="text-gray-500 text-xs">マッチング成立した相手にのみ公開されます</p>
          {showContactForm && (
            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-gray-400 text-xs mb-1">連絡先プラットフォーム</label>
                <input
                  type="text"
                  value={contactPlatformInput}
                  onChange={(e) => setContactPlatformInput(e.target.value)}
                  placeholder="例: Discord / X / メール"
                  className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">連絡先（ID・アドレス）</label>
                <input
                  type="text"
                  value={contactValueInput}
                  onChange={(e) => setContactValueInput(e.target.value)}
                  placeholder="例: username#1234 / @handle / example@mail.com"
                  className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <button
                onClick={handleSaveContact}
                disabled={savingContact}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg transition-colors"
              >
                {savingContact ? "保存中..." : "保存する"}
              </button>
            </div>
          )}
        </div>

        {/* アカウント公開設定 */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold">アカウントを非公開にする</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {isPublic ? "現在：公開中（ユーザー一覧に表示されています）" : "現在：非公開（ユーザー一覧に表示されていません）"}
              </p>
            </div>
            <button
              onClick={handleTogglePublic}
              disabled={savingPublic}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                !isPublic ? "bg-purple-600" : "bg-gray-600"
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                !isPublic ? "translate-x-7" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* ボタン群 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/profile/edit")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            公開プロフィールを編集
          </button>
          {profile?.personalityType && (
            <p className="text-center text-purple-300 text-sm">
              あなたは【{profile.personalityType}】です！
            </p>
          )}
          <button
            onClick={() => router.push("/personality-test")}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors border border-purple-800 hover:border-purple-600"
          >
            🎭 {profile?.personalityType ? "性格診断をやり直す" : "性格診断で相性のいい人を探す"}
          </button>
          {user && (() => {
            const today = new Date().toISOString().slice(0, 10);
            const sharedToday = typeof window !== "undefined"
              && localStorage.getItem("x_shared_date") === today;
            return (
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`【コラボ募集中】Vクリでコラボ相手を探しています！気になる方はこちらからどうぞ👇\nhttps://v-kuri.com/profile/${user.uid}\n#Vtuber募集 #コラボ募集 #個人vtuber`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => localStorage.setItem("x_shared_date", today)}
                className={`block w-full font-bold py-3 rounded-lg transition-colors text-center ${
                  sharedToday
                    ? "bg-sky-700 text-sky-200 cursor-default"
                    : "bg-sky-500 hover:bg-sky-600 text-white"
                }`}
              >
                {sharedToday
                  ? "✅ 本日シェア済み（申請可能枠+5）"
                  : "𝕏でマイページを共有して申請可能枠を増やす（+5）"}
              </a>
            );
          })()}
          <button
            onClick={handleLogout}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
