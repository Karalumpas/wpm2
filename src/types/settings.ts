/**
 * Settings Types
 * 
 * Type definitions for user settings
 */

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: 'left' | 'right' | 'left_space' | 'right_space';
  productsPerPage: number;
  defaultViewMode: 'grid' | 'list';
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

export const CURRENCY_POSITION_OPTIONS = [
  { value: 'left', label: '$123' },
  { value: 'right', label: '123$' },
  { value: 'left_space', label: '$ 123' },
  { value: 'right_space', label: '123 $' },
] as const;
