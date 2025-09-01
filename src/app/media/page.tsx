'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, Download, Eye } from 'lucide-react';
import { ProtectedClient } from '@/components/auth/ProtectedClient';

interface MediaFile {
  id: string;
  fileName: string;
  originalFileName: string;
  objectName: string;
  fileSize: string;
  mimeType: string;
  minioUrl: string;
  photoPrismUID: string | null;
  productId: string | null;
  isFeatured: boolean;
  isIndexed: boolean;
  createdAt: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/media');

      if (!response.ok) {
        throw new Error('Failed to fetch media files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await fetchFiles();

      if (event.target) {
        event.target.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch('/api/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: fileId }),
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <ProtectedClient>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100/50 p-8">
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="mt-2 text-gray-600">
              Upload and manage files using MinIO object storage
            </p>
          </div>
        </div>

        <div className="mb-8">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-200 border-dashed rounded-2xl cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="p-4 bg-blue-100 rounded-2xl mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="mb-2 text-sm text-gray-700">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
              accept="image/*"
            />
          </label>
          {isUploading && (
            <div className="mt-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 font-medium">Uploading...</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-12">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <div className="text-4xl">📁</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No files uploaded
              </h3>
              <p className="text-gray-600">
                Upload your first file to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.minioUrl}
                      alt={file.originalFileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-4xl text-gray-400">📄</div>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    {file.isIndexed && (
                      <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-lg font-medium shadow-sm">
                        Indexed
                      </span>
                    )}
                    {file.isFeatured && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-lg font-medium shadow-sm">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3
                    className="font-semibold text-gray-900 text-sm truncate"
                    title={file.originalFileName}
                  >
                    {file.originalFileName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{file.fileSize}</p>
                  <p className="text-xs text-gray-400 mt-1">{file.mimeType}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <a
                        href={file.minioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={file.minioUrl}
                        download={file.fileName}
                        className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedClient>
  );
}
