import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthLayout } from '../../components/layout/AuthLayout';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const { forgotPassword } = useAuth();
  const { setError, setSuccess, clearMessages } = useAuthLayout();
  const { config } = useSystemConfig();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setEmailError('');
    setIsLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess('Reset code sent to your email.');
      navigate('/auth/reset-password', { state: { email } });
    } else if (result.error?.includes("domain is not allowed")) {
      // Domain blocked - show inline error
      setEmailError(result.error);
    } else {
      setError(result.error || 'Failed to send reset code');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="px-10 py-10 relative">
      {/* Back button */}
      <Link
        to="/auth/login"
        className="absolute left-10 top-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Logo */}
      <div className="flex justify-center items-center gap-3 mb-6">
        <img
          src="/logo-icon.svg"
          alt={config.app.name}
          className="w-10 h-10"
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
        <span className="text-lg font-bold text-gray-800">{config.app.name}</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
        Reset your password
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Enter your email to receive a reset code
      </p>

      <div className="space-y-6">
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
          error={emailError || undefined}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          Send reset code
        </Button>

        <div className="text-center">
          <Link
            to="/auth/login"
            className="text-sm text-[var(--btn-primary-bg)] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </form>
  );
}
