import { useState, useEffect } from 'react';
import {
  Users, Building2, MessageSquare, Eye, Trash2, Search,
  TrendingUp, TrendingDown, UserPlus, UserMinus, ChevronLeft, ChevronRight, Star,
  CheckCircle, XCircle, BadgeDollarSign, KeyRound, Shield, LayoutDashboard,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import ConfirmModal from '../components/ConfirmModal';
import UserProfilePanel from '../components/UserProfilePanel';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'testimonials', label: 'Testimonials', icon: Star },
  { key: 'visitors', label: 'Visitors', icon: Eye },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  return (
    <div className="min-h-screen pt-24 pb-16 mesh-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Admin Panel</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
            </div>
          </div>
          <p className="text-sm text-muted">Manage users, properties, and platform settings.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-8 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-accent text-white shadow-sm shadow-accent/20'
                    : 'bg-white text-muted border border-border/50 hover:text-secondary hover:border-border'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="animate-fade-in-up">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'users' && <UsersTab currentUserId={user?.id} />}
          {tab === 'properties' && <PropertiesTab />}
          {tab === 'testimonials' && <TestimonialsTab />}
          {tab === 'visitors' && <VisitorsTab />}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function fillDates(data = [], days = 30) {
  const map = {};
  data.forEach((d) => { map[d.date] = parseInt(d.count); });
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    result.push({ date: key, count: map[key] || 0 });
  }
  return result;
}

function TrendBadge({ current, previous }) {
  if (!previous || previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{pct}%
    </span>
  );
}

function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 bg-white rounded-xl text-sm border border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3.5 py-2.5 rounded-xl shadow-lg border border-border/40">
      <p className="text-[11px] text-muted mb-0.5">
        {new Date(label + 'T00:00:00').toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
      <p className="text-sm font-bold text-primary">{payload[0].value}</p>
    </div>
  );
};

/* ─── Overview Tab ─── */
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/trends'),
    ])
      .then(([statsRes, trendsRes]) => {
        setStats(statsRes.data);
        setTrends(trendsRes.data);
      })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="py-32" />;
  if (!stats) return null;

  const charts = trends ? [
    {
      title: 'Users',
      subtitle: 'New registrations',
      data: fillDates(trends.usersPerDay),
      color: '#2563eb',
      gradientFrom: 'rgba(37,99,235,0.15)',
      total: stats.newUsersThisWeek,
      label: 'this week',
      current: stats.newUsersThisWeek,
      previous: stats.prevWeekNewUsers,
      icon: UserPlus,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Properties',
      subtitle: 'New listings',
      data: fillDates(trends.propertiesPerDay),
      color: '#10b981',
      gradientFrom: 'rgba(16,185,129,0.15)',
      total: stats.totalProperties,
      label: 'total',
      icon: Building2,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Visitors',
      subtitle: 'Site traffic',
      data: fillDates(trends.visitorsPerDay),
      color: '#f59e0b',
      gradientFrom: 'rgba(245,158,11,0.15)',
      total: stats.visitorsThisWeek,
      label: 'this week',
      current: stats.visitorsThisWeek,
      previous: stats.prevWeekVisitors,
      icon: Eye,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Deleted Accounts',
      subtitle: 'Account deletions',
      data: fillDates(trends.deletedAccountsPerDay),
      color: '#ef4444',
      gradientFrom: 'rgba(239,68,68,0.15)',
      total: stats.deletedAccountsThisWeek || 0,
      label: 'this week',
      current: stats.deletedAccountsThisWeek || 0,
      previous: stats.prevWeekDeletedAccounts,
      icon: UserMinus,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
  ] : [];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Total Properties', value: stats.totalProperties, icon: Building2, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Sold Properties', value: stats.soldProperties || 0, icon: BadgeDollarSign, gradient: 'from-orange-500 to-amber-600' },
    { label: 'Rented Properties', value: stats.rentedProperties || 0, icon: KeyRound, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Testimonials', value: stats.totalTestimonials, icon: MessageSquare, gradient: 'from-cyan-500 to-blue-600' },
    { label: 'Visitors Today', value: stats.visitorsToday, icon: Eye, gradient: 'from-amber-500 to-yellow-600' },
    { label: 'Deleted Accounts', value: stats.totalDeletedAccounts || 0, icon: UserMinus, gradient: 'from-red-500 to-rose-600' },
  ];

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((c, i) => (
          <div key={c.label} className={`bg-white rounded-2xl border border-border/40 p-5 hover:shadow-md transition-all animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-3 shadow-sm`}>
              <c.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-primary">{c.value?.toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5 font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {charts.map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.title} className="bg-white rounded-2xl border border-border/40 p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${ch.iconBg} flex items-center justify-center`}>
                      <Icon size={16} className={ch.iconColor} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{ch.title}</p>
                      <p className="text-[11px] text-muted">{ch.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{ch.total.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[11px] text-muted">{ch.label}</span>
                      {ch.previous !== undefined && (
                        <TrendBadge current={ch.current} previous={ch.previous} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="-mx-2">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={ch.data}>
                      <defs>
                        <linearGradient id={`grad-${ch.title}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ch.gradientFrom} stopOpacity={1} />
                          <stop offset="100%" stopColor={ch.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(d) => {
                          const date = new Date(d + 'T00:00:00');
                          return date.getDate() % 7 === 0 ? date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : '';
                        }}
                        interval={0}
                      />
                      <YAxis hide allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: ch.color, strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={ch.color}
                        strokeWidth={2.5}
                        fill={`url(#grad-${ch.title})`}
                        dot={false}
                        activeDot={{ r: 5, fill: ch.color, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ─── Users Tab ─── */
function UsersTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [changingRole, setChangingRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchUsers = (q = '', role = '', deleted = false) => {
    setLoading(true);
    api.get('/admin/users', { params: { search: q, role: role || undefined, includeDeleted: deleted || undefined } })
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(search, roleFilter, showDeleted);
  };

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    fetchUsers(search, role, showDeleted);
  };

  const handleToggleDeleted = () => {
    const next = !showDeleted;
    setShowDeleted(next);
    fetchUsers(search, roleFilter, next);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete);
    try {
      await api.delete(`/admin/users/${confirmDelete}`);
      toast.success('User deleted');
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setChangingRole(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role changed to ${newRole}`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: res.data.role } : u));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change role');
    } finally {
      setChangingRole(null);
    }
  };

  const roleBadge = (role) => {
    const styles = {
      Admin: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
      Agent: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      Buyer: 'bg-surface text-muted border border-border/50',
    };
    return (
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${styles[role] || styles.Buyer}`}>
        {role}
      </span>
    );
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
          />
        </div>
        <SelectFilter value={roleFilter} onChange={handleRoleFilterChange} options={['Admin', 'Agent', 'Buyer']} placeholder="All Roles" />
        <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white btn-primary">
          Search
        </button>
        <button
          type="button"
          onClick={handleToggleDeleted}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            showDeleted ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : 'bg-white text-muted border border-border/50 hover:text-secondary hover:border-border'
          }`}
        >
          {showDeleted ? 'Showing Deleted' : 'Show Deleted'}
        </button>
      </form>

      {loading ? (
        <Spinner className="py-32" />
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border/40">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-muted" />
          </div>
          <p className="text-muted text-sm font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isDeleted = !!u.deletedAt;
            return (
              <div key={u.id} onClick={() => setSelectedUser(u)} className={`flex items-center gap-4 rounded-2xl border p-4 transition-all cursor-pointer ${
                isDeleted ? 'bg-red-50/50 border-red-200/50 opacity-70' : 'bg-white border-border/40 hover:shadow-md hover:border-border/60'
              }`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ${isDeleted ? 'ring-red-200 bg-red-100/50' : 'ring-border/30 bg-gradient-to-br from-accent/10 to-purple-500/10'}`}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className={`w-full h-full object-cover ${isDeleted ? 'grayscale' : ''}`} />
                  ) : (
                    <span className={`text-sm font-bold ${isDeleted ? 'text-red-400' : 'text-accent'}`}>{u.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold truncate ${isDeleted ? 'text-red-400 line-through' : 'text-primary'}`}>{u.name}</p>
                    {roleBadge(u.role)}
                    {isDeleted && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-500">
                        Deleted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">{u.email}</p>
                </div>
                <p className="text-xs text-muted hidden sm:block font-medium">
                  {isDeleted ? `Deleted ${formatDate(u.deletedAt)}` : formatDate(u.createdAt)}
                </p>
                {!isDeleted && u.role !== 'Admin' && u.id !== currentUserId && (
                  <select
                    value={u.role}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={changingRole === u.id}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-border/50 bg-white focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:opacity-50 transition-all"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Agent">Agent</option>
                    <option value="Admin">Admin</option>
                  </select>
                )}
                {!isDeleted && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(u.id); }}
                    disabled={u.id === currentUserId || u.role === 'Admin'}
                    className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title={u.id === currentUserId ? 'Cannot delete yourself' : u.role === 'Admin' ? 'Cannot delete admins' : 'Delete user'}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        loading={!!deleting}
      />

      {selectedUser && (
        <UserProfilePanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onPropertyDeleted={() => {}}
        />
      )}
    </>
  );
}

/* ─── Properties Tab ─── */
function PropertiesTab() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchProperties = (q = '', p = 1, type = '', status = '') => {
    setLoading(true);
    api.get('/admin/properties', { params: { search: q, page: p, limit: 20, type: type || undefined, status: status || undefined } })
      .then((res) => {
        setProperties(res.data.properties);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      })
      .catch(() => toast.error('Failed to load properties'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties(search, 1, typeFilter, statusFilter);
  };

  const handleTypeChange = (type) => {
    setTypeFilter(type);
    fetchProperties(search, 1, type, statusFilter);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    fetchProperties(search, 1, typeFilter, status);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete);
    try {
      await api.delete(`/admin/properties/${confirmDelete}`);
      toast.success('Property deleted');
      setProperties((prev) => prev.filter((p) => p.id !== confirmDelete));
    } catch {
      toast.error('Failed to delete property');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const formatPrice = (price) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)} Lac`;
    return price?.toLocaleString();
  };

  const statusStyle = (status) => {
    switch (status) {
      case 'Sold': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'Rented': return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      default: return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
          />
        </div>
        <SelectFilter value={typeFilter} onChange={handleTypeChange} options={['House', 'Apartment', 'Villa', 'Commercial', 'Land']} placeholder="All Types" />
        <SelectFilter value={statusFilter} onChange={handleStatusChange} options={['Available', 'Sold', 'Rented']} placeholder="All Statuses" />
        <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white btn-primary">
          Search
        </button>
      </form>

      {loading ? (
        <Spinner className="py-32" />
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border/40">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-muted" />
          </div>
          <p className="text-muted text-sm font-medium">No properties found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {properties.map((p) => (
              <div key={p.id} className="flex items-center gap-4 bg-white rounded-2xl border border-border/40 p-4 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-xl bg-surface overflow-hidden flex-shrink-0">
                  {p.PropertyImages?.[0]?.image_url ? (
                    <img src={p.PropertyImages[0].image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted"><Building2 size={18} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold bg-surface px-2.5 py-0.5 rounded-full text-muted">{p.type}</span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${statusStyle(p.status)}`}>{p.status}</span>
                  </div>
                  <p className="font-bold text-primary mt-1 text-sm">PKR {formatPrice(p.price)}</p>
                  <p className="text-xs text-muted truncate">{p.location}</p>
                </div>
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-secondary">{p.User?.name || '—'}</p>
                  <p className="text-[10px] text-muted">{p.User?.email}</p>
                </div>
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  disabled={deleting === p.id}
                  className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={(p) => fetchProperties(search, p, typeFilter, statusFilter)} />
          )}
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Property"
        message="Are you sure you want to delete this property? This action cannot be undone."
        confirmText="Delete"
        loading={!!deleting}
      />
    </>
  );
}

/* ─── Testimonials Tab ─── */
function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    api.get('/admin/testimonials')
      .then((res) => setTestimonials(res.data))
      .catch(() => toast.error('Failed to load testimonials'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete);
    try {
      await api.delete(`/admin/testimonials/${confirmDelete}`);
      toast.success('Testimonial deleted');
      setTestimonials((prev) => prev.filter((t) => t.id !== confirmDelete));
    } catch {
      toast.error('Failed to delete testimonial');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/testimonials/${id}/approve`);
      toast.success('Testimonial approved');
      setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, approved: true } : t));
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(err.response?.data?.error || 'Failed to approve testimonial');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/testimonials/${id}/reject`);
      toast.success('Testimonial rejected');
      setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, approved: false } : t));
    } catch (err) {
      console.error('Reject error:', err);
      toast.error(err.response?.data?.error || 'Failed to reject testimonial');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const filtered = testimonials.filter((t) => {
    if (filter === 'approved') return t.approved === true;
    if (filter === 'pending') return t.approved === false;
    return true;
  });

  const approvedCount = testimonials.filter((t) => t.approved === true).length;
  const pendingCount = testimonials.filter((t) => t.approved === false).length;

  if (loading) return <Spinner className="py-32" />;

  return (
    <>
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {[
          { key: 'all', label: 'All', count: testimonials.length },
          { key: 'pending', label: 'Pending', count: pendingCount },
          { key: 'approved', label: 'Approved', count: approvedCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              filter === f.key
                ? 'bg-accent text-white shadow-sm shadow-accent/20'
                : 'bg-white text-muted border border-border/50 hover:text-secondary hover:border-border'
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              filter === f.key ? 'bg-white/20' : 'bg-surface'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border/40">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-muted" />
          </div>
          <p className="text-muted text-sm font-medium">No testimonials found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-border/40 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full ring-2 ring-border/30 bg-gradient-to-br from-accent/10 to-purple-500/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {t.User?.avatar_url ? (
                      <img src={t.User.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-accent">{t.User?.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{t.User?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted">{t.User?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap justify-end">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    t.approved
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  }`}>
                    {t.approved ? 'Approved' : 'Pending'}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted font-medium">{formatDate(t.createdAt)}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-secondary leading-relaxed">{t.content}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                {!t.approved && (
                  <button
                    onClick={() => handleApprove(t.id)}
                    disabled={actionLoading === t.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                )}
                {t.approved && (
                  <button
                    onClick={() => handleReject(t.id)}
                    disabled={actionLoading === t.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all disabled:opacity-50"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(t.id)}
                  disabled={deleting === t.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 ml-auto"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This action cannot be undone."
        confirmText="Delete"
        loading={!!deleting}
      />
    </>
  );
}

/* ─── Visitors Tab ─── */
function VisitorsTab() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVisitors = (p = 1) => {
    setLoading(true);
    api.get('/admin/visitors', { params: { page: p, limit: 50 } })
      .then((res) => {
        setVisitors(res.data.visitors);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      })
      .catch(() => toast.error('Failed to load visitors'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVisitors(); }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const truncate = (str, len = 40) => str && str.length > len ? str.slice(0, len) + '...' : str || '—';

  const methodStyle = (method) => {
    switch (method) {
      case 'GET': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      case 'POST': return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'DELETE': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      default: return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    }
  };

  if (loading) return <Spinner className="py-32" />;

  return (
    <>
      <div className="bg-white rounded-2xl border border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-surface/50">
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-muted uppercase tracking-wider">IP</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-muted uppercase tracking-wider">Path</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-muted uppercase tracking-wider">Method</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Referrer</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">User Agent</th>
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold text-muted uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-muted text-sm">No visitors recorded</td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id} className="border-b border-border/30 hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 text-secondary font-mono text-xs">{v.ip}</td>
                    <td className="py-3 px-4 text-secondary text-xs max-w-[200px] truncate">{v.path}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${methodStyle(v.method)}`}>
                        {v.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted hidden md:table-cell max-w-[150px] truncate">{v.referrer || '—'}</td>
                    <td className="py-3 px-4 text-xs text-muted hidden lg:table-cell max-w-[200px] truncate">{truncate(v.user_agent, 50)}</td>
                    <td className="py-3 px-4 text-xs text-muted whitespace-nowrap font-medium">{formatDate(v.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={fetchVisitors} />
      )}
    </>
  );
}

/* ─── Pagination ─── */
function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-muted hover:text-primary hover:border-border transition-all disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-secondary font-medium px-3">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-muted hover:text-primary hover:border-border transition-all disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
