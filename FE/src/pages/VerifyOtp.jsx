import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import heroInterior from '../assets/hero-interior.png';

export default function VerifyOtp() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(50);
  const inputRefs = useRef([]);
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
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
      await submitOtp(next.join(''));
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
      await submitOtp(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const submitOtp = async (otp) => {
    setLoading(true);
    try {
      const data = await verifyOtp(email, otp);
      toast.success('Welcome back!');
      navigate(data.user.role === 'Agent' ? '/dashboard' : '/', { replace: true });
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
      await resendOtp(email);
      toast.success('New code sent!');
      setCooldown(50);
    } catch {
      toast.error('Failed to resend code');
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroInterior} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-3xl font-semibold text-white tracking-tight leading-tight">
            One more step<br />to get in.
          </h2>
          <p className="mt-3 text-white/60 text-sm max-w-sm">
            Enter the verification code we sent to your email to complete sign-in.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <Link to="/" className="text-xl font-semibold tracking-tight text-primary mb-8 block">
              Estate<span className="text-accent">AI</span>
            </Link>
            <h1 className="text-3xl font-semibold text-primary tracking-tight">Enter verification code</h1>
            <p className="mt-2 text-sm text-muted">
              We sent a 6-digit code to <span className="text-secondary font-medium">{email}</span>
            </p>
          </div>

          <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
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
        </div>
      </div>
    </div>
  );
}
