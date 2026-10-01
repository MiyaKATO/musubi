import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { DocLink, Category, CategoryData, CATEGORIES, TabId, AdminUser } from './types';
import Sidebar from './components/Sidebar';
import LinkCard from './components/LinkCard';
import LinkDialog from './components/LinkDialog';
import HomeView from './components/HomeView';
import CategoryManagerDialog from './components/CategoryManagerDialog';
import AdminSettingsView from './components/AdminSettingsView';
import { Plus, Search, LogIn, User as UserIcon, LogOut, Loader2, AlertTriangle, Settings, Shield, ShieldAlert, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [links, setLinks] = useState<DocLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>(CATEGORIES);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DocLink | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin states
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localLinks, setLocalLinks] = useState<DocLink[]>([]);

  const isVerifiedUser = user?.emailVerified === true && user?.email?.endsWith('@yubisui.co.jp') === true;

  // 1st setup check: if 0 admins are registered, any verified user can initialize the 1st admin.
  // After 1st admin is registered, ONLY registered admins can view/edit admin settings and access adminOnly categories.
  const isFirstSetup = !adminsLoading && admins.length === 0;
  const isRegisteredAdmin = admins.some(a => a.email.toLowerCase() === user?.email?.toLowerCase());
  const isAdmin = isFirstSetup || isRegisteredAdmin || user?.email?.toLowerCase() === 'kato-miya@yubisui.co.jp';

  const canReorder = isVerifiedUser && !searchQuery;

  // Current category if not home or admin-settings
  const currentCategory = categories.find(c => c.id === activeTab);
  const isCategoryAdminRestricted = currentCategory?.adminOnly === true && !isAdmin;

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

  // Firestore Listener for Categories
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCategories(CATEGORIES);
      return;
    }

    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        const seedCategories = async () => {
          try {
            let index = 0;
            for (const cat of CATEGORIES) {
              await setDoc(doc(db, 'categories', cat.id), {
                id: cat.id,
                label: cat.label,
                icon: cat.icon,
                order: index++,
                createdAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.error("Error seeding default categories:", e);
          }
        };
        seedCategories();
      } else {
        const sorted = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CategoryData[];
        
        sorted.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 9999;
          const orderB = b.order !== undefined ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB || a.id.localeCompare(b.id);
        });
        
        setCategories(sorted);
      }
    }, (error) => {
      console.warn("Read categories failed or blocked, falling back to static:", error);
      setCategories(CATEGORIES);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Firestore Listener for Admins
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAdmins([]);
      setAdminsLoading(false);
      return;
    }

    setAdminsLoading(true);
    const q = query(collection(db, 'admins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        ...(d.data() as AdminUser),
        email: d.id
      }));
      setAdmins(list);
      setAdminsLoading(false);
    }, (error) => {
      console.warn("Read admins failed or blocked:", error);
      setAdminsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleAddAdmin = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    try {
      await setDoc(doc(db, 'admins', normalized), {
        email: normalized,
        addedBy: user?.email || 'admin',
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'portal_settings', 'admin_initialized'), {
        initialized: true,
        initializedAt: serverTimestamp(),
        by: user?.email
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${normalized}`);
      throw error;
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    try {
      await deleteDoc(doc(db, 'admins', normalized));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${normalized}`);
      throw error;
    }
  };

  const handleToggleCategoryAdminOnly = async (categoryId: string, adminOnly: boolean) => {
    try {
      await updateDoc(doc(db, 'categories', categoryId), {
        adminOnly
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${categoryId}`);
      throw error;
    }
  };

  const handleAddCategory = async (id: string, label: string, icon: string, adminOnly?: boolean) => {
    try {
      const maxOrder = categories.reduce((max, c) => (c.order !== undefined && c.order > max ? c.order : max), -1);
      await setDoc(doc(db, 'categories', id), {
        id,
        label,
        icon,
        adminOnly: !!adminOnly,
        order: maxOrder + 1,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Add category failed:", error);
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      if (activeTab === id) {
        setActiveTab('home');
      }
    } catch (error) {
      console.error("Delete category failed:", error);
      throw error;
    }
  };

  const handleReorderCategories = async (newOrderedCategories: CategoryData[]) => {
    try {
      const promises = newOrderedCategories.map((cat, index) => {
        const catRef = doc(db, 'categories', cat.id);
        return updateDoc(catRef, {
          order: index
        });
      });
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to update categories order in Firebase:", error);
    }
  };

  const filteredLinks = useMemo(() => {
    if (activeTab === 'home' || activeTab === 'admin-settings') return [];
    if (isCategoryAdminRestricted) return [];
    return links
      .filter(link => link.category === activeTab)
      .filter(link => 
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
        const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
  }, [links, activeTab, searchQuery, isCategoryAdminRestricted]);

  // Synchronize localLinks with filteredLinks when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalLinks(filteredLinks);
    }
  }, [filteredLinks, isDragging]);

  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...localLinks];
    const draggedItem = updated[draggedIndex];

    // Remove from old position and insert at new position
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLocalLinks(updated);
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    setDraggedIndex(null);
    await handleReorderLinks(localLinks);
  };

  const handleReorderLinks = async (newOrderedLinks: DocLink[]) => {
    try {
      const promises = newOrderedLinks.map((link, index) => {
        const linkRef = doc(db, 'links', link.id);
        return updateDoc(linkRef, {
          order: index,
          updatedAt: serverTimestamp()
        });
      });
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to update links order in Firebase:", error);
    }
  };

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
        const categoryLinks = links.filter(l => l.category === data.category);
        const maxOrder = categoryLinks.reduce((max, l) => (l.order !== undefined && l.order > max ? l.order : max), -1);
        const createData = {
          ...commonData,
          order: maxOrder + 1,
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
      const alreadySeeded = localStorage.getItem('yubisui_portal_seeded');
      if (alreadySeeded) return;

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
          localStorage.setItem('yubisui_portal_seeded', 'true');
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
        categories={categories}
        user={user}
        onManageCategories={() => setIsCategoryManagerOpen(true)}
        isAdmin={isAdmin}
        isFirstSetup={isFirstSetup}
      />

      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              {activeTab === 'home' 
                ? 'ホームダッシュボード' 
                : activeTab === 'admin-settings'
                ? '管理者設定'
                : `${currentCategory?.label || '資料'} 資料`}
              {activeTab !== 'home' && activeTab !== 'admin-settings' && currentCategory?.adminOnly && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1 shadow-2xs">
                  <Lock className="w-3 h-3 text-amber-600" />
                  管理者専用
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeTab === 'home'
                ? 'ポータルアナウンス、推奨チャネル、各カテゴリへのクイックアクセス'
                : activeTab === 'admin-settings'
                ? 'ポータル管理者の追加・削除、権限管理'
                : isCategoryAdminRestricted
                ? 'このカテゴリーは管理者専用です（閲覧制限中）'
                : `${filteredLinks.length} 個のアイテムが見つかりました`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {activeTab !== 'home' && activeTab !== 'admin-settings' && !isCategoryAdminRestricted && (
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
                <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="ログアウト">
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

            {activeTab !== 'home' && activeTab !== 'admin-settings' && !isCategoryAdminRestricted && (
              <button
                onClick={() => {
                  if (!user) {
                    alert("資料を追加するにはログインが必要です。");
                    return;
                  }
                  setEditingLink(null);
                  setIsDialogOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
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
              className="text-rose-400 hover:text-rose-600 transition-colors text-xs font-semibold px-2 py-1 rounded cursor-pointer"
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
            categories={categories}
            onManageCategories={() => setIsCategoryManagerOpen(true)}
            isAdmin={isAdmin}
          />
        ) : activeTab === 'admin-settings' ? (
          <AdminSettingsView
            user={user}
            admins={admins}
            isAdmin={isAdmin}
            isFirstSetup={isFirstSetup}
            categories={categories}
            onAddAdmin={handleAddAdmin}
            onDeleteAdmin={handleDeleteAdmin}
            onToggleCategoryAdminOnly={handleToggleCategoryAdminOnly}
            onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
          />
        ) : isCategoryAdminRestricted ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-amber-200/80 p-8 shadow-sm text-center max-w-xl mx-auto mt-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">閲覧権限がありません</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              この「{currentCategory?.label}」カテゴリーは管理者専用に設定されています。
              閲覧および資料の登録・編集を行うには、管理者設定にて管理者として登録されたGoogleアカウントでのログインが必要です。
            </p>
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 w-full text-left space-y-1.5">
              <div>現在のアカウント: <span className="font-mono text-slate-800 font-semibold">{user?.email || '未ログイン'}</span></div>
              <div className="text-amber-700 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                管理者として未登録のため、このカテゴリーの利用は制限されています。
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm font-medium">読み込み中...</p>
          </div>
        ) : localLinks.length > 0 ? (
          <div className="space-y-4">
            {canReorder && (
              <p className="text-xs text-slate-400 bg-slate-100/50 border border-slate-200/40 rounded-lg px-3 py-1.5 w-fit animate-fade-in">
                💡 ドラッグ＆ドロップで資料の並び順を変更できます（変更は自動保存されます）。
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {localLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <LinkCard 
                      link={link} 
                      draggable={canReorder}
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => handleDragEnter(index)}
                      isDragging={draggedIndex === index}
                      canEdit={isVerifiedUser}
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
                className="mt-6 flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
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
        categories={categories}
      />

      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategories={handleReorderCategories}
        onToggleAdminOnly={handleToggleCategoryAdminOnly}
        links={links}
        isAdmin={isAdmin}
      />
    </div>
  );
}

