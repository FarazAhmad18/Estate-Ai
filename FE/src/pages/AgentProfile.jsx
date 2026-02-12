import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User, Star, Building2, CheckCircle2, TrendingUp, CalendarDays,
  Mail, Phone, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import PropertyCard from '../components/PropertyCard';

export default function AgentProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');

  // Listings state
  const [properties, setProperties] = useState([]);
  const [propPage, setPropPage] = useState(1);
  const [propTotalPages, setPropTotalPages] = useState(1);
  const [propLoading, setPropLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/agents/${id}`)
      .then((res) => {
        setAgent(res.data.agent);
        setStats(res.data.stats);
      })
      .catch(() => toast.error('Agent not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'listings') fetchProperties();
  }, [tab, propPage]);

  useEffect(() => {
    if (tab === 'reviews') fetchReviews();
  }, [tab, reviewPage]);

  const fetchProperties = async () => {
    setPropLoading(true);
    try {
      const res = await api.get(`/agents/${id}/properties?page=${propPage}&status=All`);
      setProperties(res.data.properties);
      setPropTotalPages(res.data.totalPages);
      if (user && res.data.properties.length > 0) {
        const ids = res.data.properties.map((p) => p.id).join(',');
        const favRes = await api.get(`/favorites/check?propertyIds=${ids}`);
        setFavoriteIds(favRes.data.favoriteIds);
      }
    } catch {
      // ignore
    } finally {
      setPropLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewLoading(true);
    try {
      const res = await api.get(`/agents/${id}/reviews?page=${reviewPage}`);
      setReviews(res.data.reviews);
      setReviewTotalPages(res.data.totalPages);
      if (user) {
        setHasReviewed(res.data.reviews.some((r) => r.reviewer_id === user.id));
      }
    } catch {
      // ignore
    } finally {
      setReviewLoading(false);
    }
  };

  const handleToggleFavorite = async (propertyId) => {
    if (!user) return;
    try {
      const res = await api.post(`/favorites/${propertyId}`);
      setFavoriteIds((prev) =>
        res.data.saved ? [...prev, propertyId] : prev.filter((fid) => fid !== propertyId)
      );
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) return toast.error('Please write a review');
    setSubmitting(true);
    try {
      const res = await api.post(`/agents/${id}/reviews`, { rating: reviewRating, content: reviewContent.trim() });
      setReviews((prev) => [res.data.review, ...prev]);
      setHasReviewed(true);
      setReviewContent('');
      setReviewRating(5);
      // Refresh stats
      const statsRes = await api.get(`/agents/${id}`);
      setStats(statsRes.data.stats);
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
      setHasReviewed(false);
      const statsRes = await api.get(`/agents/${id}`);
      setStats(statsRes.data.stats);
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <Spinner className="min-h-screen pt-24" />;
  if (!agent) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <p className="text-muted">Agent not found</p>
    </div>
  );

  const canReview = user && user.role === 'Buyer' && user.id !== parseInt(id) && !hasReviewed;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Agent Header */}
        <div className="bg-white rounded-2xl border border-border/50 p-8 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-muted" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-primary">{agent.name}</h1>
                <span className="text-xs font-medium bg-accent/10 text-accent px-3 py-1 rounded-full">Agent</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted mt-1">
                <CalendarDays size={14} />
                <span>Member since {formatDate(agent.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {agent.email && (
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition-colors">
                    <Mail size={14} className="text-muted" /> {agent.email}
                  </a>
                )}
                {agent.phone && (
                  <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition-colors">
                    <Phone size={14} className="text-muted" /> {agent.phone}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Contact
                </a>
              )}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="bg-white text-primary px-5 py-2.5 rounded-full text-sm font-medium border border-border/50 hover:bg-surface transition-colors"
                >
                  Call
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Building2 size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-semibold text-primary">{stats.totalListings}</p>
              <p className="text-xs text-muted mt-0.5">Total Listings</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <Star size={18} className="text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-semibold text-primary">{stats.avgRating || '—'}</p>
                <p className="text-xs text-muted">({stats.totalReviews})</p>
              </div>
              <p className="text-xs text-muted mt-0.5">Avg Rating</p>
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

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 mt-8 mb-8 w-fit">
          {[
            { key: 'listings', label: 'Listings' },
            { key: 'reviews', label: `Reviews${stats ? ` (${stats.totalReviews})` : ''}` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Listings Tab */}
        {tab === 'listings' && (
          <>
            {propLoading ? (
              <Spinner className="py-32" />
            ) : properties.length === 0 ? (
              <div className="text-center py-32 bg-surface rounded-2xl">
                <Building2 size={40} className="mx-auto text-muted mb-4" />
                <p className="text-lg font-medium text-primary">No listings yet</p>
                <p className="mt-2 text-sm text-muted">This agent hasn't listed any properties.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      isFavorited={favoriteIds.includes(p.id)}
                      onToggleFavorite={user ? handleToggleFavorite : undefined}
                    />
                  ))}
                </div>
                {propTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                      onClick={() => setPropPage((p) => Math.max(1, p - 1))}
                      disabled={propPage === 1}
                      className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-muted">
                      Page {propPage} of {propTotalPages}
                    </span>
                    <button
                      onClick={() => setPropPage((p) => Math.min(propTotalPages, p + 1))}
                      disabled={propPage === propTotalPages}
                      className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Reviews Tab */}
        {tab === 'reviews' && (
          <>
            {/* Review Form */}
            {canReview && (
              <div className="bg-white rounded-2xl border border-border/50 p-6 mb-6">
                <h3 className="text-sm font-semibold text-primary mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview}>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-0.5"
                      >
                        <Star
                          size={24}
                          className={s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-muted ml-2">{reviewRating}/5</span>
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience with this agent..."
                    rows={3}
                    className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {reviewLoading ? (
              <Spinner className="py-32" />
            ) : reviews.length === 0 ? (
              <div className="text-center py-32 bg-surface rounded-2xl">
                <Star size={40} className="mx-auto text-muted mb-4" />
                <p className="text-lg font-medium text-primary">No reviews yet</p>
                <p className="mt-2 text-sm text-muted">Be the first to review this agent.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {reviews.map((review) => (
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
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                              />
                            ))}
                          </div>
                          {user && review.reviewer_id === user.id && (
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-red-500 transition-colors ml-2"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-secondary leading-relaxed">{review.content}</p>
                    </div>
                  ))}
                </div>
                {reviewTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                      onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                      disabled={reviewPage === 1}
                      className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-muted">
                      Page {reviewPage} of {reviewTotalPages}
                    </span>
                    <button
                      onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                      disabled={reviewPage === reviewTotalPages}
                      className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
