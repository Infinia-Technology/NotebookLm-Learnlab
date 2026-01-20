import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthLayout } from '../../components/layout/AuthLayout';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { Check, X } from 'lucide-react';
import { validatePassword } from '../../lib/validation';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [emailError, setEmailError] = useState('');

  const { signup } = useAuth();
  const { setError, setSuccess, clearMessages } = useAuthLayout();
  const { config } = useSystemConfig();
  const navigate = useNavigate();

  const passwordValidation = validatePassword(password);

  useEffect(() => {
    if (password.length > 0) {
      setShowPasswordRules(true);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setEmailError('');

    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    const result = await signup(email, password, firstName, lastName);

    if (result.success) {
      setSuccess('Account created! Please check your email for verification code.');
      navigate('/auth/verify', { state: { email } });
    } else if (result.error?.includes("domain is not allowed") || result.error?.includes("already registered")) {
      // Domain blocked or email exists - show inline error near email field
      setEmailError(result.error);
    } else {
      setError(result.error || 'Signup failed');
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
        Create account
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        to get started
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>

        <div>
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
            error={emailError || undefined}
          />
          {emailError && emailError.includes("already registered") && (
            <p className="mt-1 text-sm text-gray-600">
              <Link to="/auth/forgot-password" className="text-[var(--btn-primary-bg)] hover:underline">
                Forgot your password?
              </Link>
            </p>
          )}
        </div>

        <div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
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
          disabled={!passwordValidation.isValid}
          className="w-full"
        >
          Create account
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-500">Already have an account? </span>
          <Link
            to="/auth/login"
            className="text-sm text-[var(--btn-primary-bg)] hover:underline"
          >
            Sign in
          </Link>
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
