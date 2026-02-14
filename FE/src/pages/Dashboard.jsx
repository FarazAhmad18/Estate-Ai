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
  const [confirmDelete, setConfirmDelete] = useState(null);
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
    setConfirmDelete(null);
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
    <div className="min-h-screen pt-24 pb-16 mesh-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Agent Portal</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <Link
            to="/properties/create"
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-semibold btn-primary w-fit"
          >
            <Plus size={16} /> Add Property
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up stagger-1">
            {[
              { label: 'Total Properties', value: stats.total, icon: Building2, bg: 'bg-blue-600' },
              { label: 'Active Listings', value: stats.available, icon: Home, bg: 'bg-emerald-600' },
              { label: 'Sold', value: stats.sold, icon: CheckCircle2, bg: 'bg-red-500' },
              { label: 'Rented', value: stats.rented, icon: TrendingUp, bg: 'bg-indigo-600' },
              { label: 'Avg Rating', value: stats.avgRating || '—', suffix: stats.avgRating ? '/ 5' : '', icon: Star, bg: 'bg-amber-500' },
              { label: 'Reviews', value: stats.totalReviews || 0, icon: User, bg: 'bg-purple-600' },
              { label: 'Total Saves', value: stats.totalFavorites || 0, icon: Heart, bg: 'bg-rose-500' },
              { label: 'Member Since', value: formatDate(stats.joinedAt), icon: CalendarDays, bg: 'bg-orange-500', isDate: true },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-5 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 shadow-sm`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className={`font-bold text-primary ${s.isDate ? 'text-sm' : 'text-2xl'}`}>{s.value}</p>
                  {s.suffix && <p className="text-xs text-muted">{s.suffix}</p>}
                </div>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-8 w-fit border border-border/50 shadow-sm animate-fade-in-up stagger-2">
          {[
            { key: 'listings', label: 'My Listings' },
            { key: 'reviews', label: `Reviews${stats?.totalReviews ? ` (${stats.totalReviews})` : ''}` },
            { key: 'profile', label: 'Profile' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-accent text-white shadow-sm'
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
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
              {['All', 'Available', 'Sold', 'Rented'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-white text-secondary border border-border/50 hover:border-accent/30'
                  }`}
                >
                  {s}{s !== 'All' && stats ? ` (${s === 'Available' ? stats.available : s === 'Sold' ? stats.sold : stats.rented})` : ''}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-border/40 p-4 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl skeleton flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 skeleton rounded-lg" />
                      <div className="h-4 w-48 skeleton rounded-lg" />
                      <div className="h-3 w-24 skeleton rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-9 h-9 skeleton rounded-xl" />
                      <div className="w-9 h-9 skeleton rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-2xl border border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-5">
                  <Building2 size={28} className="text-muted" />
                </div>
                <p className="text-lg font-bold text-primary">
                  {statusFilter === 'All' ? 'No properties yet' : `No ${statusFilter.toLowerCase()} properties`}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {statusFilter === 'All' ? 'Create your first listing to get started.' : 'Try a different filter.'}
                </p>
                {statusFilter === 'All' && (
                  <Link
                    to="/properties/create"
                    className="inline-flex items-center gap-2 mt-6 text-white px-6 py-3 rounded-full text-sm font-semibold btn-primary"
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
                    className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 bg-white rounded-2xl border border-border/50 p-4 sm:p-5 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-200"
                  >
                    <div className="w-full sm:w-20 h-40 sm:h-20 rounded-xl bg-surface overflow-hidden flex-shrink-0">
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
                        <span className="text-[11px] font-semibold bg-surface px-2.5 py-0.5 rounded-full text-muted">
                          {p.type}
                        </span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          p.purpose === 'Sale' ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'
                        }`}>
                          {p.purpose}
                        </span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColor(p.status || 'Available')}`}>
                          {p.status || 'Available'}
                        </span>
                      </div>
                      <p className="font-bold text-primary mt-1.5">PKR {formatPrice(p.price)}</p>
                      <p className="text-xs text-muted mt-0.5">{p.location}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setStatusMenu(statusMenu === p.id ? null : p.id)}
                          className="h-9 px-3 rounded-xl bg-surface flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-accent transition-colors"
                        >
                          <Clock size={13} />
                          <span className="hidden sm:inline">Status</span>
                          <ChevronDown size={12} />
                        </button>
                        {statusMenu === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl shadow-black/10 border border-border/50 py-1.5 z-10 animate-fade-in-down">
                            {['Available', 'Sold', 'Rented'].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(p.id, s)}
                                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                                  (p.status || 'Available') === s
                                    ? 'bg-accent/5 text-accent'
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
                        className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-accent hover:bg-accent/5 transition-all"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/properties/${p.id}/edit`}
                        className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-accent hover:bg-accent/5 transition-all"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        disabled={deleting === p.id}
                        className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
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
                  <div key={review.id} className="bg-white rounded-2xl border border-border/50 p-6 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center overflow-hidden">
                          {review.Reviewer?.avatar_url ? (
                            <img src={review.Reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-white">{review.Reviewer?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">{review.Reviewer?.name || 'Anonymous'}</p>
                          <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= review.rating ? 'fill-warning text-warning' : 'text-border'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-secondary leading-relaxed">{review.content}</p>
                  </div>
                ))}
                {stats.totalReviews > 3 && (
                  <p className="text-center text-sm text-muted py-2">
                    Showing latest 3 of {stats.totalReviews} reviews.{' '}
                    <a href={`/agents/${user?.id}`} className="text-accent font-semibold hover:underline underline-offset-4">View all</a>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-2xl border border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-5">
                  <Star size={28} className="text-muted" />
                </div>
                <p className="text-lg font-bold text-primary">No reviews yet</p>
                <p className="mt-2 text-sm text-muted">Reviews from buyers will appear here.</p>
              </div>
            )}
          </>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="max-w-lg">
            {/* Avatar */}
            <div className="flex items-center gap-5 mb-8 bg-white rounded-2xl border border-border/50 p-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-surface transition-colors shadow-lg border border-border/50">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <div>
                <p className="font-bold text-primary">{user?.name}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-accent/90 px-2.5 py-0.5 rounded-full">
                  {user?.role}
                </span>
                {uploadingAvatar && <p className="text-xs text-accent mt-1">Uploading...</p>}
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-border/50 p-6">
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-white px-8 py-3 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl shadow-black/10 animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-primary">Delete Property</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-secondary">{confirmDelete.location}</span>? This will also notify any active conversations. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-3 bg-surface text-secondary rounded-xl text-sm font-semibold hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-danger text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
