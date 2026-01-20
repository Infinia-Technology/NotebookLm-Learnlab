import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthLayout } from '../../components/layout/AuthLayout';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { useCountdown } from '../../hooks/useCountdown';
import { Check, X, ArrowLeft } from 'lucide-react';
import { validatePassword } from '../../lib/validation';
import { OtpInput } from '../../components/ui/OtpInput';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ResetPasswordPage() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const { resetPassword, forgotPassword } = useAuth();
  const { setError, setSuccess, clearMessages } = useAuthLayout();
  const { config } = useSystemConfig();
  const { isActive: isResendDisabled, formattedTime, start: startCooldown } = useCountdown(120, true);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const passwordValidation = validatePassword(newPassword);

  useEffect(() => {
    if (!email) {
      navigate('/auth/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (newPassword.length > 0) {
      setShowPasswordRules(true);
    }
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    const result = await resetPassword(email, otp, newPassword);

    if (result.success) {
      setSuccess('Password reset successfully! Please login with your new password.');
      navigate('/auth/login');
    } else {
      setError(result.error || 'Failed to reset password');
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    clearMessages();
    setIsResending(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess('New reset code sent to your email.');
      setOtp('');
      startCooldown();
    } else {
      setError(result.error || 'Failed to resend code');
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
        to="/auth/forgot-password"
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
        Reset your password
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Enter the code we sent to your email and create a new password.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter your code
          </label>
          <OtpInput
            value={otp}
            onChange={setOtp}
            autoFocus
          />
        </div>

        <div>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            autoComplete="new-password"
          />

          {showPasswordRules && (
            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Password requirements:</p>
              <div className="space-y-1">
                <PasswordCheck passed={passwordValidation.checks.minLength} label="At least 8 characters" />
                <PasswordCheck passed={passwordValidation.checks.hasUppercase} label="At least 1 uppercase letter (A-Z)" />
                <PasswordCheck passed={passwordValidation.checks.hasLowercase} label="At least 1 lowercase letter (a-z)" />
                <PasswordCheck passed={passwordValidation.checks.hasNumber} label="At least 1 number (0-9)" />
                <PasswordCheck passed={passwordValidation.checks.hasSymbol} label="At least 1 special character (!@#$%^&*)" />
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={otp.length !== 6 || !passwordValidation.isValid}
          className="w-full"
        >
          Reset password
        </Button>

        <div className="text-center space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendCode}
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

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-gray-300" />
      )}
      <span className={`text-xs ${passed ? 'text-green-600' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}
