import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DocLink, Category, SourceType, CategoryData, SOURCE_TYPES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

const linkSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  url: z.string().url('有効なURLを入力してください'),
  description: z.string().optional(),
  category: z.string().min(1, 'カテゴリーは必須です'),
  sourceType: z.enum(['box', 'drive', 'local', 'other']),
});

type LinkFormData = z.infer<typeof linkSchema>;

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LinkFormData) => void;
  onDelete?: () => void;
  initialData?: DocLink | null;
  categories: CategoryData[];
}

export default function LinkDialog({ isOpen, onClose, onSubmit, onDelete, initialData, categories }: LinkDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: initialData || {
      category: categories[0]?.id || '',
      sourceType: 'other',
    },
  });

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset form when initialData changes
  useEffect(() => {
    setIsConfirmingDelete(false);
    if (initialData) {
      reset(initialData);
    } else {
      reset({ category: categories[0]?.id || '', sourceType: 'other', title: '', url: '', description: '' });
    }
  }, [initialData, reset, isOpen, categories]);

  if (!isOpen) return null;

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
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {initialData ? '資料を編集' : '新しい資料を追加'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">タイトル</label>
              <input
                {...register('title')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="基本設計書"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
              <input
                {...register('url')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="https://..."
              />
              {errors.url && <p className="mt-1 text-xs text-red-500">{errors.url.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">説明 (任意)</label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="この資料の内容について"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリー</label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">配信元</label>
                <select
                  {...register('sourceType')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  {SOURCE_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {isConfirmingDelete ? (
              <div className="pt-4 p-4 bg-rose-50 border border-rose-100 rounded-lg flex flex-col gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5 text-rose-800 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>本当にこの資料を削除しますか？この操作は戻せません。</span>
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDelete) {
                        onDelete();
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    はい、削除する
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 flex items-center justify-between gap-3">
                {initialData && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    削除
                  </button>
                )}
                <div className="flex-1" />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  >
                    閉じる
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
