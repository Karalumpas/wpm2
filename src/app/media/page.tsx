'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Upload, Trash2, Download, Eye } from 'lucide-react';

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

  // Fetch media files
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

  // Upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      await fetchFiles(); // Refresh the list
      
      // Reset the input
      event.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file
  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/media?id=${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      await fetchFiles(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Format file size
  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-2 text-gray-600">
            Manage your uploaded files and images stored in MinIO
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Upload New File</h2>
          <div className="flex items-center space-x-4">
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                <Upload className="h-4 w-4" />
                <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
              </div>
            </label>
            <span className="text-sm text-gray-500">
              Supports: JPG, PNG, GIF, WebP (max 10MB)
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Files Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading media files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
            <p className="text-gray-600">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => (
              <div key={file.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100 relative">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.minioUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-4xl text-gray-400">📄</div>
                    </div>
                  )}
                  
                  {/* Featured Badge */}
                  {file.isFeatured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Featured
                    </div>
                  )}

                  {/* PhotoPrism Indexed Badge */}
                  {file.isIndexed && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Indexed
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate" title={file.fileName}>
                    {file.fileName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(file.fileSize)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
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
    </MainLayout>
  );
}