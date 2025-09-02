'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  ExternalLink
} from 'lucide-react';

type BillingClientProps = {
  user: {
    id?: string;
    email?: string | null;
  };
};

type Invoice = {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl?: string;
};

export default function BillingClient({ user }: BillingClientProps) {
  const [currentPlan] = useState({
    name: 'Professional',
    price: 29,
    billing: 'monthly',
    features: [
      'Unlimited AI requests',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Team collaboration',
    ],
  });

  const [usage] = useState({
    currentMonth: {
      aiRequests: 1247,
      cost: 23.45,
      limit: 10000,
    },
    lastMonth: {
      aiRequests: 892,
      cost: 18.23,
    },
  });

  const [invoices] = useState<Invoice[]>([
    {
      id: 'INV-2024-002',
      date: '2024-09-01',
      amount: 52.45,
      status: 'paid',
      description: 'Professional Plan + AI Usage',
      downloadUrl: '#',
    },
    {
      id: 'INV-2024-001',
      date: '2024-08-01',
      amount: 47.23,
      status: 'paid',
      description: 'Professional Plan + AI Usage',
      downloadUrl: '#',
    },
  ]);

  const [paymentMethod] = useState({
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
  });

  const usagePercentage = (usage.currentMonth.aiRequests / usage.currentMonth.limit) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Billing & Usage</h2>
          <p className="text-sm text-gray-600">Manage your subscription and monitor usage</p>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Upgrade Plan
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{currentPlan.name}</h4>
            <p className="text-gray-600">
              ${currentPlan.price}/{currentPlan.billing}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Next billing date</div>
            <div className="font-medium text-gray-900">October 1, 2024</div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {currentPlan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Change Plan
          </button>
          <button className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Usage This Month */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Current Month Usage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{usage.currentMonth.aiRequests.toLocaleString()}</div>
            <div className="text-sm text-gray-600">AI Requests</div>
            <div className="text-xs text-gray-500 mt-1">
              of {usage.currentMonth.limit.toLocaleString()} limit
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${usage.currentMonth.cost.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Current Cost</div>
            <div className="text-xs text-gray-500 mt-1">
              +{(((usage.currentMonth.cost - usage.lastMonth.cost) / usage.lastMonth.cost) * 100).toFixed(1)}% from last month
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{usagePercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Plan Usage</div>
            <div className="text-xs text-gray-500 mt-1">
              {(usage.currentMonth.limit - usage.currentMonth.aiRequests).toLocaleString()} remaining
            </div>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">AI Request Usage</span>
            <span className="text-sm text-gray-600">{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                usagePercentage > 90 ? 'bg-red-500' :
                usagePercentage > 75 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {usagePercentage > 80 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                You're approaching your monthly limit. Consider upgrading your plan.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Update
          </button>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {paymentMethod.brand} ending in {paymentMethod.last4}
            </div>
            <div className="text-sm text-gray-600">
              Expires {paymentMethod.expiryMonth.toString().padStart(2, '0')}/{paymentMethod.expiryYear}
            </div>
          </div>
          <div className="text-green-600">
            <Check className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <Download className="h-4 w-4" />
            Download All
          </button>
        </div>
        
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{invoice.id}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(invoice.date).toLocaleDateString()} • {invoice.description}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium text-gray-900">${invoice.amount.toFixed(2)}</div>
                  <div className={`text-sm ${
                    invoice.status === 'paid' ? 'text-green-600' :
                    invoice.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </div>
                </div>
                
                {invoice.downloadUrl && (
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Trends */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Usage Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">+39%</div>
            <div className="text-sm text-gray-600">Usage growth</div>
            <div className="text-xs text-gray-500 mt-1">vs last month</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">$0.019</div>
            <div className="text-sm text-gray-600">Avg cost per request</div>
            <div className="text-xs text-gray-500 mt-1">-12% optimization</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">14:30</div>
            <div className="text-sm text-gray-600">Peak usage time</div>
            <div className="text-xs text-gray-500 mt-1">weekday average</div>
          </div>
        </div>
      </div>

      {/* Cost Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Management</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Usage Alerts</h4>
              <p className="text-sm text-gray-600">Get notified when approaching limits</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-billing</h4>
              <p className="text-sm text-gray-600">Automatically pay invoices</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
              <ExternalLink className="h-4 w-4" />
              View detailed usage analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
