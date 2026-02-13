import { useState, useEffect } from 'react';
import { X, Building2, Trash2, Phone, Mail, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

export default function UserProfilePanel({ user, onClose, onPropertyDeleted }) {
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'Agent') {
      setProperties([]);
      return;
    }
    setLoadingProps(true);
    api.get(`/agents/${user.id}/properties`, { params: { status: 'All', limit: 100 } })
      .then((res) => setProperties(res.data.properties))
      .catch(() => toast.error('Failed to load agent properties'))
      .finally(() => setLoadingProps(false));
  }, [user]);

  const handleDeleteProperty = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete);
    try {
      await api.delete(`/admin/properties/${confirmDelete}`);
      toast.success('Property deleted');
      setProperties((prev) => prev.filter((p) => p.id !== confirmDelete));
      onPropertyDeleted?.();
    } catch {
      toast.error('Failed to delete property');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '--';

  const formatPrice = (price) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)} Lac`;
    return price?.toLocaleString();
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Sold': return 'bg-red-50 text-red-600';
      case 'Rented': return 'bg-blue-50 text-blue-600';
      default: return 'bg-emerald-50 text-emerald-600';
    }
  };

  const roleBadge = (role) => {
    const styles = {
      Admin: 'bg-red-50 text-red-600',
      Agent: 'bg-accent/10 text-accent',
      Buyer: 'bg-surface text-muted',
    };
    return styles[role] || styles.Buyer;
  };

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary">{user.name?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">{user.name}</h2>
              <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${roleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-secondary transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Contact info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-muted flex-shrink-0" />
              <span className="text-secondary">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={15} className="text-muted flex-shrink-0" />
                <span className="text-secondary">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-muted flex-shrink-0" />
              <span className="text-secondary">Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {/* Agent properties */}
          {user.role === 'Agent' && (
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">
                Properties
                {!loadingProps && <span className="ml-1.5 text-xs font-normal text-muted">({properties.length})</span>}
              </h3>

              {loadingProps ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : properties.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">No properties listed</p>
              ) : (
                <div className="space-y-3">
                  {properties.map((p) => (
                    <div key={p.id} onClick={() => navigate(`/properties/${p.id}`)} className="flex items-center gap-3 bg-surface/50 rounded-xl border border-border/50 p-3 cursor-pointer hover:border-accent/30 transition-colors">
                      <div className="w-14 h-14 rounded-lg bg-surface overflow-hidden flex-shrink-0">
                        {p.PropertyImages?.[0]?.image_url ? (
                          <img src={p.PropertyImages[0].image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted">
                            <Building2 size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded text-muted">{p.type}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor(p.status)}`}>{p.status}</span>
                        </div>
                        <p className="text-sm font-semibold text-primary mt-0.5">PKR {formatPrice(p.price)}</p>
                        <p className="text-xs text-muted truncate flex items-center gap-1">
                          <MapPin size={10} className="flex-shrink-0" />
                          {p.location}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id); }}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-muted hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteProperty}
        title="Delete Property"
        message="Are you sure you want to delete this property? This action cannot be undone."
        confirmText="Delete"
        loading={!!deleting}
      />
    </>
  );
}
