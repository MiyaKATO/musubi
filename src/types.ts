export type Category = 'test' | 'design' | 'knowledge';
export type SourceType = 'box' | 'drive' | 'local' | 'other';

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
