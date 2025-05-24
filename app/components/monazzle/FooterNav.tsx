'use client';

import React from 'react';
import {
  LayoutGrid, // For Play/Explore - could also be Gamepad2, Puzzle
  ShieldAlert, // For Challenges - could also be Swords, Zap
  BookOpen,    // For How To Play
  UserCircle,  // For Profile
} from 'lucide-react';
import { NavigationTab } from '../../page'; // Assuming page.tsx is in app directory

interface FooterNavProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

const iconSize = 28;
const activeIconColor = "text-mona-purple";
const inactiveIconColor = "text-mona-cream hover:text-mona-lavender";

export function FooterNav({ activeTab, onNavigate }: FooterNavProps) {
  const navItems = [
    {
      tab: NavigationTab.PLAY,
      icon: <LayoutGrid size={iconSize} className={activeTab === NavigationTab.PLAY ? activeIconColor : inactiveIconColor} />,
      label: 'Play',
    },
    {
      tab: NavigationTab.CHALLENGES,
      icon: <ShieldAlert size={iconSize} className={activeTab === NavigationTab.CHALLENGES ? activeIconColor : inactiveIconColor} />,
      label: 'Challenges',
    },
    {
      tab: NavigationTab.HOW_TO_PLAY,
      icon: <BookOpen size={iconSize} className={activeTab === NavigationTab.HOW_TO_PLAY ? activeIconColor : inactiveIconColor} />,
      label: 'How To Play',
    },
    {
      tab: NavigationTab.PROFILE,
      icon: <UserCircle size={iconSize} className={activeTab === NavigationTab.PROFILE ? activeIconColor : inactiveIconColor} />,
      label: 'Profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-mona-onyx/80 backdrop-blur-xl border-t border-mona-slate/30 flex items-center justify-around shadow-t-2xl z-50">
      {navItems.map((item) => (
        <button
          key={item.tab}
          onClick={() => onNavigate(item.tab)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-1/4 h-full ${ 
            activeTab === item.tab ? 'text-mona-purple' : 'text-mona-cream hover:text-mona-lavender'
          }`}
          aria-label={item.label}
        >
          {item.icon}
          <span className={`mt-1 text-xs font-medium ${activeTab === item.tab ? 'text-mona-purple' : 'text-mona-slate'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
} 