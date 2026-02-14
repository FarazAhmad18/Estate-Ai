import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, ShoppingBag, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import PasswordRequirements from '../components/PasswordRequirements';

import heroImage from '../assets/hero-exterior.png';

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
    <div className="min-h-screen flex">
      {/* Left - Image side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/40" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Estate<span className="text-blue-300">AI</span>
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Start your journey to the perfect property.
            </h2>
            <p className="mt-4 text-white/50 text-sm leading-relaxed">
              Join thousands of users discovering properties across Pakistan with AI-powered insights.
            </p>
          </div>
        </div>
      </div>

      {/* Right - Form side */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-16 bg-white">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">
              Estate<span className="text-accent">AI</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>

          {/* Role selection */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { role: 'Buyer', icon: ShoppingBag, desc: 'Find properties' },
              { role: 'Agent', icon: Building2, desc: 'List & sell' },
            ].map(({ role, icon: Icon, desc }) => (
              <button
                key={role}
                type="button"
                onClick={() => update('role', role)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  form.role === role
                    ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10'
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  form.role === role ? 'bg-accent text-white' : 'bg-surface text-muted'
                }`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${form.role === role ? 'text-accent' : 'text-primary'}`}>{role}</p>
                  <p className="text-[11px] text-muted">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Google Login */}
          <div className="mt-6">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => toast.error('Google login failed')}
              shape="pill"
              size="large"
              width="100%"
              text="signup_with"
            />
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  placeholder="Create a password"
                  className="w-full pl-11 pr-12 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-3 space-y-3">
                  <PasswordStrengthIndicator password={form.password} />
                  <PasswordRequirements password={form.password} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showCpw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className={`w-full pl-11 pr-12 py-3.5 bg-surface rounded-xl text-sm border transition-all placeholder:text-muted ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'border-danger focus:ring-danger/10'
                      : 'border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCpw(!showCpw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                >
                  {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="mt-1.5 text-xs text-danger">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white btn-primary disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-muted text-center leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
