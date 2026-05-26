import React, { useState } from 'react';
import { CategoryData, DocLink } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Folder, Layout, CheckSquare, BookOpen, FileText, Briefcase, Users, MessageSquare, Shield, Database, ChevronUp, ChevronDown } from 'lucide-react';

const ICON_PRESETS = [
  { id: 'Folder', label: 'フォルダ', icon: Folder },
  { id: 'Layout', label: '設計/レイアウト', icon: Layout },
  { id: 'CheckSquare', label: 'テスト/完了', icon: CheckSquare },
  { id: 'BookOpen', label: '知識/マニュアル', icon: BookOpen },
  { id: 'FileText', label: 'ドキュメント', icon: FileText },
  { id: 'Briefcase', label: '業務/ビジネス', icon: Briefcase },
  { id: 'Users', label: '組織/チーム', icon: Users },
  { id: 'MessageSquare', label: '連絡/コミュニケーション', icon: MessageSquare },
  { id: 'Shield', label: 'セキュリティ', icon: Shield },
  { id: 'Database', label: 'システム/DB', icon: Database },
];

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryData[];
  onAddCategory: (id: string, label: string, icon: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onReorderCategories: (orderedCategories: CategoryData[]) => Promise<void>;
  links: DocLink[];
}

export default function CategoryManagerDialog({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  onReorderCategories,
  links
}: CategoryManagerDialogProps) {
  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    await onReorderCategories(reordered);
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    await onReorderCategories(reordered);
  };

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    const trimmedId = newId.trim().toLowerCase();
    const trimmedLabel = newLabel.trim();

    if (!trimmedId) {
      setErrorMsg('カテゴリーIDを入力してください。');
      return;
    }
    if (!/^[a-z0-9-_]+$/.test(trimmedId)) {
      setErrorMsg('カテゴリーIDは半角小文字・数字、ハイフン、アンダースコアのみ使用可能です。');
      return;
    }
    if (trimmedId === 'home') {
      setErrorMsg('「home」は予約語のため使用できません。');
      return;
    }
    if (!trimmedLabel) {
      setErrorMsg('カテゴリー名（表示名）を入力してください。');
      return;
    }
    if (categories.some(c => c.id === trimmedId)) {
      setErrorMsg('このカテゴリーIDはすでに存在します。');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCategory(trimmedId, trimmedLabel, selectedIcon);
      setNewId('');
      setNewLabel('');
      setSelectedIcon('Folder');
    } catch (err: any) {
      setErrorMsg('カテゴリーの追加に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLinkCount = (catId: string) => {
    return links.filter(l => l.category === catId).length;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">カテゴリーの管理</h2>
              <p className="text-xs text-slate-500 mt-1">
                資料を分類するカテゴリーを自由に追加・削除できます。
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
              <X className="w-5 h-5 border-none" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Form */}
            <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                新しいカテゴリーを追加
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">カテゴリーID (英数字・一意)</label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="例: hr-docs"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">カテゴリー名 (表示される名称)</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="例: 人事関連"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">アイコンの選択</label>
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg">
                  {ICON_PRESETS.map((preset) => {
                    const PresetIcon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedIcon(preset.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs gap-1 transition-all cursor-pointer ${
                          selectedIcon === preset.id
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                            : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-600'
                        }`}
                        title={preset.label}
                      >
                        <PresetIcon className="w-4 h-4" />
                        <span className="text-[10px] scale-90 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                          {preset.label.split('/')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  追加する
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                登録済みのカテゴリー ({categories.length}件)
              </h3>

              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                {categories.map((cat, index) => {
                  const preset = ICON_PRESETS.find(p => p.id === cat.icon) || ICON_PRESETS[0];
                  const CatIcon = preset.icon;
                  const count = getLinkCount(cat.id);
                  const isDeletable = count === 0;

                  return (
                    <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{cat.label}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-mono font-medium">
                              ID: {cat.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            紐づく資料数: <span className={count > 0 ? "font-bold text-indigo-600" : "font-medium"}>{count} 件</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 順位変更用のボタン */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                            className={`p-1.5 transition-colors cursor-pointer ${
                              index === 0
                                ? 'text-slate-200 bg-slate-50 cursor-not-allowed'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                            }`}
                            title="表示順序を上げる"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <div className="w-[1px] h-4 bg-slate-200" />
                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => handleMoveDown(index)}
                            className={`p-1.5 transition-colors cursor-pointer ${
                              index === categories.length - 1
                                ? 'text-slate-200 bg-slate-50 cursor-not-allowed'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                            }`}
                            title="表示順序を下げる"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {!isDeletable && (
                          <span className="text-[10px] text-amber-600 font-medium px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 hidden sm:inline-block">
                            資料あり（削除不可）
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={!isDeletable}
                          onClick={() => onDeleteCategory(cat.id)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            isDeletable
                              ? 'text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-100 hover:border-rose-200'
                              : 'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed'
                          }`}
                          title={isDeletable ? 'カテゴリーを削除' : 'カテゴリー内に資料があるため削除できません'}
                        >
                          <Trash2 className="w-4 h-4 font-normal" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
