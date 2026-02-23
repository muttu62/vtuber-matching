import { doc, setDoc, getDoc, collection, getDocs, addDoc, query, where, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export type UserProfile = {
  uid: string;
  name: string;
  genre: string;
  activityTime: string;
  description: string;
  snsLinks: string;
  avatarUrl: string;
  email: string;
  createdAt: string;
  userType?: "vtuber" | "creator" | "vtuber_creator";
  genreCreator?: string;
  acceptsRequests?: boolean;
  privateContact?: string;
  youtubeUrl?: string;
  youtubeTags?: string[];
};

// 他ユーザーに公開するフィールドのみ（email・privateContact を除外）
export type PublicUserProfile = Omit<UserProfile, "email" | "privateContact">;

function toPublic(u: UserProfile): PublicUserProfile {
  const { email: _e, privateContact: _p, ...rest } = u;
  return rest;
}

export async function createUserProfile(uid: string, email: string) {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    name: "",
    genre: "",
    activityTime: "",
    description: "",
    snsLinks: "",
    avatarUrl: "",
    createdAt: new Date().toISOString(),
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

export async function sendMatchRequest(senderId: string, receiverId: string, message?: string): Promise<void> {
  await addDoc(collection(db, "matches"), {
    sender_id: senderId,
    receiver_id: receiverId,
    status: "pending",
    message: message ?? "",
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

export async function getSentMatchesToday(uid: string): Promise<Match[]> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();
  const q = query(collection(db, "matches"), where("sender_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Match))
    .filter((m) => m.created_at >= todayStartISO);
}

export async function updateMatchStatus(matchId: string, status: Match["status"]): Promise<void> {
  await updateDoc(doc(db, "matches", matchId), { status });
}
