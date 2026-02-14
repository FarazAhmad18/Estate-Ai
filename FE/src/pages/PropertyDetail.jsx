import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, BedDouble, Maximize, Building2, Tag, Phone, Mail, User,
  ChevronLeft, ChevronRight, ArrowLeft, Heart, Star, Trash2, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import PropertyCard from '../components/PropertyCard';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  const [contactingAgent, setContactingAgent] = useState(false);

  // Agent rating & reviews
  const [agentStats, setAgentStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Similar properties
  const [similar, setSimilar] = useState([]);
  const [similarFavIds, setSimilarFavIds] = useState(new Set());

  useEffect(() => {
    const fetches = [
      api.get(`/properties/${id}`),
      api.get(`/properties/${id}/images`),
    ];

    Promise.all(fetches)
      .then(([propRes, imgRes]) => {
        setProperty(propRes.data.property);
        setImages(imgRes.data.images || []);
      })
      .catch(() => navigate('/properties'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && id) {
      api.get(`/favorites/check?propertyIds=${id}`)
        .then((res) => {
          setIsFavorited(res.data.favoriteIds.includes(parseInt(id)));
        })
        .catch(() => {});
    }
  }, [user, id]);

  // Fetch similar properties
  useEffect(() => {
    if (!property) return;
    const priceMin = Math.round(property.price * 0.3);
    const priceMax = Math.round(property.price * 3);
    // Try city part (after last comma), fallback to full location
    const parts = property.location?.split(',');
    const locationCity = parts?.length > 1 ? parts.pop().trim() : '';

    // Use full location string for matching (e.g. "DHA Phase 5, Lahore")
    const fullLocation = property.location?.trim() || '';

    const fetchSimilar = async () => {
      // First try: same location + same type + purpose + price range
      if (fullLocation) {
        const params = new URLSearchParams({ location: fullLocation, type: property.type, purpose: property.purpose, minPrice: priceMin, maxPrice: priceMax, limit: 5 });
        const res = await api.get(`/search?${params}`);
        const filtered = (res.data.properties || []).filter((p) => p.id !== property.id).slice(0, 4);
        if (filtered.length > 0) return filtered;
      }
      // Second try: city only (after last comma) + purpose + price range
      if (locationCity) {
        const params = new URLSearchParams({ location: locationCity, purpose: property.purpose, minPrice: priceMin, maxPrice: priceMax, limit: 5 });
        const res = await api.get(`/search?${params}`);
        const filtered = (res.data.properties || []).filter((p) => p.id !== property.id).slice(0, 4);
        if (filtered.length > 0) return filtered;
      }
      // Third try: city only (no type/price filter)
      if (locationCity) {
        const params = new URLSearchParams({ location: locationCity, limit: 5 });
        const res = await api.get(`/search?${params}`);
        const filtered = (res.data.properties || []).filter((p) => p.id !== property.id).slice(0, 4);
        if (filtered.length > 0) return filtered;
      }
      // Last resort: same type + purpose
      const params4 = new URLSearchParams({ type: property.type, purpose: property.purpose, limit: 5 });
      const res4 = await api.get(`/search?${params4}`);
      return (res4.data.properties || []).filter((p) => p.id !== property.id).slice(0, 4);
    };

    fetchSimilar()
      .then((filtered) => {
        setSimilar(filtered);
        if (user && filtered.length > 0) {
          const ids = filtered.map((p) => p.id).join(',');
          api.get(`/favorites/check?propertyIds=${ids}`)
            .then((r) => setSimilarFavIds(new Set(r.data.favoriteIds)))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [property?.id]);

  const handleToggleSimilarFav = async (propertyId) => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/favorites/${propertyId}`);
      setSimilarFavIds((prev) => {
        const next = new Set(prev);
        if (res.data.saved) next.add(propertyId);
        else next.delete(propertyId);
        return next;
      });
      toast.success(res.data.saved ? 'Property saved' : 'Property removed from saved');
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  // Fetch agent stats + reviews when property loads
  useEffect(() => {
    if (!property?.agent_id) return;
    const agentId = property.agent_id;
    api.get(`/agents/${agentId}`).then((res) => setAgentStats(res.data.stats)).catch(() => {});
    fetchReviews(agentId);
  }, [property?.agent_id]);

  const fetchReviews = (agentId) => {
    api.get(`/agents/${agentId}/reviews?limit=5`).then((res) => {
      setReviews(res.data.reviews);
      setReviewTotal(res.data.totalCount);
      if (user) setHasReviewed(res.data.reviews.some((r) => r.reviewer_id === user.id));
    }).catch(() => {});
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) return toast.error('Please write a review');
    setSubmitting(true);
    try {
      const res = await api.post(`/agents/${property.agent_id}/reviews`, { rating: reviewRating, content: reviewContent.trim() });
      setReviews((prev) => [res.data.review, ...prev]);
      setReviewTotal((t) => t + 1);
      setHasReviewed(true);
      setReviewContent('');
      setReviewRating(5);
      api.get(`/agents/${property.agent_id}`).then((r) => setAgentStats(r.data.stats)).catch(() => {});
      toast.success('Review submitted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/agents/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewTotal((t) => t - 1);
      setHasReviewed(false);
      api.get(`/agents/${property.agent_id}`).then((r) => setAgentStats(r.data.stats)).catch(() => {});
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/favorites/${id}`);
      setIsFavorited(res.data.saved);
      toast.success(res.data.saved ? 'Property saved' : 'Property removed from saved');
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleContactAgent = async () => {
    if (!user) return navigate('/login');
    if (contactingAgent) return;
    setContactingAgent(true);
    try {
      const res = await api.post('/conversations', {
        property_id: parseInt(id),
        agent_id: property.agent_id,
      });
      const convId = res.data.conversation.id;
      if (user.role === 'Agent') {
        navigate(`/dashboard?tab=messages&conversation=${convId}`);
      } else {
        navigate(`/messages?conversation=${convId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start conversation');
    } finally {
      setContactingAgent(false);
    }
  };

  if (loading) return <Spinner className="min-h-screen pt-24" />;
  if (!property) return null;

  const formatPrice = (price) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(2)} Crore`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)} Lac`;
    return price.toLocaleString();
  };

  const agent = property.User;
  const isOwner = user?.role === 'Agent' && user?.id === property.agent_id;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb + Back */}
        <div className="animate-fade-in-down flex items-center gap-3 mb-6 mt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border/60 text-muted hover:text-primary hover:border-accent/40 hover:bg-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <nav className="flex items-center gap-2 text-sm text-muted">
            <Link to="/properties" className="hover:text-accent transition-colors">Properties</Link>
            <ChevronRight size={14} className="text-border" />
            <span className="text-primary font-medium truncate max-w-[200px] sm:max-w-none">
              {property.location}
            </span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* ── Image Gallery ── */}
            <div className="animate-fade-in-up relative aspect-[16/10] sm:aspect-[16/9] bg-surface rounded-2xl overflow-hidden mobile-full sm:!rounded-2xl sm:!mx-0">
              {images.length > 0 ? (
                <>
                  <img
                    key={currentImg}
                    src={images[currentImg]?.image_url}
                    alt={property.location}
                    className="w-full h-full object-cover animate-fade-in"
                  />

                  {/* Image counter badge */}
                  <div className="absolute top-4 left-4 glass-dark text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Building2 size={12} />
                    {currentImg + 1} / {images.length}
                  </div>

                  {/* Favorite button on image */}
                  <button
                    onClick={handleToggleFavorite}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isFavorited
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'glass text-secondary hover:text-red-500'
                    }`}
                  >
                    <Heart
                      size={18}
                      className={isFavorited ? 'fill-white text-white' : ''}
                    />
                  </button>

                  {images.length > 1 && (
                    <>
                      {/* Prev / Next arrows */}
                      <button
                        onClick={() => setCurrentImg((c) => (c === 0 ? images.length - 1 : c - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentImg((c) => (c === images.length - 1 ? 0 : c + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm"
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Dot navigation */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-dark px-3 py-2 rounded-full flex gap-2">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImg(i)}
                            className={`rounded-full transition-all duration-300 ${
                              i === currentImg
                                ? 'w-6 h-2 bg-white'
                                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2">
                  <Building2 size={48} strokeWidth={1.5} />
                  <span className="text-sm">No images available</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mt-2 px-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImg(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      i === currentImg
                        ? 'border-accent ring-2 ring-accent/20 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* ── Property Info ── */}
            <div className="animate-fade-in-up stagger-1">
              {/* Tags */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-semibold bg-surface px-3 py-1.5 rounded-full text-secondary border border-border/60">
                  {property.type}
                </span>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  property.purpose === 'Sale'
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'bg-success/10 text-success border border-success/20'
                }`}>
                  For {property.purpose}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-1.5 h-10 rounded-full gradient-accent flex-shrink-0 mt-1" />
                <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                  PKR {formatPrice(property.price)}
                  {property.purpose === 'Rent' && (
                    <span className="text-base md:text-lg font-normal text-muted"> /month</span>
                  )}
                </h1>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-muted ml-4">
                <MapPin size={16} className="text-accent flex-shrink-0" />
                <span className="text-sm">{property.location}</span>
              </div>
            </div>

            {/* ── Spec Cards ── */}
            <div className="animate-fade-in-up stagger-2 flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-visible">
              {[
                { icon: Building2, label: 'Type', value: property.type },
                { icon: Tag, label: 'Purpose', value: `For ${property.purpose}` },
                { icon: BedDouble, label: 'Bedrooms', value: property.bedrooms || 'N/A' },
                { icon: Maximize, label: 'Area', value: `${property.area?.toLocaleString()} sq ft` },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="flex-shrink-0 w-36 sm:w-auto card-elevated rounded-2xl p-4 hover:border-accent/20"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                    <spec.icon size={16} className="text-accent" />
                  </div>
                  <p className="text-xs text-muted">{spec.label}</p>
                  <p className="text-sm font-semibold text-primary mt-0.5">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* ── Description ── */}
            <div className="animate-fade-in-up stagger-3">
              <h2 className="text-lg font-semibold text-primary mb-3">Description</h2>
              <div className="card-elevated rounded-2xl p-5">
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            </div>

            {/* ── Agent Reviews Section ── */}
            {agent && (
              <div className="animate-fade-in-up stagger-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <MessageSquare size={18} className="text-accent" />
                    Agent Reviews
                    {reviewTotal > 0 && (
                      <span className="text-xs font-medium text-muted bg-surface px-2 py-0.5 rounded-full">
                        {reviewTotal}
                      </span>
                    )}
                  </h2>
                  {agentStats && agentStats.avgRating > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-amber-700">{agentStats.avgRating}</span>
                      <span className="text-xs text-amber-600">avg</span>
                    </div>
                  )}
                </div>

                {/* Review Form for Buyers */}
                {user && user.role === 'Buyer' && user.id !== property.agent_id && !hasReviewed && (
                  <div className="card-elevated rounded-2xl p-5 mb-5">
                    <p className="text-sm font-semibold text-primary mb-3">Rate this agent</p>
                    <form onSubmit={handleSubmitReview}>
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              size={28}
                              className={`transition-colors ${
                                s <= (hoverRating || reviewRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-sm text-muted ml-2 font-medium">{hoverRating || reviewRating}/5</span>
                      </div>
                      <textarea
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Share your experience with this agent..."
                        rows={3}
                        className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-none"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="mt-3 btn-primary px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Not logged in prompt */}
                {!user && (
                  <div className="card-elevated rounded-2xl p-5 mb-5 text-center">
                    <p className="text-sm text-muted">
                      <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link> to rate this agent
                    </p>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="card-elevated rounded-2xl p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center overflow-hidden border border-border/60">
                              {review.Reviewer?.avatar_url ? (
                                <img src={review.Reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} className="text-muted" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-primary">{review.Reviewer?.name || 'Anonymous'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={12} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                                  ))}
                                </div>
                                <span className="text-xs text-muted">
                                  {new Date(review.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {user && review.reviewer_id === user.id && (
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-secondary leading-relaxed pl-[52px]">{review.content}</p>
                      </div>
                    ))}
                    {reviewTotal > 5 && (
                      <Link
                        to={`/agents/${agent.id}`}
                        className="block text-center text-sm text-accent font-medium hover:underline py-3"
                      >
                        View all {reviewTotal} reviews
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="card-elevated rounded-2xl p-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center mb-3">
                      <Star size={20} className="text-muted" />
                    </div>
                    <p className="text-sm text-muted">No reviews yet for this agent</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Similar Properties ── */}
            {similar.length > 0 && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-primary">Similar Properties</h2>
                  <Link
                    to={`/properties?type=${property.type}&purpose=${property.purpose}`}
                    className="text-xs font-semibold text-accent hover:underline underline-offset-4 flex items-center gap-1"
                  >
                    View more <ChevronRight size={12} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {similar.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      isFavorited={similarFavIds.has(p.id)}
                      onToggleFavorite={handleToggleSimilarFav}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-6">
            {/* Agent Card */}
            {agent && (
              <div className="card-elevated rounded-2xl overflow-hidden sticky top-24 animate-fade-in-up stagger-2">
                {/* Gradient header */}
                <div className="gradient-accent h-20 relative">
                  <div className="absolute -bottom-8 left-6">
                    <Link to={`/agents/${agent.id}`}>
                      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                        {agent.avatar_url ? (
                          <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-muted" />
                        )}
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="pt-12 px-6 pb-6">
                  <Link to={`/agents/${agent.id}`} className="group">
                    <p className="font-semibold text-primary text-lg group-hover:text-accent transition-colors">
                      {agent.name}
                    </p>
                    <p className="text-xs text-accent font-medium">View Profile</p>
                  </Link>

                  {agentStats && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= Math.round(agentStats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-primary">{agentStats.avgRating || '0'}</span>
                      <span className="text-xs text-muted">({agentStats.totalReviews} {agentStats.totalReviews === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-border/60 my-5" />

                  <div className="space-y-3">
                    {agent.email && (
                      <a href={`mailto:${agent.email}`} className="flex items-center gap-3 text-sm text-secondary hover:text-accent transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                          <Mail size={14} className="text-muted group-hover:text-accent transition-colors" />
                        </div>
                        <span className="truncate">{agent.email}</span>
                      </a>
                    )}
                    {agent.phone && (
                      <a href={`tel:${agent.phone}`} className="flex items-center gap-3 text-sm text-secondary hover:text-accent transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                          <Phone size={14} className="text-muted group-hover:text-accent transition-colors" />
                        </div>
                        {agent.phone}
                      </a>
                    )}
                  </div>

                  {!isOwner && (
                    <button
                      onClick={handleContactAgent}
                      disabled={contactingAgent}
                      className="mt-6 w-full btn-primary py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      {contactingAgent ? 'Opening chat...' : 'Contact Agent'}
                    </button>
                  )}

                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      className="mt-3 block w-full text-primary text-center py-3 rounded-xl text-sm font-semibold border border-border/60 bg-white hover:bg-surface hover:border-accent/30 transition-all"
                    >
                      Call Now
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="card-elevated rounded-2xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Manage</h3>
                <Link
                  to={`/properties/${property.id}/edit`}
                  className="block w-full btn-primary text-center py-3 rounded-xl text-sm font-semibold"
                >
                  Edit Property
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
