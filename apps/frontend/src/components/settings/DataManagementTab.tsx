'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { backupApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { User } from './types';

interface DataManagementTabProps {
  currentUser: User | null;
}

interface ModuleOption {
  key: string;
  label: string;
}

const MODULE_OPTIONS: ModuleOption[] = [
  { key: 'tasks', label: '업무' },
  { key: 'meetings', label: '회의록' },
  { key: 'contracts', label: '계약' },
  { key: 'products', label: '제품' },
  { key: 'users', label: '사용자' },
];

interface PreviewData {
  modules: Record<string, number>;
}

interface ImportResult {
  modules: Record<string, number>;
}

export function DataManagementTab({ currentUser }: DataManagementTabProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const canExport = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const canImport = currentUser?.role === 'owner';

  const toggleModule = (moduleKey: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const selectAll = () => {
    setSelectedModules(MODULE_OPTIONS.map((m) => m.key));
  };

  const deselectAll = () => {
    setSelectedModules([]);
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const res = await backupApi.exportJson(selectedModules);
      if (!res.ok) throw new Error('내보내기 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `msspbiz_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('데이터를 내보냈습니다');
    } catch {
      toast.error('내보내기에 실패했습니다');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await backupApi.exportCsv(selectedModules);
      if (!res.ok) throw new Error('내보내기 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `msspbiz_backup_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV 데이터를 내보냈습니다');
    } catch {
      toast.error('CSV 내보내기에 실패했습니다');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('JSON 파일만 가져올 수 있습니다');
      return;
    }

    setImportFile(file);
    setImportResult(null);

    // Auto preview
    try {
      const previewData = await backupApi.importPreview(file);
      setPreview(previewData);
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error('미리보기에 실패했습니다');
      setPreview(null);
    }
  }, []);

  const handleImport = () => {
    if (!importFile) {
      toast.error('파일을 선택하세요');
      return;
    }
    setConfirmModalOpen(true);
  };

  const confirmImport = async () => {
    if (!importFile) return;

    setConfirmModalOpen(false);
    setImporting(true);

    try {
      const result = await backupApi.importData(importFile);
      setImportResult(result);
      toast.success('데이터를 가져왔습니다');
      setImportFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error('Import failed:', error);
      toast.error(error.message || '가져오기에 실패했습니다');
    } finally {
      setImporting(false);
    }
  };

  if (!canExport && !canImport) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">권한이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">데이터 관리는 Owner 또는 Admin만 접근할 수 있습니다</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Section */}
      {canExport && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 내보내기</h3>
          <p className="text-sm text-gray-600 mb-4">
            선택한 모듈의 데이터를 JSON 또는 CSV 형식으로 내보냅니다.
          </p>

          {/* Module Selection */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">내보낼 모듈 선택</label>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  전체 선택
                </button>
                <span className="text-xs text-gray-400">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  전체 해제
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MODULE_OPTIONS.map((module) => (
                <label
                  key={module.key}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(module.key)}
                    onChange={() => toggleModule(module.key)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{module.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-gray-800 pt-4 flex gap-2">
            <Button onClick={handleExportJson} disabled={exporting || selectedModules.length === 0}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? '내보내는 중...' : 'JSON 내보내기'}
            </Button>
            <Button variant="secondary" onClick={handleExportCsv} disabled={exporting || selectedModules.length === 0}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? '내보내는 중...' : 'CSV 내보내기'}
            </Button>
          </div>
        </Card>
      )}

      {/* Import Section */}
      {canImport && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 가져오기</h3>
          <p className="text-sm text-gray-600 mb-4">
            JSON 파일에서 데이터를 가져옵니다. <strong>주의: 기존 데이터와 중복될 수 있습니다.</strong>
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">파일 선택</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={importing}
              className="block w-full text-sm text-gray-900 border-2 border-gray-800 rounded-md cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Preview Table */}
          {preview && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">미리보기</h4>
              <div className="overflow-x-auto border-2 border-gray-800 rounded-md">
                <table className="min-w-full divide-y-2 divide-gray-800">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">모듈</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">건수</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-800">
                    {Object.entries(preview.modules).map(([moduleName, count]) => {
                      const moduleLabel = MODULE_OPTIONS.find((m) => m.key === moduleName)?.label || moduleName;
                      return (
                        <tr key={moduleName}>
                          <td className="px-4 py-2 text-sm text-gray-900">{moduleLabel}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="mb-4 bg-green-50 border-2 border-green-600 rounded-md p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">가져오기 완료</h4>
              <div className="space-y-1">
                {Object.entries(importResult.modules).map(([moduleName, count]) => {
                  const moduleLabel = MODULE_OPTIONS.find((m) => m.key === moduleName)?.label || moduleName;
                  return (
                    <p key={moduleName} className="text-sm text-green-700">
                      {moduleLabel}: {count}건
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t-2 border-gray-800 pt-4">
            <Button onClick={handleImport} disabled={!importFile || importing}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {importing ? '가져오는 중...' : '가져오기 실행'}
            </Button>
          </div>
        </Card>
      )}

      {/* Confirm Modal */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="데이터 가져오기 확인"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            선택한 파일에서 데이터를 가져옵니다. 기존 데이터와 중복될 수 있습니다.
          </p>
          <p className="text-sm font-semibold text-red-600">
            이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmImport}>
              확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
