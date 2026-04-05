import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OnboardingModal from "../components/OnboardingModal";

export const metadata: Metadata = {
  title: "Vクリ",
  description: "VTuberとクリエイターのコラボ相手マッチングサービス",
  icons: {
    icon: "https://res.cloudinary.com/djl6ceb4w/image/upload/v1775340349/favicon_ktprcr.png",
    shortcut: "https://res.cloudinary.com/djl6ceb4w/image/upload/v1775340349/favicon_ktprcr.png",
    apple: "https://res.cloudinary.com/djl6ceb4w/image/upload/v1775340349/favicon_ktprcr.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <OnboardingModal />
        </AuthProvider>
      </body>
    </html>
  );
}
