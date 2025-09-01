'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, Download, Heart } from 'lucide-react';
import { ProtectedClient } from '@/components/auth/ProtectedClient';

interface PhotoPrismPhoto {
  UID: string;
  Title: string;
  Description: string;
  OriginalName: string;
  Filename: string;
  Hash: string;
  Width: number;
  Height: number;
  CreatedAt: string;
  UpdatedAt: string;
  TakenAt: string;
  Quality: number;
  Favorite: boolean;
  Type: string;
  Mime: string;
  thumbnailUrl: string;
  previewUrl: string;
  downloadUrl: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoPrismPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async (query?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query) params.append('q', query);

      const response = await fetch(`/api/photos?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartIndexing = async () => {
    try {
      setIsIndexing(true);
      setError(null);

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'index' }),
      });

      if (!response.ok) {
        throw new Error('Failed to start indexing');
      }

      pollIndexingStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start indexing');
      setIsIndexing(false);
    }
  };

  const pollIndexingStatus = async () => {
    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status' }),
      });

      if (response.ok) {
        const status = await response.json();
        if (status.indexing) {
          setTimeout(pollIndexingStatus, 2000);
        } else {
          setIsIndexing(false);
          fetchPhotos();
        }
      } else {
        setIsIndexing(false);
      }
    } catch (err) {
      setIsIndexing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPhotos(searchQuery);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  return (
    <ProtectedClient>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100/50 p-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Photo Management
            </h1>
            <p className="mt-2 text-gray-600">
              Browse and manage photos using PhotoPrism AI-powered photo
              management
            </p>
          </div>
        </div>

        <div className="mb-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search photos..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                Search
              </button>
            </form>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleStartIndexing}
                disabled={isIndexing}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isIndexing ? 'animate-spin' : ''}`}
                />
                <span>{isIndexing ? 'Indexing...' : 'Start Indexing'}</span>
              </button>
              <button
                onClick={() => fetchPhotos(searchQuery)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {isIndexing && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <p className="text-blue-800 font-medium">
              PhotoPrism is indexing your photos. This may take a while...
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-12">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <div className="text-4xl">📷</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No photos found
              </h3>
              <p className="text-gray-600 mb-8">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Upload photos to your PhotoPrism library and start indexing'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleStartIndexing}
                  disabled={isIndexing}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                  Start Indexing
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.UID}
                className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.Title || photo.OriginalName}
                    className="w-full h-full object-cover"
                  />

                  {photo.Favorite && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
                      <Heart className="h-3 w-3 fill-current" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex gap-2">
                      <a
                        href={photo.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white shadow-lg transition-all duration-200"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={photo.downloadUrl}
                        className="p-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white shadow-lg transition-all duration-200"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3
                    className="font-semibold text-gray-900 text-sm truncate"
                    title={photo.Title || photo.OriginalName}
                  >
                    {photo.Title || photo.OriginalName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {photo.Width} x {photo.Height}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(
                      photo.TakenAt || photo.CreatedAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && photos.length % 24 === 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchPhotos(searchQuery)}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </ProtectedClient>
  );
}
