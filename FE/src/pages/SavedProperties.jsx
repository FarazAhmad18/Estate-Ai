import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PropertyCard from '../components/PropertyCard';
import Spinner from '../components/Spinner';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';

export default function SavedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSaved = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get('/favorites', { params: { page: p, limit: 12 } });
      setProperties(res.data.properties);
      setTotalPages(res.data.totalPages);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved(page);
    if (page > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handleToggleFavorite = async (propertyId) => {
    try {
      await api.post(`/favorites/${propertyId}`);
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      toast.success('Property removed from saved');
    } catch {
      toast.error('Failed to remove property');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 mesh-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 animate-fade-in-up">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Collection</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">Saved Properties</h1>
          <p className="mt-2 text-muted text-sm sm:text-base">Properties you've saved for later.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-2xl border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <Heart size={28} className="text-red-400" />
            </div>
            <p className="text-xl font-bold text-primary">No saved properties yet</p>
            <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
              Browse properties and click the heart icon to save them for later.
            </p>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 mt-6 text-white px-6 py-3 rounded-full text-sm font-semibold btn-primary"
            >
              <Search size={14} /> Browse Properties
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isFavorited={true}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-secondary disabled:opacity-30 hover:border-accent transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pg;
                  if (totalPages <= 5) {
                    pg = i + 1;
                  } else if (page <= 3) {
                    pg = i + 1;
                  } else if (page >= totalPages - 2) {
                    pg = totalPages - 4 + i;
                  } else {
                    pg = page - 2 + i;
                  }
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                        page === pg
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-white text-secondary border border-border/50 hover:border-accent'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-secondary disabled:opacity-30 hover:border-accent transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
