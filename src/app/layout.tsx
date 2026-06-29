import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/SessionProvider";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { Header } from "@/components/layout/Header";
import { SyncGitHubTokenToLocalStorage } from "@/hooks/useSyncGitHubToken";
import { ConfigDiscovery } from "@/components/providers/ConfigDiscovery";
import { AuthDialogProvider, ConfigDialogProvider } from "@/components/auth";
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
  title: "ImgX - 现代化图床管理工具",
  description: "基于 GitHub 的高性能图床服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 dark:from-slate-950 dark:via-gray-950 dark:to-slate-950 transition-colors duration-300`}>
        <ReactQueryProvider>
          <AuthProvider>
            <SyncGitHubTokenToLocalStorage />
            <AuthDialogProvider>
              <ConfigDialogProvider>
                <ConfigDiscovery />
                <div className="relative flex min-h-screen flex-col">
                  <SkipLink />
                  <Header />
                  <main id="main-content" tabIndex={-1} className="flex-1">
                    {children}
                  </main>
                  <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-2">
                    <div className="container mx-auto px-4 max-w-5xl">
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
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
              </ConfigDialogProvider>
            </AuthDialogProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
