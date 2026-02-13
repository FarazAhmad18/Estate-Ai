import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import PasswordRequirements from '../components/PasswordRequirements';
import heroInterior from '../assets/hero-interior.png';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  // Step: 'otp' | 'password' | 'success'
  const [step, setStep] = useState('otp');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(50);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
      return;
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = async (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (value && next.every((d) => d !== '')) {
      await verifyOtp(next.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setDigits(next);
    if (pasted.length === 6) {
      await verifyOtp(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const verifyOtp = async (otp) => {
    setLoading(true);
    try {
      const res = await api.post('/verify-reset-otp', { email, otp });
      setResetToken(res.data.resetToken);
      toast.success('Code verified!');
      setStep('password');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid verification code');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await api.post('/forgot-password', { email });
      toast.success('New code sent!');
      setCooldown(50);
    } catch {
      toast.error('Failed to resend code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPw) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reset-password', { email, resetToken, password });
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroInterior} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-3xl font-semibold text-white tracking-tight leading-tight">
            Choose a new<br />password.
          </h2>
          <p className="mt-3 text-white/60 text-sm max-w-sm">
            Enter the code we sent and set a new password.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 overflow-y-auto py-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-xl font-semibold tracking-tight text-primary mb-8 block">
            Estate<span className="text-accent">AI</span>
          </Link>

          {step === 'success' && (
            <>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <h1 className="text-3xl font-semibold text-primary tracking-tight">Password reset</h1>
              <p className="mt-2 text-sm text-muted">Your password has been reset successfully.</p>
              <Link
                to="/login"
                className="mt-8 inline-block w-full text-center bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="text-3xl font-semibold text-primary tracking-tight">Enter verification code</h1>
              <p className="mt-2 text-sm text-muted">
                We sent a 6-digit code to <span className="text-secondary font-medium">{email}</span>
              </p>

              <div className="flex gap-3 justify-center mt-8 mb-6" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={loading}
                    className="w-12 h-14 text-center text-xl font-semibold bg-surface rounded-xl border border-border/50 focus:border-accent transition-colors disabled:opacity-50"
                  />
                ))}
              </div>

              <p className="text-center text-sm text-muted">
                Didn&apos;t receive a code?{' '}
                {cooldown > 0 ? (
                  <span className="text-secondary">Resend in {cooldown}s</span>
                ) : (
                  <button onClick={handleResend} className="text-accent font-medium hover:underline">
                    Resend code
                  </button>
                )}
              </p>

              <p className="mt-6 text-center text-sm text-muted">
                <Link to="/login" className="text-accent font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}

          {step === 'password' && (
            <>
              <h1 className="text-3xl font-semibold text-primary tracking-tight">Set new password</h1>
              <p className="mt-2 text-sm text-muted">Enter your new password below</p>

              <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-2">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                  <PasswordRequirements password={password} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-2">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPw && password !== confirmPw && (
                    <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPw || password !== confirmPw}
                  className="w-full bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted">
                <Link to="/login" className="text-accent font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
