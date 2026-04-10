import { doc, setDoc, getDoc, collection, getDocs, addDoc, query, where, updateDoc, limit, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export type UserProfile = {
  uid: string;
  name: string;
  genre?: string | string[];
  activityTime?: string | string[];
  description: string;
  snsLinks: string;
  avatarUrl: string;
  email: string;
  createdAt: string;
  userType?: "vtuber" | "creator" | "vtuber_creator";
  genreCreator?: string | string[];
  acceptsRequests?: boolean;
  privateContact?: string;
  contactPlatform?: string;
  contactValue?: string;
  youtubeUrl?: string;
  youtubeTags?: string[];
  collaboWant?: string;
  collaboStyle?: string;
  activityGoal?: string;
  personalityType?: string;
  matchCount?: number;
  youtubeVideos?: { title: string; thumbnailUrl: string; videoUrl: string }[];
  youtubeVideosCachedAt?: string;
  isPublic?: boolean;
  characterGender?: string;
  personGender?: string;
};

// 他ユーザーに公開するフィールドのみ（email・privateContact・contactPlatform・contactValue を除外）
export type PublicUserProfile = Omit<UserProfile, "email" | "privateContact" | "contactPlatform" | "contactValue">;

function toPublic(u: UserProfile): PublicUserProfile {
  const { email: _e, privateContact: _p, contactPlatform: _cp, contactValue: _cv, ...rest } = u;
  return rest;
}

export async function createUserProfile(uid: string, email: string) {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    name: "",
    genre: [],
    activityTime: [],
    description: "",
    snsLinks: "",
    avatarUrl: "",
    createdAt: new Date().toISOString(),
    isPublic: true,
  });
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// 他ユーザーのプロフィールを取得（email・privateContact を除いた公開情報のみ）
export async function getPublicUserProfile(uid: string): Promise<PublicUserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? toPublic(snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

export async function getAllUsers(): Promise<PublicUserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => toPublic(d.data() as UserProfile));
}

export type Match = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "dismissed";
  message?: string;
  created_at: string;
};

export async function sendMatchRequest(senderId: string, receiverId: string): Promise<void> {
  await addDoc(collection(db, "matches"), {
    sender_id: senderId,
    receiver_id: receiverId,
    status: "pending",
    created_at: new Date().toISOString(),
  });
}

export async function getMatchBetween(senderId: string, receiverId: string): Promise<Match | null> {
  const q = query(
    collection(db, "matches"),
    where("sender_id", "==", senderId),
    where("receiver_id", "==", receiverId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Match;
}

export async function getReceivedMatches(uid: string): Promise<Match[]> {
  const q = query(collection(db, "matches"), where("receiver_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
}

export async function getSentMatches(uid: string): Promise<Match[]> {
  const q = query(collection(db, "matches"), where("sender_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
}


export async function updateMatchStatus(matchId: string, status: Match["status"]): Promise<void> {
  await updateDoc(doc(db, "matches", matchId), { status });
}

// genre/activityTime の string | string[] を string[] に正規化
export function toTagArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : value ? [value] : [];
}

// ---- みんなと共有（共有ボード）----

export const SHARE_TAGS = ["初心者向け", "ツール・機材", "クリエイティブ", "伸ばし方・考え方", "最新情報"] as const;
export type ShareTag = typeof SHARE_TAGS[number];

export type SharePost = {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  body: string;
  tag: ShareTag;
  createdAt: string;
  updatedAt?: string;
  commentCount?: number;
};

export type ShareComment = {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  createdAt: string;
};

export async function getSharePosts(maxCount = 50): Promise<SharePost[]> {
  const q = query(collection(db, "share_posts"), limit(maxCount));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as SharePost))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSharePost(postId: string): Promise<SharePost | null> {
  const snap = await getDoc(doc(db, "share_posts", postId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SharePost) : null;
}

export async function createSharePost(data: Omit<SharePost, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "share_posts"), data);
  return ref.id;
}

export async function deleteSharePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, "share_posts", postId));
}

export async function updateSharePost(postId: string, data: { title: string; body: string; tag: ShareTag }): Promise<void> {
  await updateDoc(doc(db, "share_posts", postId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getShareComments(postId: string): Promise<ShareComment[]> {
  // orderBy との複合インデックス不要にするため where のみ使用し、クライアント側でソート
  const q = query(collection(db, "share_comments"), where("postId", "==", postId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ShareComment))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createShareComment(data: Omit<ShareComment, "id">): Promise<void> {
  await addDoc(collection(db, "share_comments"), data);
  // commentCount をインクリメント
  const postRef = doc(db, "share_posts", data.postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const current = (postSnap.data().commentCount ?? 0) as number;
    await updateDoc(postRef, { commentCount: current + 1 });
  }
}
