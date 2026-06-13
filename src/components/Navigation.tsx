/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Compass, Search, Library, User } from 'lucide-react';

interface NavigationProps {
  activeTab: 'home' | 'browse' | 'search' | 'library' | 'profile';
  setActiveTab: (tab: 'home' | 'browse' | 'search' | 'library' | 'profile') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: 'Listen Now', icon: Home },
    { id: 'browse', label: 'Browse', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'profile', label: 'Profile', icon: User }
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/50 dark:border-white/5 bg-white/85 dark:bg-black/80 py-2 pb-safe backdrop-blur-xl shadow-lg">
      <div className="mx-auto flex h-14 w-full max-w-5xl justify-around px-2 md:px-12">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 transition-all duration-350 cursor-pointer ${
                isActive
                  ? 'text-[#FF375F] scale-105 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <IconComponent
                  className={`h-5 w-5 transition-transform duration-300 ${
                    isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'
                  }`}
                />
                <span className="mt-1 text-[9.5px] font-medium tracking-tight whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 h-1.5 w-1.5 bg-[#FF375F] rounded-full" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
