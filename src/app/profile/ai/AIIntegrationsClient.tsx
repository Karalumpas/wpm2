'use client';

import { useState } from 'react';
import { 
  Brain, 
  Plus, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Zap,
  Globe,
  Key,
  Server
} from 'lucide-react';

type AIProvider = {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'ollama' | 'groq';
  model: string;
  isActive: boolean;
  hasApiKey: boolean;
  baseUrl?: string;
  status: 'connected' | 'error' | 'testing';
};

type AIIntegrationsClientProps = {
  user: {
    id?: string;
  };
};

const providerIcons = {
  openai: '🤖',
  anthropic: '🧠',
  ollama: '🦙',
  groq: '⚡',
};

const providerColors = {
  openai: 'bg-green-100 text-green-800 border-green-200',
  anthropic: 'bg-purple-100 text-purple-800 border-purple-200',
  ollama: 'bg-blue-100 text-blue-800 border-blue-200',
  groq: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function AIIntegrationsClient({ user }: AIIntegrationsClientProps) {
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: '1',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      isActive: true,
      hasApiKey: true,
      status: 'connected',
    },
    {
      id: '2',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      isActive: false,
      hasApiKey: false,
      status: 'error',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});

  const handleToggleActive = (id: string) => {
    setProviders(prev => 
      prev.map(p => 
        p.id === id ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  const handleDeleteProvider = (id: string) => {
    setProviders(prev => prev.filter(p => p.id !== id));
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Integrations</h2>
            <p className="text-sm text-gray-600">Configure AI providers for content generation and automation</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </button>
      </div>

      {/* Active Providers */}
      <div className="space-y-4 mb-8">
        {providers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Providers Configured</h3>
            <p className="text-gray-600 mb-4">Add your first AI provider to start using AI features.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              <Plus className="h-4 w-4" />
              Add AI Provider
            </button>
          </div>
        ) : (
          providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{providerIcons[provider.provider]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${providerColors[provider.provider]}`}>
                        {provider.provider}
                      </span>
                      <div className="flex items-center gap-1">
                        {provider.status === 'connected' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          provider.status === 'connected' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {provider.status === 'connected' ? 'Connected' : 'Error'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Model: {provider.model}</p>
                    {provider.baseUrl && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Server className="h-3 w-3" />
                        {provider.baseUrl}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provider.isActive}
                      onChange={() => handleToggleActive(provider.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  
                  <button
                    onClick={() => setSelectedProvider(provider)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* API Key Status */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">API Key</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      provider.hasApiKey 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.hasApiKey ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  
                  {provider.hasApiKey && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 font-mono">
                        {showApiKey[provider.id] ? 'sk-proj-abc123...' : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleApiKeyVisibility(provider.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey[provider.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          AI Usage This Month
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <div className="text-sm text-gray-600">Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">45,892</div>
            <div className="text-sm text-gray-600">Tokens Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">$12.34</div>
            <div className="text-sm text-gray-600">Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">2.3s</div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>
      </div>

      {/* Available AI Features */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available AI Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Product Descriptions',
              description: 'Generate compelling product descriptions automatically',
              icon: '📝',
              enabled: true,
            },
            {
              title: 'SEO Optimization',
              description: 'Create SEO-friendly titles and meta descriptions',
              icon: '🔍',
              enabled: true,
            },
            {
              title: 'Image Captions',
              description: 'Generate alt text and captions for product images',
              icon: '🖼️',
              enabled: false,
            },
            {
              title: 'Translation',
              description: 'Translate content to multiple languages',
              icon: '🌍',
              enabled: false,
            },
            {
              title: 'Content Moderation',
              description: 'Automatically review and moderate user content',
              icon: '🛡️',
              enabled: false,
            },
            {
              title: 'Price Suggestions',
              description: 'AI-powered pricing recommendations',
              icon: '💰',
              enabled: false,
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`p-4 rounded-lg border-2 ${
                feature.enabled
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{feature.icon}</span>
                <h4 className="font-medium text-gray-900">{feature.title}</h4>
                {feature.enabled && (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                )}
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <AddProviderModal 
          onClose={() => setShowAddModal(false)}
          onAdd={(newProvider) => {
            setProviders(prev => [...prev, { ...newProvider, id: Date.now().toString() }]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Provider Modal */}
      {selectedProvider && (
        <EditProviderModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onSave={(updatedProvider) => {
            setProviders(prev => 
              prev.map(p => p.id === updatedProvider.id ? updatedProvider : p)
            );
            setSelectedProvider(null);
          }}
        />
      )}
    </div>
  );
}

// Add Provider Modal Component
function AddProviderModal({ 
  onClose, 
  onAdd 
}: { 
  onClose: () => void;
  onAdd: (provider: Omit<AIProvider, 'id'>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'ollama' | 'groq',
    model: '',
    apiKey: '',
    baseUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      provider: formData.provider,
      model: formData.model,
      isActive: false,
      hasApiKey: !!formData.apiKey,
      baseUrl: formData.baseUrl || undefined,
      status: 'testing',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add AI Provider</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., GPT-4 Turbo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., gpt-4-turbo-preview"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="sk-..."
            />
          </div>

          {formData.provider === 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="http://localhost:11434"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Add Provider
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Provider Modal Component
function EditProviderModal({ 
  provider, 
  onClose, 
  onSave 
}: { 
  provider: AIProvider;
  onClose: () => void;
  onSave: (provider: AIProvider) => void;
}) {
  const [formData, setFormData] = useState({
    name: provider.name,
    model: provider.model,
    apiKey: '',
    baseUrl: provider.baseUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...provider,
      name: formData.name,
      model: formData.model,
      baseUrl: formData.baseUrl || undefined,
      hasApiKey: !!formData.apiKey || provider.hasApiKey,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit AI Provider</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave empty to keep current key"
            />
          </div>

          {provider.provider === 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
