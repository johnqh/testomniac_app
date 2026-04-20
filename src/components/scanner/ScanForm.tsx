import { useState, type FormEvent } from 'react';

interface ScanFormProps {
  onSubmit: (url: string, email?: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
  showEmail?: boolean;
}

export function ScanForm({ onSubmit, isSubmitting, error, showEmail = true }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function validateEmailDomain(emailValue: string, urlValue: string): boolean {
    if (!emailValue) return true;
    try {
      const urlDomain = new URL(urlValue).hostname.split('.').slice(-2).join('.');
      const emailDomain = emailValue.split('@')[1]?.toLowerCase();
      return emailDomain === urlDomain || emailDomain?.endsWith('.' + urlDomain);
    } catch {
      return false;
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!url.trim()) {
      setValidationError('URL is required');
      return;
    }

    try {
      new URL(url);
    } catch {
      setValidationError('Please enter a valid URL');
      return;
    }

    if (email && !validateEmailDomain(email, url)) {
      setValidationError('Email domain must match the website domain');
      return;
    }

    onSubmit(url.trim(), email.trim() || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="scan-url"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Website URL
        </label>
        <input
          id="scan-url"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {showEmail && (
        <div>
          <label
            htmlFor="scan-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email (optional)
          </label>
          <input
            id="scan-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Must match the website domain if provided
          </p>
        </div>
      )}

      {(validationError || error) && (
        <div className="text-sm text-red-600 dark:text-red-400">{validationError || error}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
      >
        {isSubmitting ? 'Starting Scan...' : 'Start Scan'}
      </button>
    </form>
  );
}
