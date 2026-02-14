import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Star, Building2, CheckCircle2, TrendingUp, CalendarDays,
  Mail, Phone, ChevronLeft, ChevronRight, Trash2, MessageSquare, ArrowLeft
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PropertyCard from '../components/PropertyCard';

export default function AgentProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [contactingAgent, setContactingAgent] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');

  const [properties, setProperties] = useState([]);
  const [propPage, setPropPage] = useState(1);
  const [propTotalPages, setPropTotalPages] = useState(1);
  const [propLoading, setPropLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

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

  const handleContactAgent = async () => {
    if (!user) return navigate('/login');
    if (contactingAgent) return;
    setContactingAgent(true);
    try {
      // Get agent's first available property to create conversation
      const propRes = await api.get(`/agents/${id}/properties?limit=1`);
      const agentProperty = propRes.data.properties?.[0];
      if (!agentProperty) {
        toast.error('This agent has no active listings');
        return;
      }
      const res = await api.post('/conversations', {
        property_id: agentProperty.id,
        agent_id: parseInt(id),
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <div className="min-h-screen pt-24 pb-16 mesh-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full skeleton" />
          <div className="h-4 w-32 skeleton rounded-lg" />
        </div>
        <div className="bg-white rounded-2xl border border-border/50 p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full skeleton" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-48 skeleton rounded-lg" />
              <div className="h-4 w-32 skeleton rounded-lg" />
              <div className="flex gap-3"><div className="h-8 w-20 skeleton rounded-lg" /><div className="h-8 w-20 skeleton rounded-lg" /></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1,2,3].map(i => <div key={i} className="h-72 skeleton rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
  if (!agent) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <p className="text-muted">Agent not found</p>
    </div>
  );

  const canReview = user && user.role === 'Buyer' && user.id !== parseInt(id) && !hasReviewed;
  const userInitial = agent.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen pt-20 pb-16 mesh-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mt-6 mb-4 font-medium"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Agent Header */}
        <div className="bg-white rounded-2xl border border-border/50 p-6 sm:p-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-white shadow-lg">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{userInitial}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">{agent.name}</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent/90 text-white px-2.5 py-0.5 rounded-full">Agent</span>
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
            <div className="flex gap-3 flex-shrink-0 w-full sm:w-auto">
              {(!user || user.id !== parseInt(id)) && (
                <button
                  onClick={handleContactAgent}
                  disabled={contactingAgent}
                  className="flex-1 sm:flex-none text-center text-white px-6 py-2.5 rounded-full text-sm font-semibold btn-primary disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={15} />
                  {contactingAgent ? 'Opening chat...' : 'Contact Agent'}
                </button>
              )}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex-1 sm:flex-none text-center bg-white text-primary px-6 py-2.5 rounded-full text-sm font-semibold border border-border/50 hover:bg-surface transition-colors"
                >
                  Call
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 animate-fade-in-up stagger-1">
            {[
              { label: 'Total Listings', value: stats.totalListings, icon: Building2, bg: 'bg-blue-600' },
              { label: 'Avg Rating', value: stats.avgRating || '—', suffix: `(${stats.totalReviews})`, icon: Star, bg: 'bg-amber-500' },
              { label: 'Sold', value: stats.sold, icon: CheckCircle2, bg: 'bg-red-500' },
              { label: 'Rented', value: stats.rented, icon: TrendingUp, bg: 'bg-indigo-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-5 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 shadow-sm`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  {s.suffix && <p className="text-xs text-muted">{s.suffix}</p>}
                </div>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mt-8 mb-8 w-fit border border-border/50 shadow-sm animate-fade-in-up stagger-2">
          {[
            { key: 'listings', label: 'Listings' },
            { key: 'reviews', label: `Reviews${stats ? ` (${stats.totalReviews})` : ''}` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-secondary'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-border/40 overflow-hidden">
                    <div className="h-44 skeleton" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 w-20 skeleton rounded-full" />
                      <div className="h-5 w-32 skeleton rounded-lg" />
                      <div className="h-3 w-40 skeleton rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-2xl border border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-5">
                  <Building2 size={28} className="text-muted" />
                </div>
                <p className="text-lg font-bold text-primary">No listings yet</p>
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
                      className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-muted hover:text-accent disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-muted font-medium">
                      Page {propPage} of {propTotalPages}
                    </span>
                    <button
                      onClick={() => setPropPage((p) => Math.min(propTotalPages, p + 1))}
                      disabled={propPage === propTotalPages}
                      className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-muted hover:text-accent disabled:opacity-30 transition-colors"
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
            {canReview && (
              <div className="bg-white rounded-2xl border border-border/50 p-6 mb-6">
                <h3 className="text-sm font-bold text-primary mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview}>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-0.5 focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={s <= reviewRating ? 'fill-warning text-warning' : 'text-border hover:text-warning/50 transition-colors'}
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
                    className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-4 text-white px-6 py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {reviewLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-border/40 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full skeleton" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-28 skeleton rounded-lg" />
                        <div className="h-3 w-20 skeleton rounded-lg" />
                      </div>
                    </div>
                    <div className="h-12 skeleton rounded-lg" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-2xl border border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-5">
                  <Star size={28} className="text-muted" />
                </div>
                <p className="text-lg font-bold text-primary">No reviews yet</p>
                <p className="mt-2 text-sm text-muted">Be the first to review this agent.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {reviews.map((review) => (
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
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={s <= review.rating ? 'fill-warning text-warning' : 'text-border'}
                              />
                            ))}
                          </div>
                          {user && review.reviewer_id === user.id && (
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-muted hover:text-red-500 transition-all ml-2"
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
                      className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-muted hover:text-accent disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-muted font-medium">
                      Page {reviewPage} of {reviewTotalPages}
                    </span>
                    <button
                      onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                      disabled={reviewPage === reviewTotalPages}
                      className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-muted hover:text-accent disabled:opacity-30 transition-colors"
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
