import type { ProductResponse, ProductOptionResponse, UserResponse } from '@msspbiz/shared';

export type ProductOption = ProductOptionResponse;
export type Product = ProductResponse;

export interface Contract {
  id: string;
  title: string;
  partyB: string;
  status: string;
  contractProducts?: Array<{
    id: string;
    purchasePrice?: number;
    sellingPrice?: number;
    product: {
      name: string;
    };
  }>;
}

export type User = UserResponse;

export type CommissionType = 'percentage' | 'fixed';

export interface Partner {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  email: string;
  commissionType: CommissionType;
  commissionValue: number;
  notes: string;
}

export const DERIVED_TYPE_PRESETS = ['플랫폼', '서비스', '리포트', 'API', '컨설팅', '라이선스', '기타'];

export const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  analyst: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
  sales: 'bg-orange-100 text-orange-800',
};

export const ROLE_LABELS: Record<string, string> = {
  owner: '소유자',
  admin: '관리자',
  editor: '편집자',
  analyst: '분석가',
  viewer: '뷰어',
  sales: '영업',
};

export const ROLE_OPTIONS = [
  { value: 'owner', label: '소유자' },
  { value: 'admin', label: '관리자' },
  { value: 'editor', label: '편집자' },
  { value: 'analyst', label: '분석가' },
  { value: 'viewer', label: '뷰어' },
  { value: 'sales', label: '영업' },
];

export const AFFILIATION_LABELS: Record<string, string> = {
  internal: '자사',
  vendor: '벤더사',
  partner: '파트너사',
  client: '고객사',
};

export const AFFILIATION_OPTIONS = [
  { value: 'internal', label: '자사' },
  { value: 'vendor', label: '벤더사' },
  { value: 'partner', label: '파트너사' },
  { value: 'client', label: '고객사' },
];

export const COMMISSION_TYPE_OPTIONS = [
  { value: 'percentage', label: '퍼센트(%)' },
  { value: 'fixed', label: '고정금액' },
];

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  percentage: '퍼센트',
  fixed: '고정금액',
};

export const PROVIDER_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'ollama', label: 'Ollama (로컬)' },
];
