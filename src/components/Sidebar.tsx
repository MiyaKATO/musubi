import { Category, TabId, CategoryData } from '../types';
import { cn } from '../lib/utils';
import * as Icons from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  categories: CategoryData[];
  user: User | null;
  onManageCategories: () => void;
}

export default function Sidebar({ activeTab, onTabChange, categories, user, onManageCategories }: SidebarProps) {
  const isVerifiedUser = user?.emailVerified === true && user?.email?.endsWith('@yubisui.co.jp') === true;

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-200 bg-white">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Icons.Library className="w-6 h-6 text-indigo-600" />
          Musubi Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">資料ポータルサイト</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button
          onClick={() => onTabChange('home')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
            activeTab === 'home'
              ? "bg-indigo-50 text-indigo-700 shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Icons.Home className="w-4 h-4" />
          ホーム画面
        </button>

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-6 mb-2 flex items-center justify-between">
          <span>カテゴリー</span>
          {isVerifiedUser && (
            <button
              onClick={onManageCategories}
              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded transition-all cursor-pointer"
              title="カテゴリーを管理"
            >
              <Icons.Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {categories.map((cat) => {
          const Icon = (Icons as any)[cat.icon] || Icons.Folder;
          return (
            <button
              key={cat.id}
              onClick={() => onTabChange(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium text-left",
                activeTab === cat.id
                  ? "bg-indigo-50 text-indigo-700 shadow-sm animate-pulse-subtle"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-[10px] text-slate-400 font-mono uppercase text-center">
          For Business Only
        </div>
      </div>
    </div>
  );
}
