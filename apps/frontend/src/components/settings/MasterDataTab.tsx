'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { productsApi, tagsApi } from '@/lib/api';
import type { TagResponse } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Product, DERIVED_TYPE_PRESETS } from './types';

export function MasterDataTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    description: '',
    vendor: '',
    displayOrder: 0,
  });

  // Option modal
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [optionProductId, setOptionProductId] = useState<string>('');
  const [optionForm, setOptionForm] = useState({
    code: '',
    name: '',
    description: '',
    type: '',
  });

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'option' | 'tag'; productId?: string; optionId?: string; tagId?: string; tagName?: string } | null>(null);

  // Tags
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<TagResponse | null>(null);
  const [editTagName, setEditTagName] = useState('');

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

  const fetchTags = useCallback(async () => {
    try {
      setTagsLoading(true);
      const data = await tagsApi.list();
      setTags(data || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      toast.error('태그 목록을 불러오는데 실패했습니다');
    } finally {
      setTagsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchTags();
  }, [fetchProducts, fetchTags]);

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
    setOptionForm({ code: '', name: '', description: '', type: '' });
    setOptionModalOpen(true);
  };

  const handleSaveOption = async () => {
    try {
      await productsApi.addOption(optionProductId, optionForm);
      toast.success('파생제품이 추가되었습니다');
      setOptionModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to add option:', error);
      toast.error('파생제품 추가에 실패했습니다');
    }
  };

  const handleDeleteOption = (productId: string, optionId: string) => {
    setDeleteTarget({ type: 'option', productId, optionId });
    setDeleteModalOpen(true);
  };

  // Tag handlers
  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    try {
      await tagsApi.create({ name });
      toast.success(`태그 "${name}"이(가) 추가되었습니다`);
      setNewTagName('');
      fetchTags();
    } catch (error: any) {
      console.error('Failed to add tag:', error);
      toast.error(error.message || '태그 추가에 실패했습니다');
    }
  };

  const handleStartEditTag = (tag: TagResponse) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
  };

  const handleSaveEditTag = async () => {
    if (!editingTag) return;
    const name = editTagName.trim();
    if (!name || name === editingTag.name) {
      setEditingTag(null);
      return;
    }

    try {
      await tagsApi.update(editingTag.id, { name });
      toast.success(`태그가 "${name}"(으)로 변경되었습니다`);
      setEditingTag(null);
      fetchTags();
    } catch (error: any) {
      console.error('Failed to update tag:', error);
      toast.error(error.message || '태그 수정에 실패했습니다');
    }
  };

  const handleDeleteTag = (tag: TagResponse) => {
    setDeleteTarget({ type: 'tag', tagId: tag.id, tagName: tag.name });
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
        toast.success('파생제품이 삭제되었습니다');
        fetchProducts();
      } else if (deleteTarget.type === 'tag' && deleteTarget.tagId) {
        await tagsApi.delete(deleteTarget.tagId);
        toast.success(`태그 "${deleteTarget.tagName}"이(가) 삭제되었습니다`);
        fetchTags();
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('삭제에 실패했습니다');
    }
  };

  return (
    <>
      {/* Tags Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">업무 태그 관리</h2>
        <Card>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              업무에 사용할 태그를 관리합니다. 태그 삭제 시 모든 업무에서 해당 태그가 제거됩니다.
            </p>

            {/* Add tag */}
            <div className="flex gap-2">
              <Input
                placeholder="새 태그 이름"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
              >
                추가
              </Button>
            </div>

            {/* Tag list */}
            {tagsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">등록된 태그가 없습니다. 태그를 추가하세요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-md text-sm border-2 border-blue-300"
                  >
                    {editingTag?.id === tag.id ? (
                      <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        onBlur={handleSaveEditTag}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditTag();
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                        className="bg-white border border-blue-400 rounded px-1 py-0 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => handleStartEditTag(tag)}
                        title="클릭하여 수정"
                      >
                        {tag.name}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      className="ml-1 text-blue-500 hover:text-red-600 transition-colors"
                      title={`"${tag.name}" 삭제`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Products Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">제품 관리</h2>
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
                <Card key={product.id} className="hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          <span className="text-sm text-gray-500">
                            파생제품 {product.options?.length || 0}개
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
                        <Button size="sm" variant="ghost" onClick={() => handleEditProduct(product)}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(product.id)}>
                          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleProductExpansion(product.id)}>
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

                    {isExpanded && (
                      <div className="border-t-2 border-gray-800 pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">파생제품</h4>
                          <Button size="sm" variant="secondary" onClick={() => handleAddOption(product.id)}>
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            파생제품 추가
                          </Button>
                        </div>
                        {product.options && product.options.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {product.options.map((option) => (
                              <div
                                key={option.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-xs"
                              >
                                {option.type && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                    {option.type}
                                  </span>
                                )}
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
                          <p className="text-sm text-gray-500">파생제품이 없습니다</p>
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
        title="파생제품 추가"
      >
        <div className="space-y-4">
          <Input
            label="코드"
            value={optionForm.code}
            onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value })}
            placeholder="예: DWM-BASIC"
            required
          />
          <Input
            label="파생제품명"
            value={optionForm.name}
            onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
            placeholder="예: 기본 라이선스"
            required
          />
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">유형</label>
            <div className="flex flex-wrap gap-2">
              {DERIVED_TYPE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOptionForm({ ...optionForm, type: optionForm.type === preset ? '' : preset })}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors ${
                    optionForm.type === preset
                      ? 'border-blue-600 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input
              label=""
              value={DERIVED_TYPE_PRESETS.includes(optionForm.type) ? '' : optionForm.type}
              onChange={(e) => setOptionForm({ ...optionForm, type: e.target.value })}
              placeholder="직접 입력 (프리셋 외)"
              className="mt-2"
            />
          </div>
          <Textarea
            label="설명"
            value={optionForm.description}
            onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
            placeholder="파생제품에 대한 설명을 입력하세요"
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="삭제 확인"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {deleteTarget?.type === 'product'
              ? '이 제품을 삭제하시겠습니까? 관련된 모든 파생제품도 함께 삭제됩니다.'
              : deleteTarget?.type === 'tag'
                ? `태그 "${deleteTarget.tagName}"을(를) 삭제하시겠습니까? 모든 업무에서 해당 태그가 제거됩니다.`
                : '이 파생제품을 삭제하시겠습니까?'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
