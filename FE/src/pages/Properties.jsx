import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import LocationAutocomplete from '../components/LocationAutocomplete';
import Spinner from '../components/Spinner';

const TYPES = ['All', 'House', 'Apartment', 'Villa', 'Commercial', 'Land'];
const PURPOSES = ['All', 'Sale', 'Rent'];
const SORT_OPTIONS = [
  { value: 'createdAt-DESC', label: 'Newest First' },
  { value: 'createdAt-ASC', label: 'Oldest First' },
  { value: 'price-ASC', label: 'Price: Low to High' },
  { value: 'price-DESC', label: 'Price: High to Low' },
  { value: 'area-DESC', label: 'Largest Area' },
];

export default function Properties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    agent_name: searchParams.get('agent_name') || '',
    type: searchParams.get('type') || 'All',
    purpose: searchParams.get('purpose') || 'All',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    sort: searchParams.get('sort') || 'createdAt-DESC',
    page: parseInt(searchParams.get('page')) || 1,
  });

  const fetchProperties = async (overrides = filters) => {
    setLoading(true);
    try {
      const [sortBy, order] = overrides.sort.split('-');
      const params = {
        page: overrides.page,
        limit: 12,
        sortBy,
        order,
      };
      if (overrides.agent_name) {
        params.agent_name = overrides.agent_name;
      } else if (overrides.location) {
        params.location = overrides.location;
      }
      if (overrides.type !== 'All') params.type = overrides.type;
      if (overrides.purpose !== 'All') params.purpose = overrides.purpose;
      if (overrides.minPrice) params.minPrice = overrides.minPrice;
      if (overrides.maxPrice) params.maxPrice = overrides.maxPrice;
      if (overrides.bedrooms) params.bedrooms = overrides.bedrooms;

      const res = await api.get('/search', { params });
      setProperties(res.data.properties);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(filters);
  }, [filters.page, filters.sort]);

  useEffect(() => {
    if (user && properties.length > 0) {
      const ids = properties.map((p) => p.id).join(',');
      api.get(`/favorites/check?propertyIds=${ids}`)
        .then((res) => setFavoriteIds(new Set(res.data.favoriteIds)))
        .catch(() => {});
    } else {
      setFavoriteIds(new Set());
    }
  }, [user, properties]);

  const applyFilters = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    setShowFilters(false);
    fetchProperties(updated);
  };

  const clearFilters = () => {
    const defaults = {
      location: '',
      agent_name: '',
      type: 'All',
      purpose: 'All',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      sort: 'createdAt-DESC',
      page: 1,
    };
    setFilters(defaults);
    fetchProperties(defaults);
  };

  const updateFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const handleToggleFavorite = async (propertyId) => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/favorites/${propertyId}`);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (res.data.saved) {
          next.add(propertyId);
        } else {
          next.delete(propertyId);
        }
        return next;
      });
      toast.success(res.data.saved ? 'Property saved' : 'Property removed from saved');
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const hasActiveFilters = filters.location || filters.type !== 'All' || filters.purpose !== 'All' || filters.minPrice || filters.maxPrice || filters.bedrooms;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-primary tracking-tight">Properties</h1>
          <p className="mt-2 text-muted">{totalCount} properties available</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex items-center flex-1 bg-surface rounded-xl px-4 border border-border/50">
            <Search size={16} className="text-muted" />
            <LocationAutocomplete
              value={filters.location}
              onChange={(val) => updateFilter('location', val)}
              onSelect={(suggestion) => {
                const updated = suggestion.type === 'agent'
                  ? { ...filters, location: suggestion.text, agent_name: suggestion.text, page: 1 }
                  : { ...filters, location: suggestion.text, agent_name: '', page: 1 };
                setFilters(updated);
                fetchProperties(updated);
              }}
              onEnter={applyFilters}
              className="flex-1"
              inputClassName="w-full bg-transparent px-3 py-3 text-sm"
            />
            {filters.location && (
              <button onClick={() => { updateFilter('location', ''); }} className="text-muted hover:text-secondary">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition-colors ${
                hasActiveFilters
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-secondary border-border/50 hover:border-accent'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-surface text-sm text-secondary px-4 py-3 rounded-xl border border-border/50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-surface rounded-2xl p-6 mb-8 border border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => updateFilter('type', type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filters.type === type
                          ? 'bg-primary text-white'
                          : 'bg-white text-secondary border border-border/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Purpose</label>
                <div className="flex gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      onClick={() => updateFilter('purpose', p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filters.purpose === p
                          ? 'bg-primary text-white'
                          : 'bg-white text-secondary border border-border/50'
                      }`}
                    >
                      {p === 'All' ? 'All' : `For ${p}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-border/50"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-border/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Bedrooms</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.bedrooms}
                  onChange={(e) => updateFilter('bedrooms', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-border/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={clearFilters} className="text-sm text-muted hover:text-secondary">
                Clear all
              </button>
              <button
                onClick={applyFilters}
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <Spinner className="py-32" />
        ) : properties.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-xl font-medium text-primary">No properties found</p>
            <p className="mt-2 text-sm text-muted">Try adjusting your filters or search terms.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-sm text-accent font-medium hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isFavorited={favoriteIds.has(p.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-secondary disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (filters.page <= 3) {
                    page = i + 1;
                  } else if (filters.page >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = filters.page - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => updateFilter('page', page)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                        filters.page === page
                          ? 'bg-primary text-white'
                          : 'bg-surface text-secondary hover:bg-border/50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => updateFilter('page', Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page === totalPages}
                  className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-secondary disabled:opacity-30"
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
