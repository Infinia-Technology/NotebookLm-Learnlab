import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthLayout } from '../../components/layout/AuthLayout';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { useCountdown } from '../../hooks/useCountdown';
import { ArrowLeft } from 'lucide-react';
import { OtpInput } from '../../components/ui/OtpInput';
import { Button } from '../../components/ui/Button';
import axios from 'axios';

export function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { verifyOtp } = useAuth();
  const { setError, setSuccess, clearMessages } = useAuthLayout();
  const { config } = useSystemConfig();
  const { isActive: isResendDisabled, formattedTime, start: startCooldown } = useCountdown(120, true);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/auth/signup');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    const result = await verifyOtp(email, otp);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'OTP verification failed');
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    clearMessages();
    setIsResending(true);

    try {
      await axios.post('/api/auth/resend-otp', { email });
      setSuccess('Code sent to your email.');
      startCooldown();
      setOtp('');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message = axiosError?.response?.data?.detail || 'Failed to resend code';
      setError(message);
    }

    setIsResending(false);
  };

  if (!email) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="px-10 py-10 relative">
      {/* Back button */}
      <Link
        to="/auth/signup"
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

      {/* Email badge */}
      <div className="flex justify-center mb-6">
        <span className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700">
          {email}
        </span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
        Verify your email
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Enter the code we sent to <strong className="text-gray-700">{email}</strong>.
      </p>

      <div className="space-y-6">
        <OtpInput
          value={otp}
          onChange={setOtp}
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={otp.length !== 6}
          className="w-full"
        >
          Verify & continue
        </Button>

        <div className="text-center space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendOtp}
            disabled={isResending || isResendDisabled}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isResending ? 'Sending...' : isResendDisabled ? `Resend code (${formattedTime})` : 'Resend code'}
          </Button>
          <div>
            <Link
              to="/auth/login"
              className="text-sm text-[var(--btn-primary-bg)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
