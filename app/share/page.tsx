"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import {
  SharePost, ShareTag, SHARE_TAGS,
  getSharePosts, createSharePost, updateSharePost, deleteSharePost, getUserProfile,
} from "../../lib/firestore";

const TAG_COLORS: Record<ShareTag, string> = {
  "初心者向け":      "bg-blue-900/40 text-blue-300 border-blue-700",
  "ツール・機材":    "bg-green-900/40 text-green-300 border-green-700",
  "クリエイティブ":  "bg-purple-900/40 text-purple-300 border-purple-700",
  "伸ばし方・考え方":"bg-yellow-900/40 text-yellow-300 border-yellow-700",
  "最新情報":        "bg-red-900/40 text-red-300 border-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function ShareBoardContent() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<ShareTag | "all">("all");

  // 新規投稿フォーム
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<ShareTag | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 編集
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTag, setEditTag] = useState<ShareTag | "">("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [showMyPosts, setShowMyPosts] = useState(false);

  useEffect(() => {
    getSharePosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim() || !tag) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const profile = await getUserProfile(user.uid);
      const newPost: Omit<SharePost, "id"> = {
        authorUid: user.uid,
        authorName: profile?.name || "名前未設定",
        ...(profile?.avatarUrl ? { authorAvatarUrl: profile.avatarUrl } : {}),
        title: title.trim(),
        body: body.trim(),
        tag,
        createdAt: new Date().toISOString(),
        commentCount: 0,
      };
      const id = await createSharePost(newPost);
      setPosts((prev) => [{ id, ...newPost }, ...prev]);
      setTitle("");
      setBody("");
      setTag("");
      setShowForm(false);
    } catch (err: any) {
      setSubmitError("投稿に失敗しました: " + (err?.message ?? err));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (post: SharePost) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditTag(post.tag);
    setEditError("");
  };

  const handleEditSave = async (postId: string) => {
    if (!editTitle.trim() || !editBody.trim() || !editTag) return;
    setEditSaving(true);
    setEditError("");
    try {
      await updateSharePost(postId, { title: editTitle.trim(), body: editBody.trim(), tag: editTag as ShareTag });
      const updatedAt = new Date().toISOString();
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, title: editTitle.trim(), body: editBody.trim(), tag: editTag as ShareTag, updatedAt } : p
      ));
      setEditingId(null);
    } catch (err: any) {
      setEditError("保存に失敗しました: " + (err?.message ?? err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("この投稿を削除しますか？")) return;
    try {
      await deleteSharePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      alert("削除に失敗しました: " + (err?.message ?? err));
    }
  };

  const myPosts = user ? posts.filter((p) => p.authorUid === user.uid) : [];
  const displayed = showMyPosts
    ? myPosts
    : filterTag === "all" ? posts : posts.filter((p) => p.tag === filterTag);

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ヘッダー */}
        <div className="mb-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">みんなと共有</h1>
              <p className="text-gray-400 text-sm mt-1">ナレッジを共有するボードです</p>
            </div>
            {/* デスクトップのみ右側にボタン表示 */}
            {user && (
              <div className="hidden md:flex gap-2 shrink-0">
                <button
                  onClick={() => { setShowMyPosts(false); setShowForm((v) => !v); setSubmitError(""); }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  {showForm ? "閉じる" : "記事を書く"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setShowMyPosts((v) => !v); }}
                  className={`font-bold px-3 py-2 rounded-lg text-sm transition-colors border ${
                    showMyPosts
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {showMyPosts ? "閉じる" : "過去投稿を編集"}
                </button>
              </div>
            )}
          </div>
          {/* スマホ：テキストの下にボタンを表示 */}
          {user && (
            <div className="flex md:hidden gap-2 mt-3">
              <button
                onClick={() => { setShowMyPosts(false); setShowForm((v) => !v); setSubmitError(""); }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {showForm ? "閉じる" : "記事を書く"}
              </button>
              <button
                onClick={() => { setShowForm(false); setShowMyPosts((v) => !v); }}
                className={`font-bold px-3 py-2 rounded-lg text-sm transition-colors border ${
                  showMyPosts
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {showMyPosts ? "閉じる" : "過去投稿を編集"}
              </button>
            </div>
          )}
        </div>

        {/* ベータ案内 */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 mb-6 text-gray-400 text-sm leading-relaxed">
          現在Vクリマッチングはベータ版です。書き方や形式などはあまり細かく気にせず、VTuber活動を頑張るみんなに共有したい情報を気軽にあげてみてください！
        </div>

        {/* 投稿フォーム */}
        {showForm && user && (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 mb-6 space-y-4">
            {/* タグ選択 */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">タグ <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap gap-2">
                {SHARE_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      tag === t
                        ? TAG_COLORS[t] + " ring-2 ring-offset-1 ring-offset-gray-900 ring-current"
                        : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">タイトル <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="記事のタイトル"
                maxLength={100}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">本文 <span className="text-red-400">*</span></label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="共有したいナレッジや情報を書いてください"
                rows={6}
                maxLength={2000}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm resize-none"
              />
              <p className="text-gray-500 text-xs mt-1 text-right">{body.length} / 2000</p>
            </div>
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim() || !tag}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              {submitting ? "投稿中..." : "投稿する"}
            </button>
          </form>
        )}

        {/* ログインしていない場合の案内 */}
        {!user && (
          <div className="bg-gray-900/50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-400 border border-gray-800">
            <Link href="/login" className="text-purple-400 hover:underline">ログイン</Link>すると記事を投稿できます
          </div>
        )}

        {/* タグフィルター（記事を書く・過去投稿を編集中は非表示） */}
        {!showForm && !showMyPosts && <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterTag("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filterTag === "all"
                ? "bg-gray-600 text-white border-gray-500"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
            }`}
          >
            すべて
          </button>
          {SHARE_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTag(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterTag === t
                  ? TAG_COLORS[t] + " ring-1 ring-current"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>}

        {/* 過去投稿を編集モード：見出し */}
        {showMyPosts && (
          <div className="mb-4">
            <p className="text-white font-bold text-sm">自分の投稿（{myPosts.length}件）</p>
            {myPosts.length === 0 && <p className="text-gray-500 text-sm mt-2">まだ投稿がありません</p>}
          </div>
        )}

        {/* 記事一覧 */}
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-gray-400">
              {filterTag === "all" ? "まだ投稿がありません" : `「${filterTag}」の投稿はまだありません`}
            </p>
            {filterTag === "all" && <p className="text-gray-500 text-sm mt-1">最初の記事を書いてみましょう！</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((post) => (
              <div key={post.id}>
                {/* 編集モード */}
                {editingId === post.id ? (
                  <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
                    <p className="text-white font-bold text-sm">記事を編集</p>
                    {/* タグ選択 */}
                    <div className="flex flex-wrap gap-2">
                      {SHARE_TAGS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditTag(t)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            editTag === t
                              ? TAG_COLORS[t] + " ring-2 ring-offset-1 ring-offset-gray-900 ring-current"
                              : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={100}
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={6}
                      maxLength={2000}
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm resize-none"
                    />
                    {editError && <p className="text-red-400 text-sm">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(post.id)}
                        disabled={editSaving || !editTitle.trim() || !editBody.trim() || !editTag}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        {editSaving ? "保存中..." : "保存する"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 通常表示 */
                  <Link
                    href={`/share/${post.id}`}
                    className="block bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 transition-colors"
                    onClick={(e) => {
                      // 編集・削除ボタンのクリックは遷移しない
                      const target = e.target as HTMLElement;
                      if (target.closest("[data-action]")) e.preventDefault();
                    }}
                  >
                    {/* タグ */}
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full border mb-3 ${TAG_COLORS[post.tag] ?? "bg-gray-700 text-gray-300 border-gray-600"}`}>
                      {post.tag}
                    </span>
                    <h2 className="text-white font-bold text-lg mb-2 line-clamp-2">{post.title}</h2>
                    <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4">{post.body}</p>
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {post.authorAvatarUrl ? (
                            <img src={post.authorAvatarUrl} alt={post.authorName} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">?</div>
                          )}
                          <span>{post.authorName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {(post.commentCount ?? 0) > 0 && <span>💬 {post.commentCount}</span>}
                          <span>
                            {post.updatedAt
                              ? `最終更新：${formatDate(post.updatedAt)}`
                              : formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>
                      {/* 投稿者本人のみ編集・削除（独立した行でモバイルでも確実に表示） */}
                      {user?.uid === post.authorUid && (
                        <div className="flex justify-end gap-3 mt-2" data-action>
                          <button
                            data-action
                            onClick={() => startEdit(post)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            編集
                          </button>
                          <button
                            data-action
                            onClick={() => handleDelete(post.id)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950"><p className="text-gray-400">読み込み中...</p></div>}>
      <ShareBoardContent />
    </Suspense>
  );
}
