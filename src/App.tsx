import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { DocLink, Category, CATEGORIES, TabId } from './types';
import Sidebar from './components/Sidebar';
import LinkCard from './components/LinkCard';
import LinkDialog from './components/LinkDialog';
import HomeView from './components/HomeView';
import { Plus, Search, LogIn, User as UserIcon, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [links, setLinks] = useState<DocLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DocLink | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (u.email && u.email.endsWith('@yubisui.co.jp')) {
          setUser(u);
          setAuthError(null);
        } else {
          setUser(null);
          setAuthError("アクセス制限: yubisui.co.jp ドメインのGoogleアカウントでのみログイン可能です。");
          try {
            await auth.signOut();
          } catch (e) {
            console.error("Signout after invalid domain failed:", e);
          }
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (email && !email.endsWith('@yubisui.co.jp')) {
        setAuthError("アクセス制限: yubisui.co.jp ドメインのGoogleアカウントでのみログイン可能です。");
        await auth.signOut();
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    setAuthError(null);
    auth.signOut();
  };

  // Firestore Listener
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'links'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DocLink[];
      setLinks(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'links');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const filteredLinks = useMemo(() => {
    if (activeTab === 'home') return [];
    return links
      .filter(link => link.category === activeTab)
      .filter(link => 
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [links, activeTab, searchQuery]);

  const handleSubmit = async (data: any) => {
    const path = `links/${editingLink?.id || ''}`;
    try {
      const commonData = {
        title: data.title,
        url: data.url,
        category: data.category,
        sourceType: data.sourceType,
        updatedAt: serverTimestamp(),
        ...(data.description ? { description: data.description } : {}),
      };

      if (editingLink) {
        await updateDoc(doc(db, 'links', editingLink.id), commonData);
      } else {
        const createData = {
          ...commonData,
          createdAt: serverTimestamp(),
          createdBy: user?.uid,
        };
        await addDoc(collection(db, 'links'), createData);
      }
      setIsDialogOpen(false);
      setEditingLink(null);
    } catch (error) {
      handleFirestoreError(error, editingLink ? OperationType.UPDATE : OperationType.CREATE, path);
      alert("保存に失敗しました。権限を確認してください。");
    }
  };

  const handleDelete = async () => {
    if (!editingLink) return;
    if (!confirm('本当にこの資料を削除しますか？')) return;

    const path = `links/${editingLink.id}`;
    try {
      await deleteDoc(doc(db, 'links', editingLink.id));
      setIsDialogOpen(false);
      setEditingLink(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      alert("削除に失敗しました。");
    }
  };

  // Initial Seed Logic (For Demo/User Request)
  useEffect(() => {
    if (!loading && links.length === 0 && user) {
      const seedData = async () => {
        try {
          await addDoc(collection(db, 'links'), {
            title: 'むすびログイン画面',
            url: 'https://stg-yubisui.jitera.dev/login',
            description: 'STG環境のログイン画面です。テスト時に利用してください。',
            category: 'test',
            sourceType: 'other',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'links');
        }
      };
      seedData();
    }
  }, [loading, links.length, user]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'home' 
                ? 'ホームダッシュボード' 
                : `${CATEGORIES.find(c => c.id === activeTab)?.label} 資料`}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeTab === 'home'
                ? 'ポータルアナウンス、推奨チャネル、各カテゴリへのクイックアクセス'
                : `${filteredLinks.length} 個のアイテムが見つかりました`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {activeTab !== 'home' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="名称や説明で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            )}

            {authLoading ? (
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3 bg-white p-1 pr-3 border border-slate-200 rounded-full shadow-sm">
                <img 
                  src={user.photoURL || ''} 
                  alt="" 
                  className="w-8 h-8 rounded-full border border-slate-100 object-cover" 
                  referrerPolicy="no-referrer" 
                />
                <span className="text-xs font-semibold text-slate-700">{user.displayName}</span>
                <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="ログアウト">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                ログイン
              </button>
            )}

            {activeTab !== 'home' && (
              <button
                onClick={() => {
                  if (!user) {
                    alert("資料を追加するにはログインが必要です。");
                    return;
                  }
                  setEditingLink(null);
                  setIsDialogOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                資料を追加
              </button>
            )}
          </div>
        </header>

        {authError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm animate-fade-in shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-medium">
              <span className="font-bold">アクセス制限:</span> {authError}
            </div>
            <button 
              onClick={() => setAuthError(null)} 
              className="text-rose-400 hover:text-rose-600 transition-colors text-xs font-semibold px-2 py-1 rounded"
            >
              閉じる
            </button>
          </div>
        )}

        {activeTab === 'home' ? (
          <HomeView 
            user={user} 
            onNavigateToCategory={setActiveTab} 
            links={links} 
          />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm font-medium">読み込み中...</p>
          </div>
        ) : filteredLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredLinks.map((link) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <LinkCard 
                    link={link} 
                    onEdit={(l) => {
                      if (!user) {
                        alert("編集するにはログインが必要です。");
                        return;
                      }
                      setEditingLink(l);
                      setIsDialogOpen(true);
                    }} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              {user ? <Search className="w-8 h-8 text-slate-300" /> : <LogIn className="w-8 h-8 text-slate-300" />}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {user ? '資料が見つかりません' : 'ログインが必要です'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs text-center">
              {user 
                ? '検索条件を変えるか、新しい資料を追加してください。' 
                : 'このポータルの資料を閲覧・管理するにはGoogleアカウントでログインしてください。'}
            </p>
            {!user && (
              <button
                onClick={handleLogin}
                className="mt-6 flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                Googleでログイン
              </button>
            )}
          </div>
        )}
      </main>

      <LinkDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        initialData={editingLink}
      />
    </div>
  );
}

