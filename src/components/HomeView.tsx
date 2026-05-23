import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PortalConfig, Announcement, Category, CATEGORIES, DocLink } from '../types';
import { 
  MessageSquare, 
  Bell, 
  Edit2, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Layout, 
  CheckSquare, 
  BookOpen, 
  Check, 
  X, 
  ExternalLink,
  Info,
  AlertTriangle,
  FileText,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';

interface HomeViewProps {
  user: User | null;
  onNavigateToCategory: (category: Category) => void;
  links: DocLink[];
}

const DEFAULT_CONFIG: PortalConfig = {
  chatworkUrl: 'https://www.chatwork.com',
  chatworkRoomName: 'DocHub 連絡チャネル',
  welcomeMessage: 'DocHub Portalへようこそ！散らばっているBoxやGoogleドライブなどの資料リンクをここで一元管理できます。',
  hpUrl: 'https://yubisui.co.jp',
  hpName: '公式ホームページ',
  chatworkDescription: '連絡・通知・案件の確認に本ポータル推奨のChatworkチャネルをご利用いただけます。',
  hpDescription: '指吸会計グループの公式ホームページや重要なお知らせへすぐにアクセスできます。メール認証済みのログインユーザーであれば、いつでも名称・URLを変更可能です。',
  libraryTitle: 'ドキュメント資料ライブラリ',
  librarySubtitle: 'カテゴリをクリックして資料一覧へ',
  announcements: [
    {
      id: 'welcome-ann',
      title: 'DocHub ポータルがオープンしました',
      content: '資料を一元管理できるDocHubポータルがリリースされました。左メニューの各カテゴリから、リンク（Box、ドライブ等）を手軽に共有できます。ぜひご活用ください！',
      date: '2026/05/11',
      type: 'success'
    },
    {
      id: 'chatwork-ann',
      title: 'Chatwork連携機能のお知らせ',
      content: '画面上部の「Chatworkにアクセス」より、チームのチャットルームへすぐにアクセスできます。メール認証されたログインユーザーであれば、いつでもURLを変更可能です。',
      date: '2026/05/11',
      type: 'info'
    }
  ]
};

export default function HomeView({ user, onNavigateToCategory, links }: HomeViewProps) {
  const [config, setConfig] = useState<PortalConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isEditingPortal, setIsEditingPortal] = useState(false);
  const [editChatworkUrl, setEditChatworkUrl] = useState('');
  const [editChatworkRoomName, setEditChatworkRoomName] = useState('');
  const [editWelcomeMessage, setEditWelcomeMessage] = useState('');
  const [editHpUrl, setEditHpUrl] = useState('');
  const [editHpName, setEditHpName] = useState('');
  const [editChatworkDescription, setEditChatworkDescription] = useState('');
  const [editHpDescription, setEditHpDescription] = useState('');
  const [editLibraryTitle, setEditLibraryTitle] = useState('');
  const [editLibrarySubtitle, setEditLibrarySubtitle] = useState('');

  // Announcement adding state
  const [isAddingAnn, setIsAddingAnn] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<Announcement['type']>('info');

  // Announcement editing state
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');
  const [editAnnType, setEditAnnType] = useState<Announcement['type']>('info');

  const isVerifiedUser = user?.emailVerified === true;

  // Listen to setting document 'home' in firebase
  useEffect(() => {
    const docRef = doc(db, 'portal_settings', 'home');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const val = docSnap.data() as PortalConfig;
        setConfig({
          ...DEFAULT_CONFIG,
          ...val,
          announcements: val.announcements || []
        });
      } else {
        // Doc matching portal_settings/home doesn't exist yet, seed it if user is verified
        if (isVerifiedUser) {
          setDoc(docRef, DEFAULT_CONFIG).catch(err => {
            console.error("Initialization of default portal setting failed:", err);
          });
        }
        setConfig(DEFAULT_CONFIG);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Read portal_settings failed (possibly unauthenticated or rule block):", error);
      setConfig(DEFAULT_CONFIG);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isVerifiedUser]);

  // Open Portal Edit Mode
  const startEditPortal = () => {
    setEditChatworkUrl(config.chatworkUrl);
    setEditChatworkRoomName(config.chatworkRoomName);
    setEditWelcomeMessage(config.welcomeMessage);
    setEditHpUrl(config.hpUrl || DEFAULT_CONFIG.hpUrl || '');
    setEditHpName(config.hpName || DEFAULT_CONFIG.hpName || '');
    setEditChatworkDescription(config.chatworkDescription || DEFAULT_CONFIG.chatworkDescription || '');
    setEditHpDescription(config.hpDescription || DEFAULT_CONFIG.hpDescription || '');
    setEditLibraryTitle(config.libraryTitle || DEFAULT_CONFIG.libraryTitle || '');
    setEditLibrarySubtitle(config.librarySubtitle || DEFAULT_CONFIG.librarySubtitle || '');
    setIsEditingPortal(true);
  };

  // Save Portal Main Info
  const savePortalInfo = async () => {
    if (!isVerifiedUser) {
      alert("編集するにはメール認証済みのログインが必要です。");
      return;
    }
    try {
      const docRef = doc(db, 'portal_settings', 'home');
      await setDoc(docRef, {
        ...config,
        chatworkUrl: editChatworkUrl,
        chatworkRoomName: editChatworkRoomName,
        welcomeMessage: editWelcomeMessage,
        hpUrl: editHpUrl,
        hpName: editHpName,
        chatworkDescription: editChatworkDescription,
        hpDescription: editHpDescription,
        libraryTitle: editLibraryTitle,
        librarySubtitle: editLibrarySubtitle
      }, { merge: true });
      setIsEditingPortal(false);
    } catch (err) {
      console.error("Failed to update portal setting:", err);
      alert("設定の保存に失敗しました。権限をご確認ください。");
    }
  };

  // Add Notice
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerifiedUser) {
      alert("お知らせを追加するにはメール認証されたログインが必要です。");
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      alert("タイトルと内容を入力してください。");
      return;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: newTitle,
      content: newContent,
      date: dateStr,
      type: newType
    };

    const updatedAnnouncements = [newAnn, ...config.announcements];

    try {
      const docRef = doc(db, 'portal_settings', 'home');
      await setDoc(docRef, {
        ...config,
        announcements: updatedAnnouncements
      }, { merge: true });

      // Reset states
      setNewTitle('');
      setNewContent('');
      setNewType('info');
      setIsAddingAnn(false);
    } catch (err) {
      console.error("Failed to add announcement:", err);
      alert("お知らせの追加に失敗しました。");
    }
  };

  // Delete Notice
  const handleDeleteAnnouncement = async (id: string) => {
    if (!isVerifiedUser) {
      alert("管理者または権限のあるユーザーだけが削除できます。");
      return;
    }
    if (!confirm("このお知らせを削除しますか？")) return;

    const updatedAnnouncements = config.announcements.filter(ann => ann.id !== id);

    try {
      const docRef = doc(db, 'portal_settings', 'home');
      await setDoc(docRef, {
        ...config,
        announcements: updatedAnnouncements
      }, { merge: true });
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      alert("お知らせの削除に失敗しました。");
    }
  };

  // Edit Notice Initiation
  const startEditAnnouncement = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setEditAnnTitle(ann.title);
    setEditAnnContent(ann.content);
    setEditAnnType(ann.type);
  };

  // Edit Notice Save
  const handleSaveAnnouncementEdit = async (id: string) => {
    if (!isVerifiedUser) return;
    if (!editAnnTitle.trim() || !editAnnContent.trim()) {
      alert("空にすることはできません。");
      return;
    }

    const updatedAnnouncements = config.announcements.map(ann => {
      if (ann.id === id) {
        return {
          ...ann,
          title: editAnnTitle,
          content: editAnnContent,
          type: editAnnType
        };
      }
      return ann;
    });

    try {
      const docRef = doc(db, 'portal_settings', 'home');
      await setDoc(docRef, {
        ...config,
        announcements: updatedAnnouncements
      }, { merge: true });
      setEditingAnnId(null);
    } catch (err) {
      console.error("Failed to edit announcement:", err);
      alert("お知らせの更新に失敗しました。");
    }
  };

  // Helper of category descriptions & colors
  const getCategoryTheme = (catId: Category) => {
    switch (catId) {
      case 'design':
        return {
          title: '設計資料',
          desc: 'システム設計書、要件定義書、画面仕様書などを収録。',
          color: 'from-blue-500 to-indigo-600',
          bgLight: 'bg-indigo-50/50',
          hoverBorder: 'hover:border-indigo-200',
          textColor: 'text-indigo-600',
          icon: Layout
        };
      case 'test':
        return {
          title: 'テスト関連',
          desc: 'テスト仕様書、エビデンス、結合テストやSTGログイン情報。',
          color: 'from-emerald-400 to-teal-600',
          bgLight: 'bg-emerald-50/50',
          hoverBorder: 'hover:border-emerald-200',
          textColor: 'text-emerald-600',
          icon: CheckSquare
        };
      case 'knowledge':
        return {
          title: '勉強会・知識',
          desc: '技術スタック、ナレッジ集、ビジネスドメインに関する解説ドキュメント。',
          color: 'from-amber-400 to-orange-500',
          bgLight: 'bg-amber-50/60',
          hoverBorder: 'hover:border-amber-200',
          textColor: 'text-amber-600',
          icon: BookOpen
        };
    }
  };

  // Badge styles according to type
  const getBadgeStyle = (type: Announcement['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold backdrop-blur-sm border border-indigo-500/10">
              DocHub Dashboard
            </span>
            {isVerifiedUser && !isEditingPortal && (
              <button 
                onClick={startEditPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                ホーム設定を編集
              </button>
            )}
          </div>

          {isEditingPortal ? (
            <div className="space-y-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700 max-h-[75vh] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-300">ウェルカムメッセージの編集</h3>
              <textarea
                value={editWelcomeMessage}
                onChange={(e) => setEditWelcomeMessage(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                placeholder="ウェルカム文言..."
              />
              
              <div className="border-t border-slate-700/50 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Chatwork セクション設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Chatwork グループ名</label>
                    <input
                      type="text"
                      value={editChatworkRoomName}
                      onChange={(e) => setEditChatworkRoomName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="例: DocHub 連絡チャネル"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Chatwork URL (リンク先)</label>
                    <input
                      type="text"
                      value={editChatworkUrl}
                      onChange={(e) => setEditChatworkUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="https://www.chatwork.com/g/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Chatwork枠 説明文</label>
                  <textarea
                    value={editChatworkDescription}
                    onChange={(e) => setEditChatworkDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                    placeholder="連絡・通知・案件の確認に本ポータル推奨のChatworkチャネルをご利用いただけます..."
                  />
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">公式ホームページ セクション設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ホームページ表示名</label>
                    <input
                      type="text"
                      value={editHpName}
                      onChange={(e) => setEditHpName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="例: 指吸会計グループ"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ホームページ URL (リンク先)</label>
                    <input
                      type="text"
                      value={editHpUrl}
                      onChange={(e) => setEditHpUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="https://yubisui.co.jp"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ホームページ枠 説明文</label>
                  <textarea
                    value={editHpDescription}
                    onChange={(e) => setEditHpDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                    placeholder="指吸会計グループの公式ホームページや重要なお知らせへすぐにアクセスできます..."
                  />
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">資料ライブラリ セクション設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ライブラリ大タイトル</label>
                    <input
                      type="text"
                      value={editLibraryTitle}
                      onChange={(e) => setEditLibraryTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="例: ドキュメント資料ライブラリ"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ライブラリ小タイトル（説明）</label>
                    <input
                      type="text"
                      value={editLibrarySubtitle}
                      onChange={(e) => setEditLibrarySubtitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="例: カテゴリをクリックして資料一覧へ"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditingPortal(false)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={savePortalInfo}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-all shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  設定を保存
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight">DocHub Portal</h2>
              <p className="text-slate-200 text-base max-w-2xl leading-relaxed whitespace-pre-wrap">
                {config.welcomeMessage}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Navigation and Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Narrower): Chatwork & HP (lg:col-span-1) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Chatwork Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
            {/* Ambient pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold shadow-inner">
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Communication</span>
                <h3 className="text-base font-bold text-slate-900">Chatwork 連携 Room</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
              {config.chatworkDescription || '連絡・通知・案件の確認に本ポータル推奨のChatworkチャネルをご利用いただけます。'}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="text-[10px] font-bold text-slate-400">接続先チャネル</div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                {config.chatworkRoomName || 'Room未設定'}
              </div>
            </div>

            <div className="pt-2">
              <a
                href={config.chatworkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md shadow-rose-500/10 hover:shadow-lg hover:shadow-rose-500/20"
              >
                Chatworkにアクセス
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>

            {!isVerifiedUser && (
              <div className="text-[10px] text-slate-400 text-center">
                ※URLやRoomの名称を編集するにはGoogleアカウントでログインのうえ、メール認証を行ってください。
              </div>
            )}
          </div>

          {/* HP Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
            {/* Ambient pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold shadow-inner">
                <Globe className="w-5 h-5 flex-shrink-0" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Corporate Link</span>
                <h3 className="text-base font-bold text-slate-900">公式ホームページへのリンク</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
              {config.hpDescription || '指吸会計グループの公式ホームページや重要なお知らせへすぐにアクセスできます。メール認証済みのログインユーザーであれば、いつでも名称・URLを変更可能です。'}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="text-[10px] font-bold text-slate-400">リンク先</div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                {config.hpName || '公式ホームページ'}
              </div>
            </div>

            <div className="pt-2">
              <a
                href={config.hpUrl || 'https://yubisui.co.jp'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                {config.hpName || '公式ホームページ'} を開く
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>

            {!isVerifiedUser && (
              <div className="text-[10px] text-slate-400 text-center">
                ※URLや表示名を編集するにはGoogleアカウントでログインのうえ、メール認証を行ってください。
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Wider): Announcements & Document Library (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Announcement Center (お知らせや状況を載せる場所) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 animate-pulse">お知らせ・状況</h3>
                </div>
              </div>

              {isVerifiedUser && !isAddingAnn && (
                <button
                  onClick={() => setIsAddingAnn(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  掲載する
                </button>
              )}
            </div>

            {/* Announcement Add Form */}
            {isAddingAnn && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleAddAnnouncement}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700">新規お知らせ作成</h4>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingAnn(false)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="タイトルを入力 (例: STGサーバーメンテナンス完了)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as Announcement['type'])}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="info">お知らせ (Info)</option>
                      <option value="success">完了・正常 (Success)</option>
                      <option value="warning">告知 (Warning)</option>
                      <option value="danger">重要 (Important)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    placeholder="お知らせの具体的な内容を入力してください..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAnn(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                  >
                    登録する
                  </button>
                </div>
              </motion.form>
            )}

            {/* List of Announcements */}
            <div className="space-y-4">
              {config.announcements && config.announcements.length > 0 ? (
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
                  {config.announcements.map((ann) => (
                    <div key={ann.id} className="py-4 first:pt-0 last:pb-0 group">
                      {editingAnnId === ann.id ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-indigo-100">
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={editAnnTitle}
                              onChange={(e) => setEditAnnTitle(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <select
                              value={editAnnType}
                              onChange={(e) => setEditAnnType(e.target.value as Announcement['type'])}
                              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="info">Info</option>
                              <option value="success">Success</option>
                              <option value="warning">Warning</option>
                              <option value="danger">Danger</option>
                            </select>
                          </div>
                          <textarea
                            value={editAnnContent}
                            onChange={(e) => setEditAnnContent(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingAnnId(null)}
                              className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveAnnouncementEdit(ann.id)}
                              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] font-mono font-semibold text-slate-400">{ann.date}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getBadgeStyle(ann.type)}`}>
                                {ann.type === 'success' ? '完了' : ann.type === 'warning' ? '注意' : ann.type === 'danger' ? '重要' : '案内'}
                              </span>
                            </div>

                            {isVerifiedUser && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditAnnouncement(ann)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                                  title="編集"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAnnouncement(ann.id)}
                                  className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                                  title="削除"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-850 block">{ann.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">
                            {ann.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                  <Info className="w-6 h-6 text-slate-300" />
                  <p className="text-xs font-medium">現在お知らせはありません</p>
                </div>
              )}
            </div>
          </div>

          {/* Category Navigation (各カテゴリへの同線) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {config.libraryTitle || 'ドキュメント資料ライブラリ'}
              </h3>
              <span className="text-xs text-slate-400 font-medium whitespace-pre-wrap">
                {config.librarySubtitle || 'カテゴリをクリックして資料一覧へ'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => {
                const theme = getCategoryTheme(cat.id);
                if (!theme) return null;
                const CatIcon = theme.icon;
                const countOfCat = links.filter(link => link.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => onNavigateToCategory(cat.id)}
                    className={`group text-left p-5 bg-white border border-slate-200 rounded-xl transition-all hover:scale-[1.02] shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[12.5rem] h-auto pb-4 ${theme.hoverBorder}`}
                  >
                    <div>
                      <div className={`w-10 h-10 ${theme.bgLight} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300`}>
                        <CatIcon className={`w-5 h-5 ${theme.textColor}`} />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {theme.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {theme.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between w-full border-t border-slate-100 pt-3 mt-3">
                      <span className="text-xs text-slate-400 font-semibold font-mono">
                        {countOfCat} 件の資料
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
