import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, BedDouble, Maximize, Building2, Tag, Phone, Mail, User,
  ChevronLeft, ChevronRight, ArrowLeft, Heart, Star, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Agent rating & reviews
  const [agentStats, setAgentStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

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
      <div className="max-w-7xl mx-auto px-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-6 mt-4"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative aspect-[16/10] bg-surface rounded-2xl overflow-hidden">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImg]?.image_url}
                    alt={property.location}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImg((c) => (c === 0 ? images.length - 1 : c - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentImg((c) => (c === images.length - 1 ? 0 : c + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImg(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === currentImg ? 'bg-white' : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <Building2 size={48} />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImg(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      i === currentImg ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Details */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-surface px-3 py-1 rounded-full text-secondary">
                    {property.type}
                  </span>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    property.purpose === 'Sale'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-success/10 text-success'
                  }`}>
                    For {property.purpose}
                  </span>
                </div>
                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    isFavorited
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-surface border-border/50 text-secondary hover:border-accent'
                  }`}
                >
                  <Heart
                    size={16}
                    className={isFavorited ? 'fill-red-500 text-red-500' : ''}
                  />
                  {isFavorited ? 'Saved' : 'Save Property'}
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold text-primary tracking-tight">
                PKR {formatPrice(property.price)}
                {property.purpose === 'Rent' && <span className="text-lg font-normal text-muted"> /month</span>}
              </h1>

              <div className="flex items-center gap-2 mt-3 text-muted">
                <MapPin size={16} />
                <span className="text-sm">{property.location}</span>
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Building2, label: 'Type', value: property.type },
                { icon: Tag, label: 'Purpose', value: `For ${property.purpose}` },
                { icon: BedDouble, label: 'Bedrooms', value: property.bedrooms || 'N/A' },
                { icon: Maximize, label: 'Area', value: `${property.area?.toLocaleString()} sq ft` },
              ].map((spec) => (
                <div key={spec.label} className="bg-surface rounded-xl p-4">
                  <spec.icon size={16} className="text-muted mb-2" />
                  <p className="text-xs text-muted">{spec.label}</p>
                  <p className="text-sm font-medium text-primary mt-0.5">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-primary mb-3">Description</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Agent Reviews Section */}
            {agent && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-primary">
                    Agent Reviews
                    {reviewTotal > 0 && <span className="text-muted font-normal text-sm ml-2">({reviewTotal})</span>}
                  </h2>
                  {agentStats && agentStats.avgRating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star size={16} className="fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-primary">{agentStats.avgRating}</span>
                      <span className="text-xs text-muted">avg</span>
                    </div>
                  )}
                </div>

                {/* Review Form for Buyers */}
                {user && user.role === 'Buyer' && user.id !== property.agent_id && !hasReviewed && (
                  <div className="bg-surface rounded-2xl p-5 mb-5">
                    <p className="text-sm font-medium text-primary mb-3">Rate this agent</p>
                    <form onSubmit={handleSubmitReview}>
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-0.5"
                          >
                            <Star
                              size={28}
                              className={`transition-colors ${
                                s <= (hoverRating || reviewRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-sm text-muted ml-2">{hoverRating || reviewRating}/5</span>
                      </div>
                      <textarea
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Share your experience with this agent..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white rounded-xl text-sm border border-border/50 focus:border-accent transition-colors resize-none"
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

                {/* Not logged in prompt */}
                {!user && (
                  <div className="bg-surface rounded-2xl p-5 mb-5 text-center">
                    <p className="text-sm text-muted">
                      <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link> to rate this agent
                    </p>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-surface rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                              {review.Reviewer?.avatar_url ? (
                                <img src={review.Reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={14} className="text-muted" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary">{review.Reviewer?.name || 'Anonymous'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
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
                              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="mt-2.5 text-sm text-secondary leading-relaxed pl-12">{review.content}</p>
                      </div>
                    ))}
                    {reviewTotal > 5 && (
                      <Link
                        to={`/agents/${agent.id}`}
                        className="block text-center text-sm text-accent hover:underline py-2"
                      >
                        View all {reviewTotal} reviews
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl p-8 text-center">
                    <Star size={24} className="mx-auto text-muted mb-2" />
                    <p className="text-sm text-muted">No reviews yet for this agent</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            {agent && (
              <div className="bg-surface rounded-2xl p-6 sticky top-24">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Listed by</h3>
                <Link to={`/agents/${agent.id}`} className="flex items-center gap-3 mb-4 group">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-muted" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-primary group-hover:text-accent transition-colors">{agent.name}</p>
                    <p className="text-xs text-accent">View Profile</p>
                  </div>
                </Link>

                {agentStats && (
                  <div className="flex items-center gap-2 mb-5 px-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= Math.round(agentStats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-primary">{agentStats.avgRating || '0'}</span>
                    <span className="text-xs text-muted">({agentStats.totalReviews} {agentStats.totalReviews === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}

                <div className="space-y-3">
                  {agent.email && (
                    <a href={`mailto:${agent.email}`} className="flex items-center gap-3 text-sm text-secondary hover:text-accent transition-colors">
                      <Mail size={14} className="text-muted" />
                      {agent.email}
                    </a>
                  )}
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} className="flex items-center gap-3 text-sm text-secondary hover:text-accent transition-colors">
                      <Phone size={14} className="text-muted" />
                      {agent.phone}
                    </a>
                  )}
                </div>

                <a
                  href={`mailto:${agent.email}?subject=Inquiry about property in ${property.location}`}
                  className="mt-6 block w-full bg-primary text-white text-center py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Contact Agent
                </a>

                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="mt-3 block w-full bg-white text-primary text-center py-3 rounded-xl text-sm font-medium border border-border/50 hover:bg-surface transition-colors"
                  >
                    Call Now
                  </a>
                )}
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="bg-surface rounded-2xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Manage</h3>
                <Link
                  to={`/properties/${property.id}/edit`}
                  className="block w-full bg-accent text-white text-center py-3 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
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
