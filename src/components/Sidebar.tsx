import { CATEGORIES, Category } from '../types';
import { cn } from '../lib/utils';
import * as Icons from 'lucide-react';

interface SidebarProps {
  currentCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export default function Sidebar({ currentCategory, onCategoryChange }: SidebarProps) {
  return (
    <div className="w-64 bg-slate-50 border-right border-slate-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-bottom border-slate-200 bg-white">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Icons.Library className="w-6 h-6 text-indigo-600" />
          DocHub Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">資料ポータルサイト</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          カテゴリー
        </div>
        {CATEGORIES.map((cat) => {
          const Icon = (Icons as any)[cat.icon];
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                currentCategory === cat.id
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {cat.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-top border-slate-200 bg-slate-50">
        <div className="text-[10px] text-slate-400 font-mono uppercase text-center">
          For Business Only
        </div>
      </div>
    </div>
  );
}
