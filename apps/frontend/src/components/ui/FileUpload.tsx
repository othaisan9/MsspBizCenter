'use client';

import { useState, useRef } from 'react';
import { filesApi } from '@/lib/api';

interface FileUploadProps {
  entityType?: string;
  entityId?: string;
  onUpload?: (file: any) => void;
  maxFiles?: number;
  accept?: string;
}

export default function FileUpload({
  entityType,
  entityId,
  onUpload,
  maxFiles = 5,
  accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt',
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const filteredFiles = newFiles.filter((file) => {
      if (files.length + filteredFiles.length >= maxFiles) {
        alert(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...filteredFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const result = await filesApi.upload(file, entityType, entityId);

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

        if (onUpload) {
          onUpload(result);
        }
      }

      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('sheet') || file.type.includes('excel')) return '📊';
    if (file.type.includes('document') || file.type.includes('word')) return '📝';
    if (file.type === 'text/csv') return '📋';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-md p-8 text-center cursor-pointer
          transition-colors
          ${isDragOver ? 'border-primary-600 bg-primary-50' : 'border-gray-800 hover:border-gray-600 hover:bg-gray-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-gray-600">
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm">
            파일을 드래그하여 놓거나 클릭하여 선택하세요
          </p>
          <p className="text-xs text-gray-400 mt-1">
            최대 {maxFiles}개, 파일당 10MB 이하
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md border-2 border-gray-800"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(file)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-1 w-full bg-gray-200 rounded-md border border-gray-800 h-1">
                      <div
                        className="bg-primary-600 h-1 rounded-md transition-all"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            onClick={uploadFiles}
            disabled={uploading}
            className={`
              w-full py-2 px-4 rounded-md border-2 font-bold transition-all
              ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 shadow-none'
                  : 'bg-primary-600 text-white hover:bg-primary-700 border-gray-800 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px]'
              }
            `}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}
    </div>
  );
}
