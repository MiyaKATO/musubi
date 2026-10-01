import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { AdminUser, CategoryData } from '../types';
import { 
  Shield, 
  ShieldAlert, 
  UserPlus, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  UserCheck, 
  Settings, 
  Info,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminSettingsViewProps {
  user: User | null;
  admins: AdminUser[];
  isAdmin: boolean;
  isFirstSetup: boolean;
  categories: CategoryData[];
  onAddAdmin: (email: string) => Promise<void>;
  onDeleteAdmin: (email: string) => Promise<void>;
  onToggleCategoryAdminOnly: (categoryId: string, adminOnly: boolean) => Promise<void>;
  onOpenCategoryManager: () => void;
}

export default function AdminSettingsView({
  user,
  admins,
  isAdmin,
  isFirstSetup,
  categories,
  onAddAdmin,
  onDeleteAdmin,
  onToggleCategoryAdminOnly,
  onOpenCategoryManager
}: AdminSettingsViewProps) {
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // If user is not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">管理者設定にはログインが必要です</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
          指吸会計グループのGoogleアカウント（@yubisui.co.jp）でログインしてください。
        </p>
      </div>
    );
  }

  // If not first setup and user is NOT an admin
  if (!isFirstSetup && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl border border-rose-200/80 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">管理者権限がありません</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            管理者設定の閲覧・編集は、ポータル管理者に登録されているアカウントのみ許可されています。
          </p>
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              現在ログイン中のアカウント:
            </div>
            <div className="font-mono text-slate-900 bg-white px-2.5 py-1.5 rounded border border-slate-200">
              {user.email}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              管理者権限の付与が必要な場合は、既存のポータル管理者へご連絡ください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setErrorMsg('Googleログイン用のメールアドレスを入力してください。');
      return;
    }

    if (!email.includes('@') || !email.endsWith('@yubisui.co.jp')) {
      setErrorMsg('「@yubisui.co.jp」ドメインのGoogleメールアドレスを入力してください。');
      return;
    }

    if (admins.some(a => a.email.toLowerCase() === email)) {
      setErrorMsg('このメールアドレスは既に管理者に登録されています。');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddAdmin(email);
      setSuccessMsg(`「${email}」を管理者に登録しました。`);
      setEmailInput('');
    } catch (err: any) {
      setErrorMsg(err.message || '管理者の登録に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSelf = async () => {
    if (!user.email) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await onAddAdmin(user.email.toLowerCase());
      setSuccessMsg(`「${user.email}」を最初の管理者として登録しました。`);
    } catch (err: any) {
      setErrorMsg(err.message || '登録に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (email: string) => {
    if (admins.length <= 1) {
      alert('管理者を0人にすることはできません。別の管理者を登録してから削除してください。');
      return;
    }

    if (email.toLowerCase() === user.email?.toLowerCase()) {
      const confirmSelf = window.confirm(
        '【警告】自分自身の管理者権限を削除しようとしています。\n削除すると管理者設定へのアクセス権を失います。本当に削除しますか？'
      );
      if (!confirmSelf) return;
    } else {
      const confirmOther = window.confirm(`管理者「${email}」を削除しますか？`);
      if (!confirmOther) return;
    }

    setDeletingEmail(email);
    try {
      await onDeleteAdmin(email);
      setSuccessMsg(`管理者「${email}」を削除しました。`);
    } catch (err: any) {
      setErrorMsg(err.message || '削除に失敗しました。');
    } finally {
      setDeletingEmail(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* First Setup Banner if 0 admins */}
      {isFirstSetup && (
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-2 border-amber-400/50 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  初期設定：管理者がまだ登録されていません（1人目の登録）
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  1人目の管理者を登録してください。1人目が登録されるとセキュリティロックが有効化され、今後は管理者に登録されている方のみが閲覧・編集を行えるようになります。
                </p>
              </div>
            </div>
            {user.email && (
              <button
                type="button"
                onClick={handleAddSelf}
                disabled={isSubmitting}
                className="whitespace-nowrap px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                自分 ({user.email}) を登録
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2 py-1 cursor-pointer"
            >
              閉じる
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-sm shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
            >
              閉じる
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add Admin & Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Add Admin Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">管理者の追加</h3>
                <p className="text-[11px] text-slate-500">Googleログイン用のメールアドレスを登録</p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  メールアドレス (@yubisui.co.jp)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@yubisui.co.jp"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  ※複数名登録可能です。管理者に登録されたアカウントのみが管理者設定および「管理者のみ」カテゴリーの閲覧・編集を行えます。
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                管理者として追加する
              </button>
            </form>
          </div>

          {/* Permissions Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              管理者権限について
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-600">
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-600 font-bold">・</span>
                <span>
                  <strong>管理者設定の管理：</strong>
                  管理者の追加・削除を行えます（1人目登録後は管理者のみアクセス可能）。
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-600 font-bold">・</span>
                <span>
                  <strong>管理者専用カテゴリーの利用：</strong>
                  「管理者のみ」に設定されたカテゴリーおよびその資料を閲覧・追加・編集できます。
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-600 font-bold">・</span>
                <span>
                  <strong>一般ユーザーへの制限：</strong>
                  管理者に登録されていないユーザーには、「管理者のみ」カテゴリーの資料は非表示または閲覧権限なしとなります。
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Admin List & Category AdminOnly Overview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Admin List Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    登録済み管理者一覧 ({admins.length}名)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    現在管理者権限を保有しているGoogleアカウント
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {admins.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  管理者が登録されていません。左のフォームから登録してください。
                </div>
              ) : (
                admins.map((admin) => {
                  const isCurrent = admin.email.toLowerCase() === user.email?.toLowerCase();
                  return (
                    <div
                      key={admin.email}
                      className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {admin.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 font-mono">
                              {admin.email}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                                あなた
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>管理者権限: 有効</span>
                            {admin.addedBy && (
                              <span className="text-slate-300">| 追加元: {admin.addedBy}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => handleDeleteConfirm(admin.email)}
                          disabled={deletingEmail === admin.email}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all cursor-pointer font-medium disabled:opacity-50"
                          title="管理者を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>削除</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Categories "管理者のみ" Status Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  カテゴリーごとの閲覧権限設定
                </h3>
                <p className="text-[11px] text-slate-500">
                  チェックを付けたカテゴリーは「管理者のみ」が閲覧・利用できます
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                カテゴリー管理を開く
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cat.adminOnly ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600 shadow-2xs'}`}>
                        {cat.adminOnly ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{cat.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">({cat.id})</span>
                          {cat.adminOnly && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold shadow-2xs">
                              管理者のみ
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {cat.adminOnly 
                            ? '登録済み管理者のみ閲覧・資料追加可能（一般ユーザーには閲覧制限）'
                            : '全ユーザーが閲覧可能'}
                        </p>
                      </div>
                    </div>

                    <label className={`flex items-center gap-2 select-none ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                      <input
                        type="checkbox"
                        checked={cat.adminOnly === true}
                        disabled={!isAdmin}
                        onChange={(e) => onToggleCategoryAdminOnly(cat.id, e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs font-semibold text-slate-700">管理者のみ</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
