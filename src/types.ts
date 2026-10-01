export type Category = string;
export type SourceType = 'box' | 'drive' | 'local' | 'other';
export type TabId = 'home' | 'admin-settings' | string;

export interface CategoryData {
  id: string;
  label: string;
  icon: string;
  createdAt?: any;
  order?: number;
  adminOnly?: boolean;
}

export interface AdminUser {
  email: string;
  addedBy?: string;
  displayName?: string;
  createdAt?: any;
}

export interface DocLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: Category;
  sourceType: SourceType;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  order?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export interface PortalConfig {
  chatworkUrl: string;
  chatworkRoomName: string;
  welcomeMessage: string;
  announcements: Announcement[];
  hpUrl?: string;
  hpName?: string;
  chatworkDescription?: string;
  hpDescription?: string;
  libraryTitle?: string;
  librarySubtitle?: string;
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'design', label: '設計', icon: 'Layout' },
  { id: 'test', label: 'テスト', icon: 'CheckSquare' },
  { id: 'knowledge', label: '知識', icon: 'BookOpen' },
];

export const SOURCE_TYPES: { id: SourceType; label: string }[] = [
  { id: 'box', label: 'Box' },
  { id: 'drive', label: 'Google Drive' },
  { id: 'local', label: 'ローカルファイル' },
  { id: 'other', label: 'その他' },
];
