import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Building2, Shield, Sparkles, MapPin, Star, Quote, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import LocationAutocomplete from '../components/LocationAutocomplete';

import heroInterior from '../assets/hero-interior.png';
import heroExterior from '../assets/hero-exterior.png';
import room1 from '../assets/room-1.png';
import room2 from '../assets/room-2.png';
import room3 from '../assets/room-3.png';
import room4 from '../assets/room-4.png';
import room5 from '../assets/room-5.png';
import room6 from '../assets/room-6.png';
import avatar1 from '../assets/avatar-1.png';
import avatar2 from '../assets/avatar-2.png';
import avatar3 from '../assets/avatar-3.png';
import avatar4 from '../assets/avatar-4.png';

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [testimonials, setTestimonials] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchTestimonials = () => {
    api.get('/testimonials')
      .then((res) => setTestimonials(res.data.testimonials))
      .catch(() => {});
  };

  useEffect(() => {
    api.get('/properties?limit=6&sortBy=createdAt&order=DESC')
      .then((res) => setFeatured(res.data.properties))
      .catch(() => {});
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (user && featured.length > 0) {
      const ids = featured.map((p) => p.id).join(',');
      api.get(`/favorites/check?propertyIds=${ids}`)
        .then((res) => setFavoriteIds(new Set(res.data.favoriteIds)))
        .catch(() => {});
    } else {
      setFavoriteIds(new Set());
    }
  }, [user, featured]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/properties?location=${encodeURIComponent(search.trim())}`);
    }
  };

  const userTestimonial = user ? testimonials.find((t) => t.User?.id === user.id) : null;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) return toast.error('Please write your review');
    setSubmitting(true);
    try {
      await api.post('/testimonials', { content: reviewContent.trim(), rating: reviewRating });
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setReviewContent('');
      setReviewRating(5);
      fetchTestimonials();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (id) => {
    try {
      await api.delete(`/testimonials/${id}`);
      toast.success('Review deleted');
      fetchTestimonials();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen pt-16 flex items-center bg-white overflow-x-clip z-10">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="pt-12 lg:pt-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full text-xs font-medium text-muted mb-6">
                <Sparkles size={12} className="text-accent" />
                AI-Powered Real Estate Platform
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-tight text-primary leading-[1.08]">
                Find your next
                <br />
                <span className="text-muted">perfect place.</span>
              </h1>
              <p className="mt-6 text-lg text-muted max-w-md leading-relaxed">
                Discover properties across Pakistan with intelligent search, verified listings, and a seamless experience.
              </p>

              <form onSubmit={handleSearch} className="mt-8 max-w-md">
                <div className="flex items-center bg-surface rounded-full p-1.5 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 flex-1 px-4">
                    <MapPin size={16} className="text-muted flex-shrink-0" />
                    <LocationAutocomplete
                      value={search}
                      onChange={setSearch}
                      onSelect={(suggestion) => {
                        if (suggestion.type === 'agent') {
                          navigate(`/properties?agent_name=${encodeURIComponent(suggestion.text)}`);
                        } else {
                          navigate(`/properties?location=${encodeURIComponent(suggestion.text)}`);
                        }
                      }}
                      className="flex-1"
                      inputClassName="w-full bg-transparent text-sm text-secondary placeholder:text-muted py-2.5"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 flex-shrink-0"
                  >
                    <Search size={14} />
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-6 flex items-center gap-5 text-sm text-muted">
                <span>Popular:</span>
                {['Lahore', 'Islamabad', 'Karachi'].map((city) => (
                  <Link
                    key={city}
                    to={`/properties?location=${city}`}
                    className="hover:text-accent transition-colors underline underline-offset-2 decoration-border"
                  >
                    {city}
                  </Link>
                ))}
              </div>

              {/* Trust bar */}
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[avatar1, avatar2, avatar3, avatar4].map((av, i) => (
                    <img
                      key={i}
                      src={av}
                      alt=""
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-0.5">Trusted by 1,000+ happy clients</p>
                </div>
              </div>
            </div>

            {/* Right - Image collage */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                  <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                    <img src={heroInterior} alt="Modern interior" className="w-full h-72 object-cover" />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-lg shadow-black/5">
                    <img src={room1} alt="Living room" className="w-full h-48 object-cover" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden shadow-lg shadow-black/5">
                    <img src={heroExterior} alt="House exterior" className="w-full h-48 object-cover" />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                    <img src={room2} alt="Luxury room" className="w-full h-72 object-cover" />
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute -left-6 bottom-24 bg-white rounded-2xl shadow-xl shadow-black/10 p-4 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Building2 size={16} className="text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">500+</p>
                    <p className="text-[11px] text-muted">Properties Listed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Gallery */}
      <section className="py-24 bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-primary tracking-tight">
            Explore stunning spaces
          </h2>
          <p className="mt-3 text-muted max-w-lg">
            From modern apartments to luxury villas, find a home that matches your lifestyle.
          </p>
        </div>
        <div className="flex gap-4 px-6 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { img: room3, label: 'Luxury Living' },
            { img: room4, label: 'Modern Design' },
            { img: room5, label: 'Cozy Spaces' },
            { img: room6, label: 'Contemporary' },
            { img: room1, label: 'Elegant Decor' },
            { img: room2, label: 'Premium Finish' },
          ].map((item, i) => (
            <Link
              to="/properties"
              key={i}
              className="flex-shrink-0 group relative w-72 h-80 rounded-3xl overflow-hidden"
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-white font-medium text-sm">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: '500+', label: 'Properties Listed', color: 'bg-accent/10 text-accent' },
              { value: '200+', label: 'Verified Agents', color: 'bg-success/10 text-success' },
              { value: '50+', label: 'Cities Covered', color: 'bg-warning/10 text-warning' },
              { value: '1000+', label: 'Happy Clients', color: 'bg-purple-100 text-purple-600' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-semibold text-primary tracking-tight">{stat.value}</p>
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featured.length > 0 && (
        <section className="py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Latest Listings</p>
                <h2 className="text-3xl md:text-4xl font-semibold text-primary tracking-tight">
                  Featured Properties
                </h2>
                <p className="mt-3 text-muted">
                  Explore our newest listings across Pakistan.
                </p>
              </div>
              <Link
                to="/properties"
                className="hidden md:flex items-center gap-2 text-sm font-medium bg-white px-5 py-2.5 rounded-full border border-border/50 text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorited={favoriteIds.has(property.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent"
              >
                View all properties <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Why EstateAI</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-primary tracking-tight">
                A smarter way to find home.
              </h2>
              <p className="mt-4 text-muted leading-relaxed max-w-md">
                We combine technology with real estate expertise to deliver an experience that is fast, reliable, and tailored to you.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: Sparkles,
                    title: 'AI-Powered Insights',
                    desc: 'Get intelligent property analysis, market trends, and personalized recommendations.',
                  },
                  {
                    icon: Shield,
                    title: 'Verified Listings',
                    desc: 'Every property and agent is verified to ensure accurate, trustworthy information.',
                  },
                  {
                    icon: Building2,
                    title: 'Seamless Experience',
                    desc: 'From search to close, enjoy a streamlined process designed for modern users.',
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                      <feature.icon size={18} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature image */}
            <div className="relative hidden lg:block">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <img src={heroInterior} alt="Modern interior" className="w-full h-[520px] object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl shadow-black/10 p-5 border border-border/30 max-w-[220px]">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  "Found my dream home in just 2 weeks. The AI recommendations were spot on."
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <img src={avatar3} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-[11px] font-medium text-muted">Ahmed R.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-primary tracking-tight">
              What our clients say
            </h2>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-7 border border-border/50 flex flex-col"
                >
                  <Quote size={20} className="text-accent/20 mb-4" />
                  <div className="flex items-center gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < t.rating ? 'fill-warning text-warning' : 'text-border'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-secondary leading-relaxed flex-1">{t.content}</p>
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border/50">
                    {t.User?.avatar_url ? (
                      <img src={t.User.avatar_url} alt={t.User.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent">
                        {t.User?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">{t.User?.name}</p>
                      <p className="text-xs text-muted">{t.User?.role}</p>
                    </div>
                    {user && t.User?.id === user.id && (
                      <button
                        onClick={() => handleDeleteReview(t.id)}
                        className="text-muted hover:text-red-500 transition-colors"
                        title="Delete your review"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No reviews yet. Be the first to share your experience!</p>
          )}

          {/* Review form / CTA */}
          <div className="mt-10 text-center">
            {user ? (
              userTestimonial ? (
                <p className="text-sm text-muted">You have already submitted a review.</p>
              ) : showReviewForm ? (
                <form onSubmit={handleSubmitReview} className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-border/50 text-left">
                  <p className="text-sm font-medium text-primary mb-3">Write a Review</p>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          size={22}
                          className={star <= reviewRating ? 'fill-warning text-warning' : 'text-border hover:text-warning/50'}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm text-secondary placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                  />
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowReviewForm(false); setReviewContent(''); setReviewRating(5); }}
                      className="text-sm text-muted hover:text-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Write a Review
                </button>
              )
            ) : (
              <Link to="/login" className="text-sm text-accent hover:underline">
                Sign in to leave a review
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative bg-primary rounded-3xl overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <img src={room2} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative px-8 py-20 md:px-16 text-center">
              <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
                Ready to find your place?
              </h2>
              <p className="mt-5 text-white/50 max-w-md mx-auto text-lg">
                Join thousands of buyers and agents already using EstateAI.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/properties"
                  className="bg-white text-primary px-8 py-3.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Browse Properties
                </Link>
                <Link
                  to="/register"
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Create an Account <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
