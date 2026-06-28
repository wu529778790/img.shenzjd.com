import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/SessionProvider";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { Header } from "@/components/layout/Header";
import { SyncGitHubTokenToLocalStorage } from "@/hooks/useSyncGitHubToken";
import { SkipLink } from "@/components/layout/SkipLink";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ImgX - 个人图床管理工具",
  description: "基于 GitHub 的现代化图床服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300`}>
        <ReactQueryProvider>
          <AuthProvider>
            <SyncGitHubTokenToLocalStorage />
            <div className="relative flex min-h-screen flex-col">
              <SkipLink />
              <Header />
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
              <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-4">
                <div className="container mx-auto px-4 py-4">
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>© 2025 ImgX. 基于 GitHub 的现代化图床服务</p>
                  </div>
                </div>
              </footer>
            </div>
            <Toaster
              position="top-right"
              richColors
              duration={3000}
              closeButton
              theme="system"
            />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
