import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-gray-500 text-sm">© 2025 Vクリ. All rights reserved.</p>
        <nav className="flex items-center gap-5">
          <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
            利用規約
          </Link>
          <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
            プライバシーポリシー
          </Link>
        </nav>
      </div>
    </footer>
  );
}
