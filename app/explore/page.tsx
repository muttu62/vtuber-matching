"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAllUsers, getUserProfile, PublicUserProfile, toTagArray } from "../../lib/firestore";
import { useAuth } from "../../lib/AuthContext";
import PickupModal from "../../components/PickupModal";

type FilterTab = "all" | "vtuber" | "creator" | "compatible";

const USER_TYPE_LABEL: Record<string, string> = {
  vtuber: "VTuber",
  creator: "クリエイター",
  vtuber_creator: "VTuber兼クリエイター",
};

// 相性マップ: personalityType の emoji+name → 相性の良いタイプ名リスト
const COMPATIBLE_MAP: Record<string, string[]> = {
  "🎭ムードメーカー型":   ["🎭ムードメーカー型", "🧠戦略家型"],
  "🎯職人クリエイター型": ["🎯職人クリエイター型", "🎭ムードメーカー型"],
  "🌟アイドル型":         ["🌟アイドル型", "🔥チャレンジャー型"],
  "🧠戦略家型":           ["🧠戦略家型", "🌿癒し系型"],
  "🌿癒し系型":           ["🌿癒し系型", "🎯職人クリエイター型"],
  "🔥チャレンジャー型":   ["🔥チャレンジャー型", "🌟アイドル型"],
};

function countShared(a: string[] | undefined, b: string[]): number {
  if (!a || b.length === 0) return 0;
  return a.filter((t) => b.includes(t)).length;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [myTags, setMyTags] = useState<string[]>([]);
  const [myPersonalityType, setMyPersonalityType] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showPickup, setShowPickup] = useState(false);
  const [showPersonalityPromo, setShowPersonalityPromo] = useState(false);
  const tourStartedRef = useRef(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  // URLパラメータ tab=compatibility で相性タブを自動選択
  useEffect(() => {
    if (searchParams.get("tab") === "compatibility") setFilter("compatible");
  }, [searchParams]);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setMyTags([]);
      setMyPersonalityType(null);
      return;
    }
    getUserProfile(user.uid).then((p) => {
      setMyTags(p?.youtubeTags ?? []);
      setMyPersonalityType(p?.personalityType ?? null);
    });
  }, [user]);

  // driver.js オンボーディングツアー
  useEffect(() => {
    if (loading || !user || tourStartedRef.current) return;
    if (localStorage.getItem("onboarding_completed")) {
      setOnboardingDone(true);
      return;
    }
    tourStartedRef.current = true;

    const timer = setTimeout(() => {
      // 表示されている要素を取得（モバイル/デスクトップ対応）
      const getEl = (key: string): HTMLElement | undefined => {
        const els = Array.from(
          document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`)
        );
        return els.find((el) => el.getBoundingClientRect().width > 0) ?? els[0] ?? undefined;
      };

      const driverObj = driver({
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "次へ",
        prevBtnText: "戻る",
        doneBtnText: "はじめる",
        onDestroyed: () => {
          localStorage.setItem("onboarding_completed", "true");
          setOnboardingDone(true);
        },
        steps: [
          {
            popover: {
              title: "ようこそ、Vクリマッチングへ！🎉",
              description: "ここから気になるユーザーを探すことができます。",
            },
          },
          {
            element: getEl("tabs"),
            popover: {
              title: "ラベルで絞り込もう",
              description: "ラベルで分類ごとにユーザーをチェックできます。",
            },
          },
          {
            element: getEl("compatibility-tab"),
            popover: {
              title: "相性のいい人",
              description: "相性診断の結果から導き出された、あなたと相性ぴったりのおすすめの人です。",
            },
          },
          {
            element: getEl("diagnosis-nav"),
            popover: {
              title: "相性診断はこちら",
              description: "相性診断は「相性診断」タブから行うことができます。",
            },
          },
          {
            element: getEl("share-nav"),
            popover: {
              title: "みんなと共有",
              description: "VTuber活動に役立つ情報をみんなと共有できる場所です。",
            },
          },
          {
            element: getEl("mypage-nav"),
            popover: {
              title: "プロフィールを設定しよう",
              description:
                "まずはマイページにてプロフィールと非公開の連絡先を設定しましょう。非公開の連絡先が設定されていないと、相手と連絡をとることができません。",
            },
          },
          {
            popover: {
              title: "準備完了！✨",
              description: "それではよいVライフを！",
            },
          },
        ],
      });

      driverObj.drive();
    }, 600);

    return () => clearTimeout(timer);
  }, [user, loading]);

  // 1日1回ポップアップ表示（ログイン済み・未診断・全データ読込後・オンボーディング完了後）
  useEffect(() => {
    if (!user || loading || myPersonalityType === undefined || myPersonalityType !== null) return;
    if (!onboardingDone) return;
    const today = new Date().toISOString().slice(0, 10);
    const shown = localStorage.getItem("pickup_shown_date");
    if (shown !== today) {
      localStorage.setItem("pickup_shown_date", today);
      setShowPickup(true);
    }
  }, [user, loading, myPersonalityType, onboardingDone]);

  // 性格診断をしていないユーザーへのプロモポップアップ
  useEffect(() => {
    if (myPersonalityType === undefined) return; // まだ読み込み中
    // ログイン済みはオンボーディング完了後に表示
    if (user && !onboardingDone) return;
    const today = new Date().toISOString().slice(0, 10);
    const dismissed = localStorage.getItem("personality_promo_dismissed");
    if (dismissed === today) return;
    // ログイン済みで未診断、またはログインしていない場合に表示
    if (!myPersonalityType) {
      setShowPersonalityPromo(true);
    }
  }, [myPersonalityType, onboardingDone, user]);

  // isPublic=false のユーザーを除外、creator は acceptsRequests=true のみ
  const visibleUsers = users.filter(
    (u) => u.isPublic !== false && (u.userType !== "creator" || u.acceptsRequests === true)
  );

  // 相性の良いユーザー一覧
  const compatibleTypes = myPersonalityType ? (COMPATIBLE_MAP[myPersonalityType] ?? []) : [];
  const compatibleUsers = visibleUsers.filter(
    (u) => u.uid !== user?.uid && u.personalityType && compatibleTypes.includes(u.personalityType)
  );

  const filtered =
    filter === "all"
      ? visibleUsers
      : filter === "compatible"
      ? compatibleUsers
      : visibleUsers.filter((u) => {
          if (filter === "vtuber") return u.userType === "vtuber" || u.userType === "vtuber_creator";
          if (filter === "creator") return u.userType === "creator" || u.userType === "vtuber_creator";
          return false;
        });

  // ログイン済みで自分のタグがあれば共通タグ数で降順ソート（相性タブ以外）
  const displayed =
    filter !== "compatible" && myTags.length > 0
      ? [...filtered].sort(
          (a, b) => countShared(b.youtubeTags, myTags) - countShared(a.youtubeTags, myTags)
        )
      : filtered;

  const tabs: { key: FilterTab; label: string; special?: boolean }[] = [
    { key: "all", label: "すべて" },
    { key: "vtuber", label: "VTuber" },
    { key: "creator", label: "クリエイター" },
    { key: "compatible", label: "💜 相性の良い人", special: true },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      {showPickup && user && (
        <PickupModal
          users={visibleUsers}
          myUid={user.uid}
          myPersonalityType={myPersonalityType ?? null}
          onClose={() => setShowPickup(false)}
        />
      )}

      {/* 未診断ユーザー向け性格診断プロモポップアップ */}
      {showPersonalityPromo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-purple-700">
            <div className="text-5xl mb-4">🎭</div>
            <h2 className="text-xl font-bold text-white mb-3">
              相性の良い仲間が見つかる！
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              性格診断を受けると、あなたにぴったりの
              VTuber・クリエイターが自動で提案されます。
              一緒にVTuber活動を楽しめる仲間を見つけよう！
            </p>
            <a
              href="/personality-test"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors mb-3"
            >
              🎭 性格診断を受ける
            </a>
            <button
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                localStorage.setItem("personality_promo_dismissed", today);
                setShowPersonalityPromo(false);
              }}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              今日はスキップ
            </button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-6">ユーザーを探す</h1>

      {/* フィルタータブ */}
      <div className="flex gap-2 mb-6 flex-wrap" data-tour="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            data-tour={tab.key === "compatible" ? "compatibility-tab" : undefined}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? tab.special
                  ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-950"
                  : "bg-purple-600 text-white"
                : tab.special
                ? "bg-purple-900/40 text-purple-300 border border-purple-700 hover:bg-purple-800/50 hover:text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filter === "compatible" ? (
        /* 相性タブ */
        !user ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-3">ログインすると相性の良い人が表示されます</p>
            <Link href="/login" className="text-purple-400 hover:underline text-sm">ログインする →</Link>
          </div>
        ) : myPersonalityType === undefined ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : !myPersonalityType ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎭</p>
            <p className="text-white font-bold mb-2">性格診断がまだ完了していません</p>
            <p className="text-gray-400 text-sm mb-6">
              性格診断を受けると、相性の良いユーザーが表示されます！
            </p>
            <Link
              href="/personality-test"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              性格診断を受ける →
            </Link>
          </div>
        ) : loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : (
          <>
            {compatibleUsers.length > 0 && (
              <>
                <p className="text-gray-500 text-xs mb-4">
                  あなた（{myPersonalityType}）と相性の良い人を表示しています
                </p>
                <UserGrid users={compatibleUsers} myTags={myTags} showCompatible />
              </>
            )}
            {compatibleUsers.length < 15 && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`}</style>
                <p className="text-sm text-gray-400">ぶいくりん は こまった</p>
                <svg width="60" height="72" viewBox="-10 -60 140 220" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                  <g style={{animation:"float 2s ease-in-out infinite"}}>
                    <rect x="32" y="-48" width="8" height="8" fill="#7F77DD"/><rect x="88" y="-48" width="8" height="8" fill="#AFA9EC"/>
                    <rect x="32" y="-40" width="8" height="8" fill="#7F77DD"/><rect x="40" y="-40" width="8" height="8" fill="#AFA9EC"/><rect x="80" y="-40" width="8" height="8" fill="#7F77DD"/><rect x="88" y="-40" width="8" height="8" fill="#AFA9EC"/>
                    <rect x="32" y="-32" width="8" height="8" fill="#7F77DD"/><rect x="40" y="-32" width="8" height="8" fill="#AFA9EC"/><rect x="48" y="-32" width="8" height="8" fill="#AFA9EC"/><rect x="80" y="-32" width="8" height="8" fill="#7F77DD"/><rect x="88" y="-32" width="8" height="8" fill="#7F77DD"/>
                    <rect x="40" y="-24" width="8" height="8" fill="#7F77DD"/><rect x="48" y="-24" width="8" height="8" fill="#AFA9EC"/><rect x="72" y="-24" width="8" height="8" fill="#7F77DD"/><rect x="80" y="-24" width="8" height="8" fill="#7F77DD"/><rect x="88" y="-24" width="8" height="8" fill="#7F77DD"/>
                    <rect x="56" y="-16" width="8" height="8" fill="#7F77DD"/><rect x="64" y="-16" width="8" height="8" fill="#7F77DD"/><rect x="72" y="-16" width="8" height="8" fill="#7F77DD"/>
                    <rect x="32" y="-8" width="8" height="8" fill="#7F77DD"/><rect x="40" y="-8" width="8" height="8" fill="#7F77DD"/><rect x="48" y="-8" width="8" height="8" fill="#7F77DD"/><rect x="56" y="-8" width="8" height="8" fill="#7F77DD"/><rect x="64" y="-8" width="8" height="8" fill="#7F77DD"/><rect x="72" y="-8" width="8" height="8" fill="#7F77DD"/><rect x="80" y="-8" width="8" height="8" fill="#AFA9EC"/><rect x="88" y="-8" width="8" height="8" fill="#AFA9EC"/>
                    <rect x="16" y="0" width="8" height="8" fill="#AFA9EC"/><rect x="24" y="0" width="8" height="8" fill="#7F77DD"/><rect x="32" y="0" width="8" height="8" fill="#7F77DD"/><rect x="40" y="0" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="0" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="0" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="0" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="0" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="0" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="0" width="8" height="8" fill="#7F77DD"/><rect x="96" y="0" width="8" height="8" fill="#AFA9EC"/><rect x="104" y="0" width="8" height="8" fill="#AFA9EC"/>
                    <rect x="8" y="8" width="8" height="8" fill="#AFA9EC"/><rect x="16" y="8" width="8" height="8" fill="#AFA9EC"/><rect x="24" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="8" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="8" width="8" height="8" fill="#7F77DD"/><rect x="112" y="8" width="8" height="8" fill="#AFA9EC"/>
                    <rect x="8" y="16" width="8" height="8" fill="#AFA9EC"/><rect x="16" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="16" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="16" width="8" height="8" fill="#AFA9EC"/>
                    <rect x="8" y="24" width="8" height="8" fill="#D3D1C7"/><rect x="16" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="24" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="24" width="8" height="8" fill="#D3D1C7"/>
                    <rect x="8" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="32" width="8" height="8" fill="#888780"/><rect x="32" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="32" width="8" height="8" fill="#888780"/><rect x="104" y="32" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="32" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="40" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="40" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="40" width="8" height="8" fill="#D3D1C7"/><rect x="32" y="40" width="8" height="8" fill="#444441"/><rect x="40" y="40" width="8" height="8" fill="#B4B2A9"/><rect x="48" y="40" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="40" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="40" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="40" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="40" width="8" height="8" fill="#B4B2A9"/><rect x="88" y="40" width="8" height="8" fill="#444441"/><rect x="96" y="40" width="8" height="8" fill="#D3D1C7"/><rect x="104" y="40" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="40" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="48" width="8" height="8" fill="#444441"/><rect x="48" y="48" width="8" height="8" fill="#2C2C2A"/><rect x="56" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="48" width="8" height="8" fill="#2C2C2A"/><rect x="80" y="48" width="8" height="8" fill="#444441"/><rect x="88" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="48" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="48" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="56" width="8" height="8" fill="#2C2C2A"/><rect x="40" y="56" width="8" height="8" fill="#444441"/><rect x="48" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="56" width="8" height="8" fill="#444441"/><rect x="88" y="56" width="8" height="8" fill="#2C2C2A"/><rect x="96" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="56" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="56" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="64" width="8" height="8" fill="#444441"/><rect x="32" y="64" width="8" height="8" fill="#D3D1C7"/><rect x="40" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="64" width="8" height="8" fill="#D3D1C7"/><rect x="96" y="64" width="8" height="8" fill="#444441"/><rect x="104" y="64" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="64" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="72" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="72" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="80" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="80" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="16" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="88" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="88" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="96" width="8" height="8" fill="#D3D1C7"/><rect x="16" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="40" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="80" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="96" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="96" width="8" height="8" fill="#F1EFE8"/>
                    <rect x="8" y="104" width="8" height="8" fill="#D3D1C7"/><rect x="16" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="24" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="48" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="56" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="88" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="96" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="104" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="104" width="8" height="8" fill="#D3D1C7"/>
                    <rect x="8" y="112" width="8" height="8" fill="#444441"/><rect x="16" y="112" width="8" height="8" fill="#B4B2A9"/><rect x="24" y="112" width="8" height="8" fill="#F1EFE8"/><rect x="32" y="112" width="8" height="8" fill="#B4B2A9"/><rect x="48" y="112" width="8" height="8" fill="#B4B2A9"/><rect x="56" y="112" width="8" height="8" fill="#F1EFE8"/><rect x="64" y="112" width="8" height="8" fill="#F1EFE8"/><rect x="72" y="112" width="8" height="8" fill="#B4B2A9"/><rect x="88" y="112" width="8" height="8" fill="#B4B2A9"/><rect x="96" y="112" width="8" height="8" fill="#F1EFE8"/><rect x="104" y="112" width="8" height="8" fill="#F1EFE8"/><rect x="112" y="112" width="8" height="8" fill="#444441"/>
                  </g>
                </svg>
                <p className="text-gray-400 text-sm">まだまだユーザーが少ないみたい...</p>
                <a
                  href="https://twitter.com/intent/tweet?text=VTuber%E3%81%AE%E7%9B%B8%E6%80%A7%E8%A8%BA%E6%96%ADやってみた！あなたも試してみて👇%0Ahttps://v-kuri.com/personality-test%0A%23Vクリマッチング%20%23VTuber診断"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  𝕏で共有してみんなに診断してもらう
                </a>
              </div>
            )}
          </>
        )
      ) : (
        /* 通常タブ */
        <>
          {myTags.length > 0 && (
            <p className="text-gray-500 text-xs mb-4">あなたのYouTubeタグとの共通数が多い順に表示しています</p>
          )}
          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : displayed.length === 0 ? (
            <p className="text-gray-400">まだユーザーがいません</p>
          ) : (
            <UserGrid users={displayed} myTags={myTags} />
          )}
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">読み込み中...</p></div>}>
      <ExploreContent />
    </Suspense>
  );
}

function UserGrid({
  users,
  myTags,
  showCompatible,
}: {
  users: PublicUserProfile[];
  myTags: string[];
  showCompatible?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((u) => {
        const shared = countShared(u.youtubeTags, myTags);
        return (
          <Link
            key={u.uid}
            href={`/profile/${u.uid}`}
            className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-2 hover:bg-gray-800 transition-colors relative"
          >
            {showCompatible && u.personalityType && (
              <span className="absolute top-4 right-4 text-xs bg-purple-600/80 text-white px-2 py-0.5 rounded-full">
                {u.personalityType}
              </span>
            )}
            {!showCompatible && shared > 0 && (
              <span className="absolute top-4 right-4 text-xs bg-purple-600/80 text-white px-2 py-0.5 rounded-full">
                共通{shared}タグ
              </span>
            )}
            {u.avatarUrl ? (
              <img
                src={u.avatarUrl}
                alt={u.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-gray-400">
                ?
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-lg">{u.name || "名前未設定"}</p>
              {u.userType && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.userType === "vtuber"
                    ? "bg-blue-900/50 text-blue-300"
                    : u.userType === "vtuber_creator"
                    ? "bg-orange-900/50 text-orange-300"
                    : "bg-green-900/50 text-green-300"
                }`}>
                  {USER_TYPE_LABEL[u.userType]}
                </span>
              )}
            </div>
            {toTagArray(u.genre).map((g) => (
              <span key={g} className="text-xs text-purple-300 bg-purple-900/40 px-2 py-1 rounded-full w-fit">
                {g}
              </span>
            ))}
            {toTagArray(u.genreCreator).map((g) => (
              <span key={g} className="text-xs text-green-300 bg-green-900/40 px-2 py-1 rounded-full w-fit">
                {g}
              </span>
            ))}
            {toTagArray(u.activityTime).length > 0 && (
              <p className="text-gray-400 text-sm">
                活動時間: {toTagArray(u.activityTime).join(" / ")}
              </p>
            )}
            {u.description && (
              <p className="text-gray-300 text-sm line-clamp-3">{u.description}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
