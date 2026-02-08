'use client';

import { useEffect, useState } from 'react';
import { filesApi } from '@/lib/api';

interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  entityType: string | null;
  entityId: string | null;
  uploadedById: string;
  createdAt: string;
}

interface FileListProps {
  entityType: string;
  entityId: string;
  onDelete?: () => void;
}

export default function FileList({
  entityType,
  entityId,
  onDelete,
}: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    loadFiles();
  }, [entityType, entityId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await filesApi.list(entityType, entityId);
      setFiles(data);
    } catch (error) {
      console.error('파일 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const res = await filesApi.download(file.id);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('파일을 삭제하시겠습니까?')) return;

    try {
      await filesApi.delete(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (onDelete) onDelete();
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  const handlePreview = (file: FileItem) => {
    if (file.mimeType.startsWith('image/')) {
      setPreviewFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType === 'text/csv') return '📋';
    return '📎';
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">로딩 중...</div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        첨부된 파일이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() =>
                    file.mimeType.startsWith('image/')
                      ? handlePreview(file)
                      : handleDownload(file)
                  }
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block text-left"
                >
                  {file.originalName}
                </button>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDownload(file)}
                className="text-blue-500 hover:text-blue-700 px-2 py-1 text-sm"
                title="다운로드"
              >
                ⬇
              </button>
              <button
                onClick={() => handleDelete(file.id)}
                className="text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                title="삭제"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewFile(null)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold truncate">
                  {previewFile.originalName}
                </h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/v1/files/${previewFile.id}/download`}
                alt={previewFile.originalName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
