'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-border-dark px-6 pb-6 pt-3 flex justify-between items-end z-40">
      <Link href="/" className="flex flex-col items-center gap-1 group">
        <div className={`p-1 rounded-full transition-colors ${pathname === '/' ? 'bg-slate-100 dark:bg-[#262626]' : 'group-hover:bg-slate-100 dark:group-hover:bg-[#262626]'}`}>
          <span className={`material-symbols-outlined text-[24px] ${pathname === '/' ? 'text-primary dark:text-white font-variation-settings-fill' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
            home
          </span>
        </div>
        <span className={`text-[10px] font-medium ${pathname === '/' ? 'text-primary dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
          Home
        </span>
      </Link>

      <Link href="/posts" className="flex flex-col items-center gap-1 group">
        <div className={`p-1 rounded-full transition-colors ${pathname === '/posts' ? 'bg-slate-100 dark:bg-[#262626]' : 'group-hover:bg-slate-100 dark:group-hover:bg-[#262626]'}`}>
          <span className={`material-symbols-outlined text-[24px] ${pathname === '/posts' ? 'text-primary dark:text-white font-variation-settings-fill' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
            description
          </span>
        </div>
        <span className={`text-[10px] font-medium ${pathname === '/posts' ? 'text-primary dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
          Contenuti
        </span>
      </Link>

      <div className="relative -top-5">
        <Link href="/generate" className="size-14 rounded-full bg-gradient-to-br from-primary to-primary-light shadow-lg shadow-primary/40 flex items-center justify-center text-white active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[28px]">add</span>
        </Link>
      </div>

      <Link href="/calendar" className="flex flex-col items-center gap-1 group">
        <div className={`p-1 rounded-full transition-colors ${pathname === '/calendar' ? 'bg-slate-100 dark:bg-[#262626]' : 'group-hover:bg-slate-100 dark:group-hover:bg-[#262626]'}`}>
          <span className={`material-symbols-outlined text-[24px] ${pathname === '/calendar' ? 'text-primary dark:text-white font-variation-settings-fill' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
            calendar_today
          </span>
        </div>
        <span className={`text-[10px] font-medium ${pathname === '/calendar' ? 'text-primary dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
          Calendario
        </span>
      </Link>

      <Link href="/settings" className="flex flex-col items-center gap-1 group">
        <div className={`p-1 rounded-full transition-colors ${pathname === '/settings' ? 'bg-slate-100 dark:bg-[#262626]' : 'group-hover:bg-slate-100 dark:group-hover:bg-[#262626]'}`}>
          <span className={`material-symbols-outlined text-[24px] ${pathname === '/settings' ? 'text-primary dark:text-white font-variation-settings-fill' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
            settings
          </span>
        </div>
        <span className={`text-[10px] font-medium ${pathname === '/settings' ? 'text-primary dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
          Impostazioni
        </span>
      </Link>
    </nav>
  );
}
