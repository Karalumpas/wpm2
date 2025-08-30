'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

type TabKey = 'signin' | 'signup' | 'forgot';

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AuthModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/products';

  const [active, setActive] = useState<TabKey>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sign in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot/reset state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const tabs = useMemo(
    () =>
      [
        { key: 'signin', label: 'Sign In' },
        { key: 'signup', label: 'Sign Up' },
        { key: 'forgot', label: 'Forgot Password' },
      ] as { key: TabKey; label: string }[],
    []
  );

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      setLoading(false);
      if (res?.error) {
        setError('Invalid email or password.');
        return;
      }
      router.push(res?.url || callbackUrl);
    },
    [email, password, router, callbackUrl]
  );

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);
      try {
        const resp = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, password: regPassword }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        setMessage('Account created! Signing you in...');
        const res = await signIn('credentials', {
          email: regEmail,
          password: regPassword,
          redirect: false,
          callbackUrl,
        });
        if (res?.error) {
          setError('Registered, but auto sign-in failed. Please sign in.');
          setActive('signin');
        } else {
          router.push(res?.url || callbackUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setLoading(false);
      }
    },
    [regEmail, regPassword, router, callbackUrl]
  );

  const handleForgotRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);
      try {
        const resp = await fetch('/api/auth/password/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Request failed');
        setMessage(
          'If an account exists for that email, a reset link has been prepared.'
        );
        if (data.token) {
          setResetToken(data.token as string);
          setForgotStep(2);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setLoading(false);
      }
    },
    [forgotEmail]
  );

  const handleReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);
      try {
        const resp = await fetch('/api/auth/password/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password: newPassword }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Reset failed');
        setMessage('Password updated. Please sign in with your new password.');
        setActive('signin');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Reset failed');
      } finally {
        setLoading(false);
      }
    },
    [resetToken, newPassword]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 pt-6">
          <div className="flex space-x-2 rounded-xl bg-gray-100 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActive(t.key);
                  setError(null);
                  setMessage(null);
                }}
                className={classNames(
                  'flex-1 py-2 text-sm font-medium rounded-lg transition',
                  active === t.key
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {active === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-green-600">{message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {active === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-green-600">{message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          {active === 'forgot' && (
            <div className="space-y-4">
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {message && (
                    <p className="text-sm text-green-600">{message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {message && (
                    <p className="text-sm text-green-600">{message}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 text-center text-xs text-gray-500">
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
