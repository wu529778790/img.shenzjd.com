import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/SessionProvider";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { Header } from "@/components/layout/Header";
import { SyncGitHubTokenToLocalStorage } from "@/hooks/useSyncGitHubToken";
import { ConfigDiscovery } from "@/components/providers/ConfigDiscovery";
import { AuthDialogProvider } from "@/components/auth";
import { SkipLink } from "@/components/layout/SkipLink";
import { OfflineIndicator } from "@/components/layout/OfflineIndicator";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-mono',
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
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground transition-colors duration-300`}>
        <OfflineIndicator />
        <ReactQueryProvider>
          <AuthProvider>
            <SyncGitHubTokenToLocalStorage />
            <AuthDialogProvider>
              <ConfigDiscovery />
              <div className="relative flex min-h-screen flex-col">
                <SkipLink />
                <Header />
                <main id="main-content" tabIndex={-1} className="flex-1">
                  {children}
                </main>
                <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-4">
                  <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>© 2025 ImgX</span>
                      <span className="hidden sm:inline">·</span>
                      <a
                        href="https://github.com/wu529778790/img.shenzjd.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        Powered by ImgX
                      </a>
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
            </AuthDialogProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
