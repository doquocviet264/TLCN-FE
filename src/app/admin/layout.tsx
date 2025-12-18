"use client";
import { Provider } from 'react-redux';
import { store } from './store/store';
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import SideBar from './SideBar';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <Provider store={store}>
      <div className={`min-h-screen bg-slate-100 ${inter.variable}`}>
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-64 shadow-xl z-50">
          <SideBar />
        </aside>

        {/* Main Content */}
        <QueryClientProvider client={queryClient}>
          <main className="ml-64">
            <div className="min-h-screen">
              {children}
            </div>
          </main>
        </QueryClientProvider>
      </div>
    </Provider>
  );
}
