import { UserSettings } from '@/types/settings';

/**
 * Format a price according to user settings
 */
export function formatPrice(
  price: string | number | null,
  settings: UserSettings
): string {
  // Handle null or undefined prices
  if (price === null || price === undefined) {
    return 'N/A';
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return 'N/A';
  }

  // Format the number to 2 decimal places
  const formattedNumber = numericPrice.toFixed(2);
  
  // Apply currency symbol and position
  const { currencySymbol, currencyPosition } = settings;
  
  switch (currencyPosition) {
    case 'left':
      return `${currencySymbol}${formattedNumber}`;
    case 'left_space':
      return `${currencySymbol} ${formattedNumber}`;
    case 'right':
      return `${formattedNumber}${currencySymbol}`;
    case 'right_space':
    default:
      return `${formattedNumber} ${currencySymbol}`;
  }
}

/**
 * Parse a price string to a number
 */
export function parsePrice(priceString: string): number {
  // Remove any non-numeric characters except decimal point
  const cleaned = priceString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get currency symbol by currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbolMap: Record<string, string> = {
    'DKK': 'kr',
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'SEK': 'kr',
    'NOK': 'kr',
  };
  
  return symbolMap[currencyCode] || currencyCode;
}
