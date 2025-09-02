'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  DollarSign,
  Clock,
  Brain,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

type AnalyticsClientProps = {
  user: {
    id?: string;
  };
};

type UsageMetric = {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
  avgResponseTime: number;
};

type ProviderUsage = {
  provider: string;
  requests: number;
  tokens: number;
  cost: number;
  percentage: number;
  color: string;
};

export default function AnalyticsClient({ user }: AnalyticsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('requests');

  // Mock data
  const usageData: UsageMetric[] = [
    { date: '2024-09-26', requests: 45, tokens: 1240, cost: 2.34, avgResponseTime: 1.8 },
    { date: '2024-09-27', requests: 62, tokens: 1890, cost: 3.21, avgResponseTime: 2.1 },
    { date: '2024-09-28', requests: 38, tokens: 980, cost: 1.76, avgResponseTime: 1.5 },
    { date: '2024-09-29', requests: 71, tokens: 2340, cost: 4.12, avgResponseTime: 2.3 },
    { date: '2024-09-30', requests: 54, tokens: 1650, cost: 2.89, avgResponseTime: 1.9 },
    { date: '2024-10-01', requests: 89, tokens: 2890, cost: 5.67, avgResponseTime: 2.5 },
    { date: '2024-10-02', requests: 67, tokens: 2100, cost: 3.45, avgResponseTime: 2.0 },
  ];

  const providerUsage: ProviderUsage[] = [
    { provider: 'OpenAI GPT-4', requests: 245, tokens: 12890, cost: 18.34, percentage: 65, color: 'bg-blue-500' },
    { provider: 'Anthropic Claude', requests: 89, tokens: 5430, cost: 7.21, percentage: 25, color: 'bg-purple-500' },
    { provider: 'Ollama Local', requests: 34, tokens: 2340, cost: 0.00, percentage: 10, color: 'bg-green-500' },
  ];

  const totalRequests = usageData.reduce((sum, day) => sum + day.requests, 0);
  const totalTokens = usageData.reduce((sum, day) => sum + day.tokens, 0);
  const totalCost = usageData.reduce((sum, day) => sum + day.cost, 0);
  const avgResponseTime = usageData.reduce((sum, day) => sum + day.avgResponseTime, 0) / usageData.length;

  const maxValue = Math.max(...usageData.map(d => {
    switch (selectedMetric) {
      case 'tokens': return d.tokens;
      case 'cost': return d.cost;
      case 'responseTime': return d.avgResponseTime;
      default: return d.requests;
    }
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Usage Analytics</h2>
            <p className="text-sm text-gray-600">Track your AI usage, costs, and performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Requests</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalRequests.toLocaleString()}</div>
          <div className="text-sm text-green-600 mt-1">+12% from last period</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Tokens Used</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalTokens.toLocaleString()}</div>
          <div className="text-sm text-green-600 mt-1">+8% from last period</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Cost</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
          <div className="text-sm text-red-600 mt-1">+15% from last period</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Avg Response</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgResponseTime.toFixed(1)}s</div>
          <div className="text-sm text-green-600 mt-1">-5% from last period</div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Usage Trends</h3>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="requests">Requests</option>
              <option value="tokens">Tokens</option>
              <option value="cost">Cost ($)</option>
              <option value="responseTime">Response Time (s)</option>
            </select>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-4">
          {usageData.map((day, index) => {
            const value = (() => {
              switch (selectedMetric) {
                case 'tokens': return day.tokens;
                case 'cost': return day.cost;
                case 'responseTime': return day.avgResponseTime;
                default: return day.requests;
              }
            })();
            
            const percentage = (value / maxValue) * 100;
            const date = new Date(day.date);
            
            return (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {selectedMetric === 'cost' ? `$${value.toFixed(2)}` : 
                         selectedMetric === 'responseTime' ? `${value.toFixed(1)}s` :
                         value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Provider</h3>
          
          <div className="space-y-4">
            {providerUsage.map((provider) => (
              <div key={provider.provider}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{provider.provider}</span>
                  <span className="text-sm text-gray-600">{provider.percentage}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`${provider.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${provider.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{provider.requests} requests</span>
                  <span>${provider.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
          
          <div className="space-y-4">
            {providerUsage.map((provider) => (
              <div key={provider.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${provider.color}`} />
                  <span className="font-medium text-gray-900">{provider.provider}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">${provider.cost.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{provider.tokens.toLocaleString()} tokens</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between font-medium text-gray-900">
              <span>Total Monthly Cost</span>
              <span>${providerUsage.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Patterns */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">68%</div>
            <div className="text-sm text-gray-600">Product descriptions</div>
            <div className="text-xs text-gray-500 mt-1">Most common use case</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">2.1s</div>
            <div className="text-sm text-gray-600">Peak performance</div>
            <div className="text-xs text-gray-500 mt-1">Fastest response time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">14:30</div>
            <div className="text-sm text-gray-600">Peak usage time</div>
            <div className="text-xs text-gray-500 mt-1">Most active hour</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent AI Activity</h3>
        
        <div className="space-y-3">
          {[
            {
              action: 'Generated product description',
              provider: 'GPT-4 Turbo',
              time: '2 minutes ago',
              tokens: 145,
              cost: 0.23,
            },
            {
              action: 'Translated content to Danish',
              provider: 'Claude 3 Sonnet',
              time: '15 minutes ago',
              tokens: 234,
              cost: 0.34,
            },
            {
              action: 'Generated SEO meta tags',
              provider: 'GPT-4 Turbo',
              time: '1 hour ago',
              tokens: 89,
              cost: 0.12,
            },
            {
              action: 'Created social media post',
              provider: 'Ollama Llama 2',
              time: '2 hours ago',
              tokens: 156,
              cost: 0.00,
            },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Brain className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{activity.action}</div>
                  <div className="text-sm text-gray-600">{activity.provider} • {activity.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {activity.tokens} tokens
                </div>
                <div className="text-xs text-gray-500">
                  ${activity.cost.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
