import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { getServerAuthUser } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "본아이에프 챗봇",
  description: "본아이에프 사장님 및 관리자를 위한 운영 매뉴얼 챗봇 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getServerAuthUser();

  return (
    <html lang="ko">
      <body className="antialiased font-sans text-slate-900 bg-white">
        <ToastProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
