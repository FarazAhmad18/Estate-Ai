import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, ShoppingBag, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import PasswordRequirements from '../components/PasswordRequirements';

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'Buyer' });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome to EstateAI.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      toast.success('Welcome to EstateAI!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-surface">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl -translate-y-1/3 -translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl translate-y-1/4 translate-x-1/4" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">
            Estate<span className="text-accent">AI</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/[0.03] border border-border/40 p-6 sm:p-8">
          <div className="text-center mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">Create account</h1>
            <p className="mt-1.5 text-sm text-muted">Join EstateAI today</p>
          </div>

          {/* Role selection */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { role: 'Buyer', icon: ShoppingBag, desc: 'Find properties' },
              { role: 'Agent', icon: Building2, desc: 'List & sell' },
            ].map(({ role, icon: Icon, desc }) => (
              <button
                key={role}
                type="button"
                onClick={() => update('role', role)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                  form.role === role
                    ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10'
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  form.role === role ? 'bg-accent text-white' : 'bg-surface text-muted'
                }`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-tight ${form.role === role ? 'text-accent' : 'text-primary'}`}>{role}</p>
                  <p className="text-[11px] text-muted leading-tight">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => toast.error('Google login failed')}
              shape="pill"
              size="large"
              width="100%"
              text="signup_with"
            />
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/70" />
            <span className="text-[11px] text-muted font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border/70" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-surface/60 rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 focus:bg-white transition-all placeholder:text-muted/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-surface/60 rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 focus:bg-white transition-all placeholder:text-muted/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  placeholder="Create a password"
                  className="w-full pl-10 pr-11 py-3 bg-surface/60 rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 focus:bg-white transition-all placeholder:text-muted/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-secondary transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2.5 space-y-2.5">
                  <PasswordStrengthIndicator password={form.password} />
                  <PasswordRequirements password={form.password} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                <input
                  type={showCpw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-11 py-3 bg-surface/60 rounded-xl text-sm border transition-all placeholder:text-muted/50 ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'border-danger focus:ring-danger/10'
                      : 'border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCpw(!showCpw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-secondary transition-colors"
                >
                  {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="mt-1.5 text-xs text-danger">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white btn-primary disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
        <p className="text-center mt-3 text-[11px] text-muted/70 leading-relaxed">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
