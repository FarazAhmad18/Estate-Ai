import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import heroInterior from '../assets/hero-interior.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const data = await login(email, password);
      toast.success('Verification code sent!');
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroInterior} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-3xl font-semibold text-white tracking-tight leading-tight">
            Welcome back to<br />EstateAI.
          </h2>
          <p className="mt-3 text-white/60 text-sm max-w-sm">
            Sign in to access your dashboard, manage listings, and discover new properties.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <Link to="/" className="text-xl font-semibold tracking-tight text-primary mb-8 block">
              Estate<span className="text-accent">AI</span>
            </Link>
            <h1 className="text-3xl font-semibold text-primary tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">Sign in to your account</p>
          </div>

          {errors.form && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-surface rounded-xl text-sm border transition-colors ${
                  errors.email ? 'border-red-400' : 'border-border/50 focus:border-accent'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-surface rounded-xl text-sm border transition-colors pr-10 ${
                    errors.password ? 'border-red-400' : 'border-border/50 focus:border-accent'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-accent font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-accent font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
