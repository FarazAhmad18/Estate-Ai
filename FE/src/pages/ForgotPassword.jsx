import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import heroInterior from '../assets/hero-interior.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      toast.success('Verification code sent to your email');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
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
            Forgot your<br />password?
          </h2>
          <p className="mt-3 text-white/60 text-sm max-w-sm">
            No worries — we&apos;ll send you a code to reset it.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <Link to="/" className="text-xl font-semibold tracking-tight text-primary mb-8 block">
              Estate<span className="text-accent">AI</span>
            </Link>

            <h1 className="text-3xl font-semibold text-primary tracking-tight">Reset password</h1>
            <p className="mt-2 text-sm text-muted">Enter your email and we&apos;ll send you a verification code</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send verification code'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              <Link to="/login" className="text-accent font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
