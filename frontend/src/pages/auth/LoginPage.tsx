import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthLayout } from '../../components/layout/AuthLayout';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const { login } = useAuth();
  const { setError, clearMessages } = useAuthLayout();
  const { config } = useSystemConfig();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setEmailError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    const result = await login(trimmedEmail, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="px-10 py-10">
      {/* Logo */}
      <div className="flex justify-center items-center gap-3 mb-6">
        <img
          src="/logo-icon.svg"
          alt={config.app.name}
          className="w-10 h-10"
          style={{ color: 'var(--btn-primary-bg)' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.nextElementSibling) {
              (target.nextElementSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
        <div className="w-10 h-10 bg-[var(--btn-primary-bg)] rounded-lg items-center justify-center hidden">
          <span className="text-white font-bold text-lg">{config.app.name.charAt(0)}</span>
        </div>
        <span className="text-lg font-bold text-text-primary">{config.app.name}</span>
      </div>

      <h1 className="text-2xl font-semibold text-text-primary text-center mb-2">
        Welcome back
      </h1>
      <p className="text-sm text-text-secondary text-center mb-8">
        to continue to {config.app.name}
      </p>
      {/* Inline error message */}
      {emailError ? (
        <p className="text-sm text-red-600 text-center mb-4">
          {emailError}
          {' '}
          <Link to="/auth/signup" className="text-[var(--btn-primary-bg)] hover:underline">
            Create an account
          </Link>
        </p>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
          Enter your credentials to continue
        </p>
      )}

      <div className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError('');
          }}
          placeholder="Email address"
          required
          autoComplete="email"
          autoFocus
          error={emailError ? ' ' : undefined}
        />

        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="current-password"
        />

        <div className="text-left">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-[var(--btn-primary-bg)] hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          Sign in
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">No account? </span>
          <Link
            to="/auth/signup"
            className="text-sm text-[var(--btn-primary-bg)] hover:underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </form>
  );
}
