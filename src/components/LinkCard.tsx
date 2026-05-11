import { DocLink, SOURCE_TYPES } from '../types';
import { ExternalLink, Edit2, FileText, Info } from 'lucide-react';

interface LinkCardProps {
  link: DocLink;
  onEdit: (link: DocLink) => void;
}

export default function LinkCard({ link, onEdit }: LinkCardProps) {
  const sourceLabel = SOURCE_TYPES.find(s => s.id === link.sourceType)?.label || link.sourceType;

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
              {sourceLabel}
            </span>
          </div>
          <h2 className="text-base font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
            {link.title}
          </h2>
          <p className="text-sm text-slate-500 line-clamp-2 mt-1 min-h-[2.5rem]">
            {link.description || "説明なし"}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="開く"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            onClick={() => onEdit(link)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            title="編集"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          最終更新: {link.updatedAt?.toDate?.().toLocaleDateString('ja-JP') || '不明'}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Info className="w-3 h-3" />
          クリックで詳細
        </div>
      </div>
    </div>
  );
}
