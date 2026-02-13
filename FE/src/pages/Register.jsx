import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import PasswordRequirements from '../components/PasswordRequirements';
import heroExterior from '../assets/hero-exterior.png';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPw: '', role: 'Buyer' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else {
      if (form.password.length < 6) errs.password = 'At least 6 characters';
      else if (!/[A-Z]/.test(form.password)) errs.password = 'Needs an uppercase letter';
      else if (!/[0-9]/.test(form.password)) errs.password = 'Needs a number';
    }
    if (form.password && form.confirmPw && form.password !== form.confirmPw) errs.confirmPw = 'Passwords do not match';
    if (!form.confirmPw) errs.confirmPw = 'Please confirm your password';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Verification code sent to your email');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroExterior} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-3xl font-semibold text-white tracking-tight leading-tight">
            Start your journey<br />with EstateAI.
          </h2>
          <p className="mt-3 text-white/60 text-sm max-w-sm">
            Create an account to browse listings, save favorites, or list your own properties.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 overflow-y-auto px-6 py-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-6">
            <Link to="/" className="text-xl font-semibold tracking-tight text-primary mb-5 block">
              Estate<span className="text-accent">AI</span>
            </Link>
            <h1 className="text-3xl font-semibold text-primary tracking-tight">Create account</h1>
            <p className="mt-1.5 text-sm text-muted">Join EstateAI today</p>
          </div>

          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={`w-full px-4 py-2.5 bg-surface rounded-xl text-sm border transition-colors ${
                  errors.name ? 'border-red-400' : 'border-border/50 focus:border-accent'
                }`}
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={`w-full px-4 py-2.5 bg-surface rounded-xl text-sm border transition-colors ${
                  errors.email ? 'border-red-400' : 'border-border/50 focus:border-accent'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-surface rounded-xl text-sm border transition-colors pr-10 ${
                    errors.password ? 'border-red-400' : 'border-border/50 focus:border-accent'
                  }`}
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              <PasswordStrengthIndicator password={form.password} />
              <PasswordRequirements password={form.password} />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPw}
                  onChange={(e) => update('confirmPw', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-surface rounded-xl text-sm border transition-colors pr-10 ${
                    errors.confirmPw ? 'border-red-400' : 'border-border/50 focus:border-accent'
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPw && <p className="mt-1 text-xs text-red-500">{errors.confirmPw}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {['Buyer', 'Agent'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => update('role', role)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      form.role === role
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-secondary border-border/50 hover:border-accent'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
