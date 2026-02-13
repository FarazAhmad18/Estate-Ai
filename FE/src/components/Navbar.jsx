import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessageContext';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Heart, Shield, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { unreadCount } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        isActive(to) ? 'text-primary' : 'text-muted hover:text-primary'
      }`}
    >
      {label}
    </Link>
  );

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-semibold tracking-tight text-primary">
            Estate<span className="text-accent">AI</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLink('/', 'Home')}
            {navLink('/properties', 'Properties')}
            {user && (
              <Link
                to="/messages"
                className={`text-sm font-medium transition-colors relative ${
                  isActive('/messages')
                    ? 'text-primary'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 w-2 h-2 rounded-full bg-accent" />
                )}
              </Link>
            )}
            {user?.role === 'Agent' && navLink('/dashboard', 'Dashboard')}
            {user?.role === 'Admin' && navLink('/admin', 'Admin')}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
                <div className="w-16 h-4 rounded bg-surface animate-pulse" />
              </div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-primary">{userInitial}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-primary">{user.name?.split(' ')[0]}</span>
                  <ChevronDown
                    size={14}
                    className={`text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-border/50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-semibold text-primary truncate">{user.name}</p>
                      <p className="text-xs text-muted truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-medium uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
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
                          <span className="ml-auto text-[10px] font-bold bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center">
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
                    <div className="border-t border-border/50 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-primary">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border/50 px-6 py-6 space-y-1">
          <Link to="/" className="block px-3 py-2.5 text-sm font-medium text-secondary rounded-xl hover:bg-surface">
            Home
          </Link>
          <Link to="/properties" className="block px-3 py-2.5 text-sm font-medium text-secondary rounded-xl hover:bg-surface">
            Properties
          </Link>
          {loading ? (
            <div className="flex items-center gap-3 px-3 py-3 mt-2">
              <div className="w-9 h-9 rounded-full bg-surface animate-pulse" />
              <div className="space-y-2">
                <div className="w-24 h-4 rounded bg-surface animate-pulse" />
                <div className="w-32 h-3 rounded bg-surface animate-pulse" />
              </div>
            </div>
          ) : user ? (
            <>
              {/* User info in mobile */}
              <div className="flex items-center gap-3 px-3 py-3 mt-2 mb-1 border-t border-b border-border/50">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-primary">{userInitial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
              </div>

              <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary rounded-xl hover:bg-surface">
                <User size={16} className="text-muted" /> Profile
              </Link>
              <Link
                to="/messages"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary rounded-xl hover:bg-surface"
              >
                <MessageSquare size={16} className="text-muted" /> Messages
                {unreadCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/saved" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary rounded-xl hover:bg-surface">
                <Heart size={16} className="text-muted" /> Saved
              </Link>
              {user.role === 'Agent' && (
                <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary rounded-xl hover:bg-surface">
                  <LayoutDashboard size={16} className="text-muted" /> Dashboard
                </Link>
              )}
              {user.role === 'Admin' && (
                <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary rounded-xl hover:bg-surface">
                  <Shield size={16} className="text-muted" /> Admin
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50">
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-3 border-t border-border/50 mt-2">
              <Link to="/login" className="block text-center text-sm font-medium text-secondary py-2.5 rounded-xl border border-border/50 hover:bg-surface">
                Sign in
              </Link>
              <Link to="/register" className="block text-center text-sm font-medium bg-primary text-white py-2.5 rounded-xl hover:bg-primary/90">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
