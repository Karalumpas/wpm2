'use client';

import { useState } from 'react';
import {
  Share2,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

type SocialAccount = {
  id: string;
  provider:
    | 'facebook'
    | 'instagram'
    | 'twitter'
    | 'linkedin'
    | 'tiktok'
    | 'pinterest';
  accountName: string;
  accountId: string;
  isConnected: boolean;
  followers: number;
  lastPost: string;
  permissions: string[];
  expiresAt?: string;
};

type SocialIntegrationsClientProps = {
  user: {
    id?: string;
  };
};

const providerInfo = {
  facebook: {
    name: 'Facebook',
    icon: '👥',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Share products and updates to your Facebook page',
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    description: 'Post product photos and stories to Instagram',
  },
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Tweet about products and engage with customers',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Share business updates and professional content',
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Create engaging video content for products',
  },
  pinterest: {
    name: 'Pinterest',
    icon: '📌',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Pin product images to themed boards',
  },
};

export default function SocialIntegrationsClient({
  user,
}: SocialIntegrationsClientProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      id: '1',
      provider: 'facebook',
      accountName: 'My Business Page',
      accountId: 'mybusiness',
      isConnected: true,
      followers: 12543,
      lastPost: '2 days ago',
      permissions: ['pages_manage_posts', 'pages_read_engagement'],
      expiresAt: '2024-12-01',
    },
    {
      id: '2',
      provider: 'instagram',
      accountName: '@mybusiness_official',
      accountId: 'mybusiness_official',
      isConnected: false,
      followers: 8921,
      lastPost: '1 week ago',
      permissions: [],
    },
  ]);

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    keyof typeof providerInfo | null
  >(null);

  const handleConnect = (provider: keyof typeof providerInfo) => {
    setSelectedProvider(provider);
    setShowConnectModal(true);
  };

  const handleDisconnect = (id: string) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === id
          ? { ...account, isConnected: false, permissions: [] }
          : account
      )
    );
  };

  const handleRemove = (id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
  };

  const connectedAccounts = accounts.filter((account) => account.isConnected);
  const availableProviders = Object.keys(providerInfo).filter(
    (provider) => !accounts.some((account) => account.provider === provider)
  ) as (keyof typeof providerInfo)[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Share2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Social Media Integrations
            </h2>
            <p className="text-sm text-gray-600">
              Connect your social media accounts to automate posting
            </p>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Connected Accounts
        </h3>

        {connectedAccounts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Share2 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              No social media accounts connected yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {connectedAccounts.map((account) => {
              const provider = providerInfo[account.provider];
              const isExpiringSoon =
                account.expiresAt &&
                new Date(account.expiresAt) <
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={account.id}
                  className="bg-white border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{provider.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {account.accountName}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${provider.color}`}
                          >
                            {provider.name}
                          </span>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-sm text-gray-600">
                          @{account.accountId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {account.followers.toLocaleString()} followers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Last post: {account.lastPost}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {account.permissions.length} permissions
                      </span>
                    </div>
                  </div>

                  {/* Expiration Warning */}
                  {isExpiringSoon && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-800">
                          Access token expires on{' '}
                          {new Date(account.expiresAt!).toLocaleDateString()}
                        </span>
                        <button className="ml-auto text-sm font-medium text-amber-700 hover:text-amber-900">
                          Refresh Token
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Permissions */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Granted Permissions
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {account.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {permission.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Providers */}
      {availableProviders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Available Platforms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableProviders.map((provider) => {
              const info = providerInfo[provider];
              return (
                <div
                  key={provider}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{info.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{info.name}</h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${info.color}`}
                      >
                        Available
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {info.description}
                  </p>

                  <button
                    onClick={() => handleConnect(provider)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Connect {info.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Posting Features */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Automated Posting Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              🤖 AI-Powered Content
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Generate engaging captions automatically</li>
              <li>• Create platform-specific content</li>
              <li>• Optimize posting times</li>
              <li>• Hashtag suggestions</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              📅 Scheduling & Automation
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Schedule posts in advance</li>
              <li>• Auto-post new products</li>
              <li>• Cross-platform publishing</li>
              <li>• Performance analytics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedProvider && (
        <ConnectModal
          provider={selectedProvider}
          onClose={() => {
            setShowConnectModal(false);
            setSelectedProvider(null);
          }}
          onConnect={(accountData) => {
            const newAccount: SocialAccount = {
              id: Date.now().toString(),
              provider: selectedProvider,
              accountName: accountData.name,
              accountId: accountData.id,
              isConnected: true,
              followers: accountData.followers || 0,
              lastPost: 'Never',
              permissions: accountData.permissions || [],
            };
            setAccounts((prev) => [...prev, newAccount]);
            setShowConnectModal(false);
            setSelectedProvider(null);
          }}
        />
      )}
    </div>
  );
}

// Connect Modal Component
function ConnectModal({
  provider,
  onClose,
  onConnect,
}: {
  provider: keyof typeof providerInfo;
  onClose: () => void;
  onConnect: (data: {
    name: string;
    id: string;
    followers?: number;
    permissions?: string[];
  }) => void;
}) {
  const info = providerInfo[provider];
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate OAuth flow
    setTimeout(() => {
      onConnect({
        name: `My ${info.name} Account`,
        id: `user_${provider}`,
        followers: Math.floor(Math.random() * 10000),
        permissions: [`${provider}_manage_posts`, `${provider}_read_insights`],
      });
      setIsConnecting(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">{info.icon}</div>
          <h3 className="text-lg font-medium text-gray-900">
            Connect {info.name}
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{info.description}</p>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              We&apos;ll request these permissions:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Post content to your account</li>
              <li>• Read basic profile information</li>
              <li>• Access engagement metrics</li>
              <li>• Schedule posts</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Connect to {info.name}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isConnecting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
