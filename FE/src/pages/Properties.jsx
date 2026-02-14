import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, SearchX } from 'lucide-react';
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

  const activeFilterCount = [
    filters.type !== 'All',
    filters.purpose !== 'All',
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen pb-16">
      {/* ── Page Header with Mesh Gradient ── */}
      <div className="mesh-gradient pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-6 animate-fade-in-up">
          <span className="inline-block gradient-accent text-white text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-4">
            Browse Properties
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
            Find Your Perfect Property
          </h1>
          <p className="mt-3 text-muted text-base md:text-lg max-w-xl">
            Explore {totalCount.toLocaleString()} listings across top locations. Filter, compare, and save the ones you love.
          </p>
        </div>
      </div>

      {/* ── Sticky Search & Filter Bar ── */}
      <div className="sticky top-16 z-30 glass border-b border-border/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex items-center flex-1 bg-surface rounded-xl border border-border/60 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 transition-all">
              <Search size={16} className="text-muted ml-4 flex-shrink-0" />
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
                inputClassName="w-full bg-transparent px-3 py-3 text-sm placeholder:text-muted/60"
              />
              {filters.location && (
                <button
                  onClick={() => { updateFilter('location', ''); }}
                  className="mr-3 p-1 rounded-lg text-muted hover:text-secondary hover:bg-border/40 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter + Sort Controls */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition-all ${
                  showFilters || hasActiveFilters
                    ? 'btn-primary rounded-xl'
                    : 'bg-surface text-secondary border-border/60 hover:border-accent hover:text-accent'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="appearance-none bg-surface text-sm text-secondary pl-4 pr-9 py-3 rounded-xl border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile: Horizontal scrollable active filter chips */}
          {hasActiveFilters && !showFilters && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1 animate-fade-in-down">
              {filters.type !== 'All' && (
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  {filters.type}
                  <button onClick={() => updateFilter('type', 'All')} className="hover:text-accent-light"><X size={12} /></button>
                </span>
              )}
              {filters.purpose !== 'All' && (
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  For {filters.purpose}
                  <button onClick={() => updateFilter('purpose', 'All')} className="hover:text-accent-light"><X size={12} /></button>
                </span>
              )}
              {filters.minPrice && (
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  Min: {Number(filters.minPrice).toLocaleString()}
                  <button onClick={() => updateFilter('minPrice', '')} className="hover:text-accent-light"><X size={12} /></button>
                </span>
              )}
              {filters.maxPrice && (
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  Max: {Number(filters.maxPrice).toLocaleString()}
                  <button onClick={() => updateFilter('maxPrice', '')} className="hover:text-accent-light"><X size={12} /></button>
                </span>
              )}
              {filters.bedrooms && (
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  {filters.bedrooms} Bed{filters.bedrooms > 1 ? 's' : ''}
                  <button onClick={() => updateFilter('bedrooms', '')} className="hover:text-accent-light"><X size={12} /></button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                <X size={12} />
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Collapsible Filter Panel ── */}
      {showFilters && (
        <div className="max-w-7xl mx-auto px-6 mt-6 animate-fade-in-down">
          <div className="bg-white rounded-2xl p-6 border border-border/60 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => updateFilter('type', type)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.type === type
                          ? 'btn-primary rounded-full'
                          : 'bg-surface text-secondary border border-border/60 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose Filter */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Purpose</label>
                <div className="flex gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      onClick={() => updateFilter('purpose', p)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.purpose === p
                          ? 'btn-primary rounded-full'
                          : 'bg-surface text-secondary border border-border/60 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {p === 'All' ? 'All' : `For ${p}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted/50"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted/50"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Bedrooms</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.bedrooms}
                  onChange={(e) => updateFilter('bedrooms', e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted/50"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/40">
              <button
                onClick={clearFilters}
                className="text-sm text-muted hover:text-danger transition-colors font-medium"
              >
                Clear all filters
              </button>
              <button
                onClick={applyFilters}
                className="btn-primary px-8 py-2.5 rounded-xl text-sm font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Results Count */}
        {!loading && properties.length > 0 && (
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <p className="text-sm text-muted">
              Showing <span className="font-semibold text-secondary">{properties.length}</span> of{' '}
              <span className="font-semibold text-secondary">{totalCount.toLocaleString()}</span> properties
              {filters.page > 1 && (
                <span> &middot; Page {filters.page}</span>
              )}
            </p>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <Spinner className="py-32" />
        ) : properties.length === 0 ? (
          <div className="text-center py-24 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface-2 mb-6">
              <SearchX size={36} className="text-muted" />
            </div>
            <p className="text-xl font-semibold text-primary">No properties found</p>
            <p className="mt-2 text-sm text-muted max-w-md mx-auto">
              We couldn't find any properties matching your criteria. Try broadening your search or adjusting your filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-6 inline-flex items-center gap-2 btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
              >
                <X size={14} />
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p, index) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <PropertyCard
                    property={p}
                    isFavorited={favoriteIds.has(p.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-14 animate-fade-in">
                <button
                  onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="w-10 h-10 rounded-full bg-surface border border-border/60 flex items-center justify-center text-secondary hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border/60 disabled:hover:text-secondary transition-all"
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
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                        filters.page === page
                          ? 'btn-primary rounded-full shadow-md'
                          : 'bg-surface text-secondary border border-border/60 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => updateFilter('page', Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page === totalPages}
                  className="w-10 h-10 rounded-full bg-surface border border-border/60 flex items-center justify-center text-secondary hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border/60 disabled:hover:text-secondary transition-all"
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
