'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { productsApi, contractsApi, usersApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

type ProductType = 'platform' | 'report' | 'consulting' | 'other';

interface ProductOption {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  vendor?: string;
  displayOrder: number;
  options: ProductOption[];
}

interface Contract {
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

type CommissionType = 'percentage' | 'fixed';

interface Partner {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  email: string;
  commissionType: CommissionType;
  commissionValue: number;
  notes: string;
}

const PRODUCT_TYPE_OPTIONS = [
  { value: 'platform', label: '플랫폼' },
  { value: 'report', label: '리포트' },
  { value: 'consulting', label: '컨설팅' },
  { value: 'other', label: '기타' },
];

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  platform: 'bg-purple-100 text-purple-800',
  report: 'bg-red-100 text-red-800',
  consulting: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  platform: '플랫폼',
  report: '리포트',
  consulting: '컨설팅',
  other: '기타',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  analyst: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

const ROLE_LABELS: Record<string, string> = {
  owner: '소유자',
  admin: '관리자',
  editor: '편집자',
  analyst: '분석가',
  viewer: '뷰어',
};

const ROLE_OPTIONS = [
  { value: 'owner', label: '소유자' },
  { value: 'admin', label: '관리자' },
  { value: 'editor', label: '편집자' },
  { value: 'analyst', label: '분석가' },
  { value: 'viewer', label: '뷰어' },
];

const COMMISSION_TYPE_OPTIONS = [
  { value: 'percentage', label: '퍼센트(%)' },
  { value: 'fixed', label: '고정금액' },
];

const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  percentage: '퍼센트',
  fixed: '고정금액',
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('master-data');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Contracts
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsPage, setContractsPage] = useState(1);
  const [contractsTotal, setContractsTotal] = useState(0);
  const contractsPerPage = 10;

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Partners
  const [partners, setPartners] = useState<Partner[]>([]);
  const [salesReps, setSalesReps] = useState<Set<string>>(new Set());

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    description: '',
    productType: 'platform' as ProductType,
    vendor: '',
    displayOrder: 0,
  });

  // Option modal state
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [optionProductId, setOptionProductId] = useState<string>('');
  const [optionForm, setOptionForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'option' | 'user'; productId?: string; optionId?: string; userId?: string } | null>(null);

  // User role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  // Partner modal
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    email: '',
    commissionType: 'percentage' as CommissionType,
    commissionValue: 0,
    notes: '',
  });

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authApi.getProfile();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Load partners and sales reps from localStorage
  useEffect(() => {
    const loadPartners = () => {
      try {
        const stored = localStorage.getItem('msspbiz_partners');
        if (stored) {
          setPartners(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load partners:', error);
      }
    };

    const loadSalesReps = () => {
      try {
        const stored = localStorage.getItem('msspbiz_sales_reps');
        if (stored) {
          setSalesReps(new Set(JSON.parse(stored)));
        }
      } catch (error) {
        console.error('Failed to load sales reps:', error);
      }
    };

    loadPartners();
    loadSalesReps();
  }, []);

  // Save partners to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('msspbiz_partners', JSON.stringify(partners));
    } catch (error) {
      console.error('Failed to save partners:', error);
    }
  }, [partners]);

  // Save sales reps to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('msspbiz_sales_reps', JSON.stringify(Array.from(salesReps)));
    } catch (error) {
      console.error('Failed to save sales reps:', error);
    }
  }, [salesReps]);

  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const data = await productsApi.list();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('제품 목록을 불러오는데 실패했습니다');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      setContractsLoading(true);
      const data = await contractsApi.list({ page: contractsPage, limit: contractsPerPage });
      setContracts(data.items || []);
      setContractsTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      toast.error('계약 목록을 불러오는데 실패했습니다');
    } finally {
      setContractsLoading(false);
    }
  }, [contractsPage]);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await usersApi.list();
      setUsers(data.items || data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (activeTab === 'finance') {
      fetchContracts();
    }
  }, [activeTab, fetchContracts]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'partners') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      code: '',
      name: '',
      description: '',
      productType: 'platform',
      vendor: '',
      displayOrder: products.length,
    });
    setProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      code: product.code,
      name: product.name,
      description: product.description || '',
      productType: product.productType,
      vendor: product.vendor || '',
      displayOrder: product.displayOrder,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, productForm);
        toast.success('제품이 수정되었습니다');
      } else {
        await productsApi.create(productForm);
        toast.success('제품이 추가되었습니다');
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('제품 저장에 실패했습니다');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteTarget({ type: 'product', productId });
    setDeleteModalOpen(true);
  };

  const handleAddOption = (productId: string) => {
    setOptionProductId(productId);
    setOptionForm({
      code: '',
      name: '',
      description: '',
    });
    setOptionModalOpen(true);
  };

  const handleSaveOption = async () => {
    try {
      await productsApi.addOption(optionProductId, optionForm);
      toast.success('옵션이 추가되었습니다');
      setOptionModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to add option:', error);
      toast.error('옵션 추가에 실패했습니다');
    }
  };

  const handleDeleteOption = (productId: string, optionId: string) => {
    setDeleteTarget({ type: 'option', productId, optionId });
    setDeleteModalOpen(true);
  };

  const handleEditUserRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setRoleModalOpen(true);
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;

    try {
      await usersApi.update(editingUser.id, { role: newRole });
      toast.success('역할이 변경되었습니다');
      setRoleModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('역할 변경에 실패했습니다');
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteTarget({ type: 'user', userId });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'product' && deleteTarget.productId) {
        await productsApi.delete(deleteTarget.productId);
        toast.success('제품이 삭제되었습니다');
        fetchProducts();
      } else if (deleteTarget.type === 'option' && deleteTarget.productId && deleteTarget.optionId) {
        await productsApi.deleteOption(deleteTarget.productId, deleteTarget.optionId);
        toast.success('옵션이 삭제되었습니다');
        fetchProducts();
      } else if (deleteTarget.type === 'user' && deleteTarget.userId) {
        await usersApi.delete(deleteTarget.userId);
        toast.success('사용자가 비활성화되었습니다');
        fetchUsers();
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('삭제에 실패했습니다');
    }
  };

  const calculateFinancialData = () => {
    let totalPurchase = 0;
    let totalSelling = 0;

    contracts.forEach((contract) => {
      contract.contractProducts?.forEach((cp) => {
        totalPurchase += cp.purchasePrice || 0;
        totalSelling += cp.sellingPrice || 0;
      });
    });

    const totalMargin = totalSelling - totalPurchase;
    const avgMarginRate = totalSelling > 0 ? (totalMargin / totalSelling) * 100 : 0;

    return { totalPurchase, totalSelling, totalMargin, avgMarginRate };
  };

  const getMarginRateColor = (rate: number) => {
    if (rate < 0) return 'bg-red-100 text-red-800';
    if (rate < 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const handleAddPartner = () => {
    setEditingPartner(null);
    setPartnerForm({
      name: '',
      contactName: '',
      contactPhone: '',
      email: '',
      commissionType: 'percentage',
      commissionValue: 0,
      notes: '',
    });
    setPartnerModalOpen(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      name: partner.name,
      contactName: partner.contactName,
      contactPhone: partner.contactPhone,
      email: partner.email,
      commissionType: partner.commissionType,
      commissionValue: partner.commissionValue,
      notes: partner.notes,
    });
    setPartnerModalOpen(true);
  };

  const handleSavePartner = () => {
    if (!partnerForm.name) {
      toast.error('파트너사명을 입력하세요');
      return;
    }

    if (editingPartner) {
      setPartners(partners.map(p => p.id === editingPartner.id ? { ...editingPartner, ...partnerForm } : p));
      toast.success('파트너사가 수정되었습니다');
    } else {
      const newPartner: Partner = {
        id: Date.now().toString(),
        ...partnerForm,
      };
      setPartners([...partners, newPartner]);
      toast.success('파트너사가 추가되었습니다');
    }
    setPartnerModalOpen(false);
  };

  const handleDeletePartner = (partnerId: string) => {
    setPartners(partners.filter(p => p.id !== partnerId));
    toast.success('파트너사가 삭제되었습니다');
  };

  const toggleSalesRep = (userId: string) => {
    const newSalesReps = new Set(salesReps);
    if (newSalesReps.has(userId)) {
      newSalesReps.delete(userId);
    } else {
      newSalesReps.add(userId);
    }
    setSalesReps(newSalesReps);
  };

  const canAccessFinance = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const canManageUsers = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">시스템 설정을 관리합니다</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('master-data')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'master-data'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            마스터 데이터
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'finance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            계약 재무 관리
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'partners'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            파트너사 관리
          </button>
        </nav>
      </div>

      {/* Master Data Tab */}
      {activeTab === 'master-data' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              총 {products.length}개의 제품
            </p>
            <Button onClick={handleAddProduct}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              제품 추가
            </Button>
          </div>

          {productsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : products.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">제품이 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">새 제품을 추가하여 시작하세요</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const isExpanded = expandedProducts.has(product.id);

                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      {/* Product Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {product.name}
                            </h3>
                            <Badge color={PRODUCT_TYPE_COLORS[product.productType]}>
                              {PRODUCT_TYPE_LABELS[product.productType]}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {product.options?.length || 0}개 구성
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            코드: {product.code}
                            {product.vendor && ` | 제조사: ${product.vendor}`}
                          </p>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditProduct(product)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleProductExpansion(product.id)}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Options */}
                      {isExpanded && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">구성 옵션</h4>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAddOption(product.id)}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              옵션 추가
                            </Button>
                          </div>
                          {product.options && product.options.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {product.options.map((option) => (
                                <div
                                  key={option.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-xs"
                                >
                                  <span className="font-medium">{option.name}</span>
                                  <span className="text-gray-500">({option.code})</span>
                                  <button
                                    onClick={() => handleDeleteOption(product.id, option.id)}
                                    className="ml-1 text-gray-500 hover:text-red-600 transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">구성 옵션이 없습니다</p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div>
          {!canAccessFinance ? (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">권한이 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">재무 데이터는 Owner 또는 Admin만 접근할 수 있습니다</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <h3 className="text-sm font-medium text-blue-900">총 매입가</h3>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {calculateFinancialData().totalPurchase.toLocaleString('ko-KR')}원
                  </p>
                </Card>
                <Card className="bg-green-50">
                  <h3 className="text-sm font-medium text-green-900">총 판매가</h3>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {calculateFinancialData().totalSelling.toLocaleString('ko-KR')}원
                  </p>
                </Card>
                <Card className="bg-purple-50">
                  <h3 className="text-sm font-medium text-purple-900">총 마진</h3>
                  <p className="text-2xl font-bold text-purple-700 mt-2">
                    {calculateFinancialData().totalMargin.toLocaleString('ko-KR')}원
                  </p>
                </Card>
                <Card className="bg-orange-50">
                  <h3 className="text-sm font-medium text-orange-900">평균 마진율</h3>
                  <p className="text-2xl font-bold text-orange-700 mt-2">
                    {calculateFinancialData().avgMarginRate.toFixed(1)}%
                  </p>
                </Card>
              </div>

              {/* Financial Table */}
              {contractsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객사</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계약명</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제품</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">매입가</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">판매가</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">마진</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">마진율</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.map((contract) => {
                          const totalPurchase = contract.contractProducts?.reduce((sum, cp) => sum + (cp.purchasePrice || 0), 0) || 0;
                          const totalSelling = contract.contractProducts?.reduce((sum, cp) => sum + (cp.sellingPrice || 0), 0) || 0;
                          const margin = totalSelling - totalPurchase;
                          const marginRate = totalSelling > 0 ? (margin / totalSelling) * 100 : 0;

                          return (
                            <tr key={contract.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.partyB}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.title}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="flex flex-wrap gap-1">
                                  {contract.contractProducts?.map((cp) => (
                                    <Badge key={cp.id} color="bg-gray-100 text-gray-800">
                                      {cp.product.name}
                                    </Badge>
                                  )) || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {totalPurchase > 0 ? `${totalPurchase.toLocaleString('ko-KR')}원` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {totalSelling > 0 ? `${totalSelling.toLocaleString('ko-KR')}원` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {totalSelling > 0 ? `${margin.toLocaleString('ko-KR')}원` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {totalSelling > 0 ? (
                                  <Badge color={getMarginRateColor(marginRate)}>
                                    {marginRate.toFixed(1)}%
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Badge color={contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {contract.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/contracts/${contract.id}`)}
                                >
                                  상세
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {contractsTotal > contractsPerPage && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                      <div className="text-sm text-gray-700">
                        총 {contractsTotal}개 중 {(contractsPage - 1) * contractsPerPage + 1}-{Math.min(contractsPage * contractsPerPage, contractsTotal)}개 표시
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={contractsPage === 1}
                          onClick={() => setContractsPage(contractsPage - 1)}
                        >
                          이전
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={contractsPage * contractsPerPage >= contractsTotal}
                          onClick={() => setContractsPage(contractsPage + 1)}
                        >
                          다음
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {!canManageUsers ? (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">권한이 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">사용자 관리는 Owner 또는 Admin만 접근할 수 있습니다</p>
              </div>
            </Card>
          ) : usersLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 로그인</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const isSelf = currentUser?.id === user.id;

                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                            {isSelf && <span className="ml-2 text-xs text-gray-500">(나)</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge color={ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}>
                              {ROLE_LABELS[user.role] || user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge color={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {user.isActive ? '활성' : '비활성'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isSelf}
                                onClick={() => handleEditUserRole(user)}
                              >
                                역할 변경
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isSelf || !user.isActive}
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <span className="text-red-600">비활성화</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Product Modal */}
      <Modal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? '제품 수정' : '제품 추가'}
      >
        <div className="space-y-4">
          <Input
            label="제품 코드"
            value={productForm.code}
            onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
            placeholder="예: PLAT-001"
            required
          />
          <Input
            label="제품명"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            placeholder="예: SIEM 플랫폼"
            required
          />
          <Textarea
            label="설명"
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            placeholder="제품에 대한 설명을 입력하세요"
          />
          <Select
            label="제품 유형"
            value={productForm.productType}
            onChange={(e) => setProductForm({ ...productForm, productType: e.target.value as ProductType })}
            options={PRODUCT_TYPE_OPTIONS}
            required
          />
          <Input
            label="제조사"
            value={productForm.vendor}
            onChange={(e) => setProductForm({ ...productForm, vendor: e.target.value })}
            placeholder="예: IBM"
          />
          <Input
            label="표시 순서"
            type="number"
            value={productForm.displayOrder}
            onChange={(e) => setProductForm({ ...productForm, displayOrder: parseInt(e.target.value) || 0 })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setProductModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? '수정' : '추가'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Option Modal */}
      <Modal
        open={optionModalOpen}
        onClose={() => setOptionModalOpen(false)}
        title="옵션 추가"
      >
        <div className="space-y-4">
          <Input
            label="옵션 코드"
            value={optionForm.code}
            onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value })}
            placeholder="예: OPT-001"
            required
          />
          <Input
            label="옵션명"
            value={optionForm.name}
            onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
            placeholder="예: 기본 라이선스"
            required
          />
          <Textarea
            label="설명"
            value={optionForm.description}
            onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
            placeholder="옵션에 대한 설명을 입력하세요"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setOptionModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveOption}>
              추가
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Role Modal */}
      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="역할 변경"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            사용자 <strong>{editingUser?.name}</strong>의 역할을 변경합니다.
          </p>
          <Select
            label="역할"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={ROLE_OPTIONS}
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setRoleModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveUserRole}>
              변경
            </Button>
          </div>
        </div>
      </Modal>

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-8">
          {/* Partners Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">파트너사 목록</h2>
                <p className="text-sm text-gray-600 mt-1">총 {partners.length}개의 파트너사</p>
              </div>
              <Button onClick={handleAddPartner}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                파트너사 추가
              </Button>
            </div>

            {partners.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">파트너사가 없습니다</h3>
                  <p className="mt-1 text-sm text-gray-500">새 파트너사를 추가하여 시작하세요</p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">파트너사명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">수수료 유형</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">수수료</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {partners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.contactName || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.contactPhone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{partner.email || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge color="bg-blue-100 text-blue-800">
                              {COMMISSION_TYPE_LABELS[partner.commissionType]}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {partner.commissionType === 'percentage'
                              ? `${partner.commissionValue}%`
                              : `${partner.commissionValue.toLocaleString('ko-KR')}원`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{partner.notes || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPartner(partner)}
                              >
                                수정
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePartner(partner.id)}
                              >
                                <span className="text-red-600">삭제</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Sales Reps Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">영업 담당자 지정</h2>
              <p className="text-sm text-gray-600 mt-1">시스템에 등록된 사용자 중 영업 담당자를 선택합니다</p>
            </div>

            {usersLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : (
              <Card>
                <div className="space-y-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={salesReps.has(user.id)}
                        onChange={() => toggleSalesRep(user.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          <Badge color={ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}>
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Partner Modal */}
      <Modal
        open={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        title={editingPartner ? '파트너사 수정' : '파트너사 추가'}
      >
        <div className="space-y-4">
          <Input
            label="파트너사명"
            value={partnerForm.name}
            onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
            placeholder="예: ABC 솔루션"
            required
          />
          <Input
            label="담당자명"
            value={partnerForm.contactName}
            onChange={(e) => setPartnerForm({ ...partnerForm, contactName: e.target.value })}
            placeholder="홍길동"
          />
          <Input
            label="연락처"
            value={partnerForm.contactPhone}
            onChange={(e) => setPartnerForm({ ...partnerForm, contactPhone: e.target.value })}
            placeholder="010-0000-0000"
          />
          <Input
            label="이메일"
            type="email"
            value={partnerForm.email}
            onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
            placeholder="contact@partner.com"
          />
          <Select
            label="수수료 유형"
            value={partnerForm.commissionType}
            onChange={(e) => setPartnerForm({ ...partnerForm, commissionType: e.target.value as CommissionType })}
            options={COMMISSION_TYPE_OPTIONS}
            required
          />
          <Input
            label={partnerForm.commissionType === 'percentage' ? '수수료율(%)' : '수수료 고정금액'}
            type="number"
            value={partnerForm.commissionValue}
            onChange={(e) => setPartnerForm({ ...partnerForm, commissionValue: parseFloat(e.target.value) || 0 })}
            placeholder={partnerForm.commissionType === 'percentage' ? '10' : '1000000'}
          />
          <Textarea
            label="비고"
            value={partnerForm.notes}
            onChange={(e) => setPartnerForm({ ...partnerForm, notes: e.target.value })}
            placeholder="추가 정보나 메모를 입력하세요"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setPartnerModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSavePartner}>
              {editingPartner ? '수정' : '추가'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="삭제 확인"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {deleteTarget?.type === 'product'
              ? '이 제품을 삭제하시겠습니까? 관련된 모든 옵션도 함께 삭제됩니다.'
              : deleteTarget?.type === 'option'
              ? '이 옵션을 삭제하시겠습니까?'
              : '이 사용자를 비활성화하시겠습니까?'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              {deleteTarget?.type === 'user' ? '비활성화' : '삭제'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
