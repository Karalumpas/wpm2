import axios, { AxiosInstance } from 'axios';

// PhotoPrism configuration
const PHOTOPRISM_URL = process.env.PHOTOPRISM_URL || 'http://localhost:2342';
const PHOTOPRISM_USER = process.env.PHOTOPRISM_USER || 'admin';
const PHOTOPRISM_PASSWORD = process.env.PHOTOPRISM_PASSWORD || 'insecure';

interface PhotoPrismAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

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
  Files: PhotoPrismFile[];
}

interface PhotoPrismFile {
  UID: string;
  Name: string;
  Root: string;
  Hash: string;
  Size: number;
  Codec: string;
  Type: string;
  Mime: string;
  Width: number;
  Height: number;
  Primary: boolean;
}

interface PhotoPrismAlbum {
  UID: string;
  Slug: string;
  Type: string;
  Title: string;
  Description: string;
  Order: string;
  Country: string;
  CreatedAt: string;
  UpdatedAt: string;
  PhotoCount: number;
}

class PhotoPrismClient {
  private apiClient: AxiosInstance;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor() {
    this.apiClient = axios.create({
      baseURL: `${PHOTOPRISM_URL}/api/v1`,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.apiClient.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  // Authenticate with PhotoPrism
  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post<PhotoPrismAuthResponse>(
        `${PHOTOPRISM_URL}/api/v1/session`,
        {
          username: PHOTOPRISM_USER,
          password: PHOTOPRISM_PASSWORD,
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      console.log('Successfully authenticated with PhotoPrism');
    } catch (error) {
      console.error('Failed to authenticate with PhotoPrism:', error);
      throw error;
    }
  }

  // Ensure we have a valid authentication token
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
  }

  // Search photos
  async searchPhotos(query?: string, count: number = 24, offset: number = 0): Promise<PhotoPrismPhoto[]> {
    try {
      const params = new URLSearchParams({
        count: count.toString(),
        offset: offset.toString(),
        ...(query && { q: query }),
      });

      const response = await this.apiClient.get<PhotoPrismPhoto[]>(`/photos?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching photos:', error);
      throw error;
    }
  }

  // Get photo by UID
  async getPhoto(uid: string): Promise<PhotoPrismPhoto> {
    try {
      const response = await this.apiClient.get<PhotoPrismPhoto>(`/photos/${uid}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting photo ${uid}:`, error);
      throw error;
    }
  }

  // Update photo metadata
  async updatePhoto(uid: string, data: Partial<PhotoPrismPhoto>): Promise<PhotoPrismPhoto> {
    try {
      const response = await this.apiClient.put<PhotoPrismPhoto>(`/photos/${uid}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating photo ${uid}:`, error);
      throw error;
    }
  }

  // Get photo thumbnail URL
  getPhotoThumbnailUrl(uid: string, size: 'tile_224' | 'tile_500' | 'fit_720' | 'fit_1280' | 'fit_1920' = 'tile_224'): string {
    return `${PHOTOPRISM_URL}/api/v1/t/${uid}/${PHOTOPRISM_USER}/${size}`;
  }

  // Get photo download URL
  getPhotoDownloadUrl(uid: string): string {
    return `${PHOTOPRISM_URL}/api/v1/dl/${uid}?t=${this.accessToken}`;
  }

  // Get all albums
  async getAlbums(count: number = 100, offset: number = 0): Promise<PhotoPrismAlbum[]> {
    try {
      const params = new URLSearchParams({
        count: count.toString(),
        offset: offset.toString(),
      });

      const response = await this.apiClient.get<PhotoPrismAlbum[]>(`/albums?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting albums:', error);
      throw error;
    }
  }

  // Create album
  async createAlbum(title: string, description?: string): Promise<PhotoPrismAlbum> {
    try {
      const response = await this.apiClient.post<PhotoPrismAlbum>('/albums', {
        Title: title,
        Description: description || '',
      });
      return response.data;
    } catch (error) {
      console.error('Error creating album:', error);
      throw error;
    }
  }

  // Add photos to album
  async addPhotosToAlbum(albumUID: string, photoUIDs: string[]): Promise<void> {
    try {
      await this.apiClient.post(`/albums/${albumUID}/photos`, {
        photos: photoUIDs,
      });
    } catch (error) {
      console.error(`Error adding photos to album ${albumUID}:`, error);
      throw error;
    }
  }

  // Start indexing
  async startIndexing(path?: string): Promise<void> {
    try {
      await this.apiClient.post('/index', {
        path: path || '/photoprism/originals',
      });
    } catch (error) {
      console.error('Error starting indexing:', error);
      throw error;
    }
  }

  // Get indexing status
  async getIndexingStatus(): Promise<{ indexing: boolean; importing: boolean }> {
    try {
      const response = await this.apiClient.get('/status');
      return {
        indexing: response.data.indexing || false,
        importing: response.data.importing || false,
      };
    } catch (error) {
      console.error('Error getting indexing status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const photoPrismClient = new PhotoPrismClient();

// Export types
export type { PhotoPrismPhoto, PhotoPrismFile, PhotoPrismAlbum };