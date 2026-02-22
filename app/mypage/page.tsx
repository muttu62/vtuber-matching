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
import { getUserProfile, updateUserProfile, UserProfile } from "../../lib/firestore";

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  const [editingContact, setEditingContact] = useState(false);
  const [contactInput, setContactInput] = useState("");
  const [savingContact, setSavingContact] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then(setProfile)
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

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = "session=; path=/; max-age=0";
    router.push("/login");
  };

  const handleSaveContact = async () => {
    if (!user) return;
    setSavingContact(true);
    try {
      await updateUserProfile(user.uid, { privateContact: contactInput.trim() });
      setProfile((prev) => prev ? { ...prev, privateContact: contactInput.trim() } : prev);
      setEditingContact(false);
    } finally {
      setSavingContact(false);
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
              {profile?.genre && (
                <span className="text-xs text-purple-300 bg-purple-900/40 px-2 py-1 rounded-full inline-block mt-1">
                  {profile.genre}
                </span>
              )}
            </div>
          </div>

          {/* 活動時間帯 */}
          {profile?.activityTime && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">活動時間帯</h2>
              <p className="text-white">{profile.activityTime}</p>
            </div>
          )}

          {/* 自己紹介 */}
          {profile?.description && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">自己紹介</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
            </div>
          )}

          {/* SNSリンク */}
          {profile?.snsLinks && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">SNSリンク</h2>
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

          {/* 非公開の連絡先 */}
          <div id="private-contact-section" className="border-t border-gray-800 pt-4">
            <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">非公開の連絡先</h2>
            <p className="text-gray-500 text-xs mb-3">
              マッチング成立した相手にのみ公開されます。Discordユーザー名がおすすめです。
            </p>
            {editingContact ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  placeholder="例: username / Discord: username"
                  className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingContact(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveContact}
                    disabled={savingContact}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                  >
                    {savingContact ? "保存中..." : "保存する"}
                  </button>
                </div>
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

        {/* ボタン群 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/profile/edit")}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              公開プロフィールを編集
            </button>
            <button
              onClick={() => {
                setContactInput(profile?.privateContact ?? "");
                setEditingContact(true);
                document.getElementById("private-contact-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              非公開の連絡先を編集
            </button>
          </div>
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
