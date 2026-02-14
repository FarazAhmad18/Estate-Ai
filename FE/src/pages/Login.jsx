import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      toast.success('Welcome!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-surface">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl translate-y-1/3 -translate-x-1/4" />
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
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted">Sign in to your account</p>
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => toast.error('Google login failed')}
              shape="pill"
              size="large"
              width="100%"
              text="continue_with"
            />
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border/70" />
            <span className="text-[11px] text-muted font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border/70" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Enter your password"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white btn-primary disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center mt-6 text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-semibold hover:underline underline-offset-4">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
