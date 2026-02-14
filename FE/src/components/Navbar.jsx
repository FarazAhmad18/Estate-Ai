import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessageContext';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Heart, Shield, MessageSquare, Home, Building2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { unreadCount } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    logout();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`relative text-sm font-medium transition-colors py-1 ${
        isActive(to) ? 'text-accent' : 'text-secondary/70 hover:text-secondary'
      }`}
    >
      {label}
      {isActive(to) && (
        <span className="absolute -bottom-[1.15rem] left-0 right-0 h-0.5 bg-accent rounded-full" />
      )}
    </Link>
  );

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-border/60 shadow-sm shadow-black/[0.03]'
          : 'bg-white/60 backdrop-blur-md border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shadow-sm">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-primary">
                Estate<span className="text-accent">AI</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7">
              {navLink('/', 'Home')}
              {navLink('/properties', 'Properties')}
              {user && (
                <Link
                  to="/messages"
                  className={`relative text-sm font-medium transition-colors py-1 ${
                    isActive('/messages')
                      ? 'text-accent'
                      : 'text-secondary/70 hover:text-secondary'
                  }`}
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-3.5 w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
                  )}
                  {isActive('/messages') && (
                    <span className="absolute -bottom-[1.15rem] left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </Link>
              )}
              {user?.role === 'Agent' && navLink('/dashboard', 'Dashboard')}
              {user?.role === 'Admin' && navLink('/admin', 'Admin')}
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <div className="w-8 h-8 rounded-full skeleton" />
                  <div className="w-16 h-4 skeleton" />
                </div>
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 ${
                      dropdownOpen ? 'bg-surface-2' : 'hover:bg-surface'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{userInitial}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-secondary">{user.name?.split(' ')[0]}</span>
                    <ChevronDown
                      size={14}
                      className={`text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-black/8 border border-border/60 py-2 animate-fade-in-down">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-sm font-semibold text-primary truncate">{user.name}</p>
                        <p className="text-xs text-muted truncate mt-0.5">{user.email}</p>
                        <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider text-white bg-accent/90 px-2.5 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-surface transition-colors"
                        >
                          <User size={15} className="text-muted" />
                          Profile
                        </Link>
                        <Link
                          to="/messages"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-surface transition-colors"
                        >
                          <MessageSquare size={15} className="text-muted" />
                          Messages
                          {unreadCount > 0 && (
                            <span className="ml-auto text-[10px] font-bold bg-accent text-white min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/saved"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-surface transition-colors"
                        >
                          <Heart size={15} className="text-muted" />
                          Saved
                        </Link>
                        {user.role === 'Agent' && (
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-surface transition-colors"
                          >
                            <LayoutDashboard size={15} className="text-muted" />
                            Dashboard
                          </Link>
                        )}
                        {user.role === 'Admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-surface transition-colors"
                          >
                            <Shield size={15} className="text-muted" />
                            Admin
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-border/50 pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-secondary/70 hover:text-secondary transition-colors px-4 py-2"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium text-white px-5 py-2.5 rounded-full btn-primary"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile right side */}
            <div className="flex items-center gap-1 md:hidden">
              {user && (
                <Link
                  to="/messages"
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center text-secondary/70 hover:bg-surface transition-colors"
                >
                  <MessageSquare size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface transition-colors"
              >
              <div className="relative w-5 h-5">
                <span className={`absolute left-0 block w-5 h-0.5 bg-current transition-all duration-300 ${
                  mobileOpen ? 'top-[9px] rotate-45' : 'top-1'
                }`} />
                <span className={`absolute left-0 top-[9px] block w-5 h-0.5 bg-current transition-all duration-300 ${
                  mobileOpen ? 'opacity-0 scale-0' : 'opacity-100'
                }`} />
                <span className={`absolute left-0 block w-5 h-0.5 bg-current transition-all duration-300 ${
                  mobileOpen ? 'top-[9px] -rotate-45' : 'top-[17px]'
                }`} />
              </div>
            </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div className={`fixed top-16 left-0 right-0 z-40 md:hidden transition-all duration-300 ease-out ${
        mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-white border-b border-border/50 shadow-xl shadow-black/5 px-4 py-4 max-h-[calc(100dvh-4rem)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="space-y-2">
                <div className="w-24 h-4 skeleton" />
                <div className="w-32 h-3 skeleton" />
              </div>
            </div>
          ) : user ? (
            <>
              {/* User profile card - at top */}
              <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-surface rounded-2xl">
                <div className="w-11 h-11 rounded-full gradient-accent flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{userInitial}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary truncate">{user.name}</p>
                  <p className="text-[11px] text-muted truncate">{user.email}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-accent/90 px-2.5 py-0.5 rounded-full flex-shrink-0">
                  {user.role}
                </span>
              </div>

              {/* Navigation links */}
              <div className="space-y-0.5">
                <Link to="/" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                  <Home size={16} className={isActive('/') ? 'text-accent' : 'text-muted'} /> Home
                </Link>
                <Link to="/properties" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/properties') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                  <Building2 size={16} className={isActive('/properties') ? 'text-accent' : 'text-muted'} /> Properties
                </Link>
                <Link to="/messages" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/messages') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                  <MessageSquare size={16} className={isActive('/messages') ? 'text-accent' : 'text-muted'} /> Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-accent text-white min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/saved" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/saved') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                  <Heart size={16} className={isActive('/saved') ? 'text-accent' : 'text-muted'} /> Saved
                </Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/profile') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                  <User size={16} className={isActive('/profile') ? 'text-accent' : 'text-muted'} /> Profile
                </Link>
                {user.role === 'Agent' && (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/dashboard') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                    <LayoutDashboard size={16} className={isActive('/dashboard') ? 'text-accent' : 'text-muted'} /> Dashboard
                  </Link>
                )}
                {user.role === 'Admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/admin') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                    <Shield size={16} className={isActive('/admin') ? 'text-accent' : 'text-muted'} /> Admin
                  </Link>
                )}
              </div>

              {/* Sign out */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-danger rounded-xl hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Nav links for logged out */}
              <div className="space-y-0.5 mb-4">
                <Link to="/" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                  <Home size={16} className={isActive('/') ? 'text-accent' : 'text-muted'} /> Home
                </Link>
                <Link to="/properties" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${isActive('/properties') ? 'bg-accent/5 text-accent' : 'text-secondary hover:bg-surface'}`}>
                  <Building2 size={16} className={isActive('/properties') ? 'text-accent' : 'text-muted'} /> Properties
                </Link>
              </div>
              <div className="flex flex-col gap-2.5 pt-3 border-t border-border/50">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center text-sm font-medium text-secondary py-3 rounded-xl border border-border/50 hover:bg-surface transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center text-sm font-medium text-white py-3 rounded-xl btn-primary"
                >
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
