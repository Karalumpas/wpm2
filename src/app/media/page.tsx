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
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-2 text-gray-600">
            Upload and manage files using MinIO object storage
          </p>
        </div>

        <div className="mb-8">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
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
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Uploading...</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No files uploaded
            </h3>
            <p className="text-gray-600">
              Upload your first file to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
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

                  <div className="absolute top-2 right-2 flex space-x-1">
                    {file.isIndexed && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Indexed
                      </span>
                    )}
                    {file.isFeatured && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3
                    className="font-medium text-gray-900 text-sm truncate"
                    title={file.originalFileName}
                  >
                    {file.originalFileName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{file.fileSize}</p>
                  <p className="text-xs text-gray-400 mt-1">{file.mimeType}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex space-x-2">
                      <a
                        href={file.minioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={file.minioUrl}
                        download={file.fileName}
                        className="text-green-600 hover:text-green-800"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-800"
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
