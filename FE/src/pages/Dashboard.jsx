import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Building2, Eye, Pencil, Trash2, Camera,
  User, TrendingUp, CalendarDays, Home, CheckCircle2, Clock,
  ChevronDown, Star, Heart
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'listings');
  const [deleting, setDeleting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [statusMenu, setStatusMenu] = useState(null);

  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'listings') fetchProperties();
  }, [page, tab]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/agent/stats');
      setStats(res.data);
    } catch {
      // ignore
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties', { params: { page, limit: 50, sortBy: 'createdAt', order: 'DESC', status: 'All', agent_id: user?.id } });
      setProperties(res.data.properties);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (deleting) return;
    setDeleting(id);
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      fetchProperties();
      fetchStats();
    } catch {
      toast.error('Failed to delete property');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setStatusMenu(null);
    try {
      await api.put(`/properties/${id}`, { status: newStatus });
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      fetchStats();
      toast.success(`Property marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', profile);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.put('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)} Lac`;
    return price.toLocaleString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredProperties = statusFilter === 'All'
    ? properties
    : properties.filter((p) => p.status === statusFilter);

  const statusColor = (status) => {
    switch (status) {
      case 'Sold': return 'bg-red-50 text-red-600 border-red-100';
      case 'Rented': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-primary tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <Link
            to="/properties/create"
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Add Property
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Building2 size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-semibold text-primary">{stats.total}</p>
              <p className="text-xs text-muted mt-0.5">Total Properties</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <Home size={18} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-semibold text-primary">{stats.available}</p>
              <p className="text-xs text-muted mt-0.5">Active Listings</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                <CheckCircle2 size={18} className="text-red-500" />
              </div>
              <p className="text-2xl font-semibold text-primary">{stats.sold}</p>
              <p className="text-xs text-muted mt-0.5">Sold</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-blue-500" />
              </div>
              <p className="text-2xl font-semibold text-primary">{stats.rented}</p>
              <p className="text-xs text-muted mt-0.5">Rented</p>
            </div>
          </div>
        )}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <Star size={18} className="text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-semibold text-primary">{stats.avgRating || '—'}</p>
                <p className="text-xs text-muted">/ 5</p>
              </div>
              <p className="text-xs text-muted mt-0.5">Avg Rating</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                <User size={18} className="text-purple-500" />
              </div>
              <p className="text-2xl font-semibold text-primary">{stats.totalReviews || 0}</p>
              <p className="text-xs text-muted mt-0.5">Reviews</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
                <Heart size={18} className="text-rose-500" />
              </div>
              <p className="text-2xl font-semibold text-primary">{stats.totalFavorites || 0}</p>
              <p className="text-xs text-muted mt-0.5">Total Saves</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <CalendarDays size={18} className="text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-primary mt-1">{formatDate(stats.joinedAt)}</p>
              <p className="text-xs text-muted mt-0.5">Member Since</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 mb-8 w-fit">
          {[
            { key: 'listings', label: 'My Listings' },
            { key: 'reviews', label: `Reviews${stats?.totalReviews ? ` (${stats.totalReviews})` : ''}` },
            { key: 'profile', label: 'Profile' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Listings Tab */}
        {tab === 'listings' && (
          <>
            {/* Status Filter */}
            <div className="flex gap-2 mb-6">
              {['All', 'Available', 'Sold', 'Rented'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-primary text-white'
                      : 'bg-surface text-secondary border border-border/50'
                  }`}
                >
                  {s}{s !== 'All' && stats ? ` (${s === 'Available' ? stats.available : s === 'Sold' ? stats.sold : stats.rented})` : ''}
                </button>
              ))}
            </div>

            {loading ? (
              <Spinner className="py-32" />
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-32 bg-surface rounded-2xl">
                <Building2 size={40} className="mx-auto text-muted mb-4" />
                <p className="text-lg font-medium text-primary">
                  {statusFilter === 'All' ? 'No properties yet' : `No ${statusFilter.toLowerCase()} properties`}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {statusFilter === 'All' ? 'Create your first listing to get started.' : 'Try a different filter.'}
                </p>
                {statusFilter === 'All' && (
                  <Link
                    to="/properties/create"
                    className="inline-flex items-center gap-2 mt-6 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={16} /> Add Property
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProperties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-5 bg-white rounded-xl border border-border/50 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="w-20 h-20 rounded-xl bg-surface overflow-hidden flex-shrink-0">
                      {p.PropertyImages?.[0]?.image_url ? (
                        <img src={p.PropertyImages[0].image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <Building2 size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-medium bg-surface px-2 py-0.5 rounded text-muted">
                          {p.type}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          p.purpose === 'Sale' ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'
                        }`}>
                          {p.purpose}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColor(p.status || 'Available')}`}>
                          {p.status || 'Available'}
                        </span>
                      </div>
                      <p className="font-semibold text-primary mt-1">PKR {formatPrice(p.price)}</p>
                      <p className="text-xs text-muted mt-0.5">{p.location}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setStatusMenu(statusMenu === p.id ? null : p.id)}
                          className="h-9 px-3 rounded-lg bg-surface flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-accent transition-colors"
                        >
                          <Clock size={13} />
                          Status
                          <ChevronDown size={12} />
                        </button>
                        {statusMenu === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-border/50 py-1 z-10">
                            {['Available', 'Sold', 'Rented'].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(p.id, s)}
                                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                                  (p.status || 'Available') === s
                                    ? 'bg-surface text-primary'
                                    : 'text-secondary hover:bg-surface'
                                }`}
                              >
                                {s}
                                {(p.status || 'Available') === s && (
                                  <CheckCircle2 size={12} className="inline ml-2 text-accent" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/properties/${p.id}`}
                        className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-accent transition-colors"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/properties/${p.id}/edit`}
                        className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-accent transition-colors"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reviews Tab */}
        {tab === 'reviews' && (
          <>
            {stats?.recentReviews && stats.recentReviews.length > 0 ? (
              <div className="space-y-4">
                {stats.recentReviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-border/50 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center overflow-hidden">
                          {review.Reviewer?.avatar_url ? (
                            <img src={review.Reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-muted" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary">{review.Reviewer?.name || 'Anonymous'}</p>
                          <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-secondary leading-relaxed">{review.content}</p>
                  </div>
                ))}
                {stats.totalReviews > 3 && (
                  <p className="text-center text-sm text-muted">
                    Showing latest 3 of {stats.totalReviews} reviews.{' '}
                    <a href={`/agents/${user?.id}`} className="text-accent hover:underline">View all</a>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-32 bg-surface rounded-2xl">
                <Star size={40} className="mx-auto text-muted mb-4" />
                <p className="text-lg font-medium text-primary">No reviews yet</p>
                <p className="mt-2 text-sm text-muted">Reviews from buyers will appear here.</p>
              </div>
            )}
          </>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="max-w-lg">
            {/* Avatar */}
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-muted" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <div>
                <p className="font-medium text-primary">{user?.name}</p>
                <p className="text-xs text-muted">{user?.role}</p>
                {uploadingAvatar && <p className="text-xs text-accent mt-1">Uploading...</p>}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors"
                  placeholder="+92 300 1234567"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
