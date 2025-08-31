'use client';

import { useState } from 'react';

export function CopyButton({
  value,
  label = 'Copy',
  className = '',
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback: select + alert
      window.prompt('Copy to clipboard:', value);
    }
  }

  return (
    <button
      onClick={copy}
      className={
        'inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border bg-white hover:bg-gray-50 transition ' +
        className
      }
      title={copied ? 'Kopieret' : 'Kopiér til udklipsholder'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-4 h-4 ${copied ? 'text-emerald-600' : 'text-gray-500'}`}
      >
        <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z" />
      </svg>
      {copied ? 'Kopieret' : label}
    </button>
  );
}

export default CopyButton;
