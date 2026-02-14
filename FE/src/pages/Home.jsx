import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Building2, Shield, Sparkles, MapPin, Star, Quote, Trash2, TrendingUp, Users, Home as HomeIcon, CheckCircle, Bot, PenTool, MessageSquare, Zap } from 'lucide-react';
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
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 lg:min-h-screen lg:pt-16 lg:flex lg:items-center overflow-hidden">
        {/* Background mesh gradient */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/[0.03] rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/[0.08] rounded-full text-xs font-semibold text-accent mb-6 border border-accent/10">
                <Sparkles size={12} />
                AI-Powered Real Estate Platform
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold tracking-tight text-primary leading-[1.08]">
                Find your next
                <br />
                <span className="gradient-text">perfect place.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-muted max-w-md leading-relaxed">
                Discover properties across Pakistan with intelligent search, verified listings, and a seamless experience.
              </p>

              <form onSubmit={handleSearch} className="mt-8 max-w-md">
                <div className="flex items-center bg-white rounded-full p-1.5 border border-border/60 shadow-lg shadow-black/[0.04]">
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
                    className="text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 flex-shrink-0 btn-primary"
                  >
                    <Search size={14} />
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-5 flex items-center gap-4 text-sm text-muted">
                <span className="font-medium">Popular:</span>
                {['Lahore', 'Islamabad', 'Karachi'].map((city) => (
                  <Link
                    key={city}
                    to={`/properties?location=${city}`}
                    className="hover:text-accent transition-colors px-3 py-1 rounded-full bg-surface hover:bg-accent/5 border border-transparent hover:border-accent/20 text-xs font-medium"
                  >
                    {city}
                  </Link>
                ))}
              </div>

              {/* Trust bar */}
              <div className="mt-10 flex items-center gap-6 animate-fade-in-up stagger-2">
                <div className="flex -space-x-2.5">
                  {[avatar1, avatar2, avatar3, avatar4].map((av, i) => (
                    <img
                      key={i}
                      src={av}
                      alt=""
                      className="w-10 h-10 rounded-full border-[2.5px] border-white object-cover shadow-sm"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-warning text-warning" />
                    ))}
                    <span className="text-sm font-bold text-primary ml-1">4.9</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">Trusted by 1,000+ happy clients</p>
                </div>
              </div>

              {/* USP Feature Pills */}
              <div className="mt-8 flex flex-wrap gap-2.5 animate-fade-in-up stagger-3">
                {[
                  { icon: Bot, text: 'AI Chatbot Search', color: 'text-accent bg-accent/[0.07] border-accent/15' },
                  { icon: Sparkles, text: 'AI Listing Writer', color: 'text-violet-600 bg-violet-500/[0.07] border-violet-500/15' },
                  { icon: Building2, text: 'Smart Similar Listings', color: 'text-emerald-600 bg-emerald-500/[0.07] border-emerald-500/15' },
                ].map((usp) => (
                  <div key={usp.text} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border ${usp.color}`}>
                    <usp.icon size={13} />
                    {usp.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Image collage */}
            <div className="relative hidden lg:block animate-fade-in stagger-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-black/5">
                    <img src={heroInterior} alt="Modern interior" className="w-full h-72 object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg shadow-black/5 ring-1 ring-black/5">
                    <img src={room1} alt="Living room" className="w-full h-48 object-cover" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg shadow-black/5 ring-1 ring-black/5">
                    <img src={heroExterior} alt="House exterior" className="w-full h-48 object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-black/5">
                    <img src={room2} alt="Luxury room" className="w-full h-72 object-cover" />
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute -left-6 bottom-24 bg-white rounded-2xl shadow-xl shadow-black/8 p-4 border border-border/50 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Building2 size={16} className="text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">500+</p>
                    <p className="text-[11px] text-muted">Properties Listed</p>
                  </div>
                </div>
              </div>

              {/* Second floating card */}
              <div className="absolute -right-3 top-12 bg-white rounded-2xl shadow-xl shadow-black/8 p-4 border border-border/50 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">98%</p>
                    <p className="text-[11px] text-muted">Satisfaction Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Gallery */}
      <section className="py-20 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Gallery</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">
                Explore stunning spaces
              </h2>
              <p className="mt-2 text-muted text-sm sm:text-base max-w-lg">
                From modern apartments to luxury villas, find a home that matches your lifestyle.
              </p>
            </div>
            <Link
              to="/properties"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline underline-offset-4"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="flex gap-4 px-4 sm:px-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {[
            { img: room3, label: 'Luxury Living', tag: 'Featured' },
            { img: room4, label: 'Modern Design', tag: 'Popular' },
            { img: room5, label: 'Cozy Spaces', tag: 'New' },
            { img: room6, label: 'Contemporary', tag: 'Trending' },
            { img: room1, label: 'Elegant Decor', tag: 'Premium' },
            { img: room2, label: 'Premium Finish', tag: 'Exclusive' },
          ].map((item, i) => (
            <Link
              to="/properties"
              key={i}
              className="flex-shrink-0 group relative w-64 sm:w-72 h-80 rounded-2xl overflow-hidden snap-start"
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full">
                  {item.tag}
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-white/60 text-xs mt-0.5">Explore collection</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: '500+', label: 'Properties Listed', icon: Building2, bg: 'bg-blue-600' },
              { value: '200+', label: 'Verified Agents', icon: Users, bg: 'bg-emerald-600' },
              { value: '50+', label: 'Cities Covered', icon: HomeIcon, bg: 'bg-amber-500' },
              { value: '1000+', label: 'Happy Clients', icon: CheckCircle, bg: 'bg-purple-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 sm:p-8 border border-border/50 text-center hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/10`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">{stat.value}</p>
                <p className="mt-1.5 text-xs sm:text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featured.length > 0 && (
        <section className="py-20 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Latest Listings</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">
                  Featured Properties
                </h2>
                <p className="mt-2 text-muted text-sm sm:text-base">
                  Explore our newest listings across Pakistan.
                </p>
              </div>
              <Link
                to="/properties"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold bg-white px-5 py-2.5 rounded-full border border-border/60 text-secondary hover:border-accent hover:text-accent transition-all hover:shadow-md hover:shadow-accent/10"
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

            <div className="mt-10 text-center sm:hidden">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent"
              >
                View all properties <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* AI Features Banner */}
      <section className="py-12 sm:py-14 bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/[0.08] rounded-full text-xs font-semibold text-accent mb-4 border border-accent/10">
              <Sparkles size={12} />
              Powered by AI
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">
              Smarter real estate with <span className="gradient-text">artificial intelligence</span>
            </h2>
            <p className="mt-3 text-muted max-w-lg mx-auto text-sm sm:text-base">
              Our AI features help you find properties faster and help agents create better listings — all built into the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Chatbot Card */}
            <div className="relative group bg-white rounded-3xl border border-border/50 p-8 sm:p-10 overflow-hidden hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-accent/[0.07] to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-violet-500 flex items-center justify-center shadow-lg shadow-accent/20">
                    <Bot size={22} className="text-white" />
                  </div>
                  <div className="px-2.5 py-1 bg-accent/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-accent">
                    For Everyone
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3">AI Property Assistant</h3>
                <p className="text-muted text-sm leading-relaxed mb-6">
                  Ask our AI chatbot in plain language — "Find me a 3-bedroom house in Lahore under 1 crore" — and get instant results from our listings. No filters, no forms, just conversation.
                </p>
                <div className="space-y-3">
                  {[
                    'Natural language property search',
                    'Instant answers about real estate',
                    'Property cards right in the chat',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-secondary">
                      <CheckCircle size={15} className="text-accent flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex items-center gap-3 bg-surface rounded-2xl p-4 border border-border/40">
                  <div className="flex items-center gap-2 flex-1 text-sm text-muted">
                    <MessageSquare size={14} className="text-accent" />
                    "Show me villas for rent in Islamabad"
                  </div>
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={14} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Description Generator Card */}
            <div className="relative group bg-white rounded-3xl border border-border/50 p-8 sm:p-10 overflow-hidden hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/[0.07] to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <PenTool size={22} className="text-white" />
                  </div>
                  <div className="px-2.5 py-1 bg-violet-500/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    For Agents
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3">AI Description Writer</h3>
                <p className="text-muted text-sm leading-relaxed mb-6">
                  Stop struggling with listing descriptions. Just fill in your property details and let AI craft a professional, compelling description in seconds. One click, done.
                </p>
                <div className="space-y-3">
                  {[
                    'Professional descriptions in one click',
                    'Tailored to the Pakistani market',
                    'Save hours on every listing',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-secondary">
                      <CheckCircle size={15} className="text-violet-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex items-center gap-4 bg-surface rounded-2xl p-4 border border-border/40">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-violet-500" />
                    <span className="text-sm text-muted">Property details</span>
                  </div>
                  <ArrowRight size={14} className="text-muted" />
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-violet-500" />
                    <span className="text-sm text-secondary font-medium">Polished description</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendations Card */}
            <div className="relative group bg-white rounded-3xl border border-border/50 p-8 sm:p-10 overflow-hidden hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/[0.07] to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp size={22} className="text-white" />
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-500/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    For Buyers
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3">Smart Recommendations</h3>
                <p className="text-muted text-sm leading-relaxed mb-6">
                  Every listing shows you similar properties matched by type, location, and budget — so you never miss a better deal hiding in plain sight.
                </p>
                <div className="space-y-3">
                  {[
                    'Matched by type, area & price',
                    'Discover alternatives instantly',
                    'No sign-up required',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-secondary">
                      <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link to="/properties" className="mt-8 flex items-center gap-3 bg-surface rounded-2xl p-4 border border-border/40 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-2 flex-1 text-sm text-muted">
                    <Building2 size={14} className="text-emerald-500" />
                    Browse and see recommendations
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={14} className="text-white" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24 mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Why EstateAI</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">
                A smarter way to
                <br />
                <span className="gradient-text">find home.</span>
              </h2>
              <p className="mt-4 text-muted leading-relaxed max-w-md text-sm sm:text-base">
                We combine technology with real estate expertise to deliver an experience that is fast, reliable, and tailored to you.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  {
                    icon: Sparkles,
                    title: 'AI-Powered Insights',
                    desc: 'Get intelligent property analysis, market trends, and personalized recommendations.',
                    bg: 'bg-blue-600',
                  },
                  {
                    icon: Shield,
                    title: 'Verified Listings',
                    desc: 'Every property and agent is verified to ensure accurate, trustworthy information.',
                    bg: 'bg-emerald-600',
                  },
                  {
                    icon: Building2,
                    title: 'Seamless Experience',
                    desc: 'From search to close, enjoy a streamlined process designed for modern users.',
                    bg: 'bg-purple-600',
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-sm transition-all duration-200 group">
                    <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <feature.icon size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature image */}
            <div className="relative hidden lg:block">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-black/5">
                <img src={heroInterior} alt="Modern interior" className="w-full h-[520px] object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl shadow-black/8 p-5 border border-border/40 max-w-[240px]">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  "Found my dream home in just 2 weeks. The AI recommendations were spot on."
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <img src={avatar3} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-white" />
                  <div>
                    <span className="text-[11px] font-semibold text-primary">Ahmed R.</span>
                    <span className="text-[10px] text-muted block">Verified Buyer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">
              What our clients say
            </h2>
            <p className="mt-3 text-muted max-w-md mx-auto text-sm sm:text-base">
              Real stories from real people who found their dream properties with EstateAI.
            </p>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-border/50 flex flex-col hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-center gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < t.rating ? 'fill-warning text-warning' : 'text-border'}
                      />
                    ))}
                  </div>
                  <Quote size={24} className="text-accent/10 mb-3" />
                  <p className="text-sm text-secondary leading-relaxed flex-1">{t.content}</p>
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border/40">
                    {t.User?.avatar_url ? (
                      <img src={t.User.avatar_url} alt={t.User.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-surface" />
                    ) : (
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-white">
                        {t.User?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary">{t.User?.name}</p>
                      <p className="text-xs text-muted capitalize">{t.User?.role}</p>
                    </div>
                    {user && t.User?.id === user.id && (
                      <button
                        onClick={() => handleDeleteReview(t.id)}
                        className="text-muted hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
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
            <div className="text-center py-16 bg-surface rounded-2xl border border-border/50">
              <Quote size={32} className="mx-auto text-muted/30 mb-3" />
              <p className="text-muted">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}

          {/* Review form / CTA */}
          <div className="mt-10 text-center">
            {user ? (
              userTestimonial ? (
                <p className="text-sm text-muted">You have already submitted a review.</p>
              ) : showReviewForm ? (
                <form onSubmit={handleSubmitReview} className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-border/50 text-left shadow-lg shadow-black/[0.04]">
                  <p className="text-sm font-semibold text-primary mb-3">Write a Review</p>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none p-0.5"
                      >
                        <Star
                          size={24}
                          className={star <= reviewRating ? 'fill-warning text-warning' : 'text-border hover:text-warning/50 transition-colors'}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full border border-border/60 rounded-xl px-4 py-3 text-sm text-secondary placeholder:text-muted focus:border-accent resize-none transition-colors"
                  />
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="text-white px-6 py-2.5 rounded-full text-sm font-semibold btn-primary disabled:opacity-50"
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
                  className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-semibold btn-primary"
                >
                  Write a Review
                </button>
              )
            ) : (
              <Link to="/login" className="text-sm text-accent font-medium hover:underline underline-offset-4">
                Sign in to leave a review
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Become an Agent CTA */}
      <section className="py-20 sm:py-24 mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative bg-white rounded-3xl border border-border/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-72 h-72 bg-accent/[0.04] rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-500/[0.04] rounded-full blur-[80px]" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center">
              <div className="px-8 sm:px-12 py-12 sm:py-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/[0.08] rounded-full text-xs font-semibold text-accent mb-5 border border-accent/10">
                  <Users size={12} />
                  For Real Estate Professionals
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">
                  Become an agent on <span className="gradient-text">EstateAI</span>
                </h2>
                <p className="mt-4 text-muted text-sm sm:text-base leading-relaxed max-w-md">
                  List your properties, reach thousands of buyers, and let AI write your descriptions. Join a growing network of verified agents across Pakistan.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Building2, text: 'List unlimited properties' },
                    { icon: Sparkles, text: 'AI-powered descriptions' },
                    { icon: MessageSquare, text: 'Direct buyer messaging' },
                    { icon: TrendingUp, text: 'Dashboard & analytics' },
                  ].map((perk) => (
                    <div key={perk.text} className="flex items-center gap-2.5 text-sm text-secondary">
                      <div className="w-8 h-8 rounded-lg bg-accent/[0.08] flex items-center justify-center flex-shrink-0">
                        <perk.icon size={14} className="text-accent" />
                      </div>
                      {perk.text}
                    </div>
                  ))}
                </div>
                <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link
                    to="/register"
                    className="text-white px-8 py-3.5 rounded-full text-sm font-semibold btn-primary flex items-center gap-2"
                  >
                    Register as Agent <ArrowRight size={14} />
                  </Link>
                  <span className="text-xs text-muted">Free to join. No hidden fees.</span>
                </div>
              </div>

              <div className="hidden lg:block relative h-full min-h-[420px]">
                <img src={heroExterior} alt="List your property" className="absolute inset-0 w-full h-full object-cover rounded-r-3xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent rounded-r-3xl" />
                <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-black/8 p-5 border border-border/40 max-w-[220px]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle size={18} className="text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">200+</p>
                      <p className="text-[11px] text-muted">Active Agents</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">Join verified agents already growing with EstateAI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative gradient-hero rounded-3xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-10">
              <img src={room2} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />

            <div className="relative px-6 py-16 sm:px-12 sm:py-20 md:px-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-white/70 mb-6 border border-white/10">
                <Sparkles size={12} />
                Join EstateAI Today
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight">
                Ready to find your place?
              </h2>
              <p className="mt-4 sm:mt-5 text-white/40 max-w-md mx-auto text-sm sm:text-lg">
                Join thousands of buyers and agents already using EstateAI.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/properties"
                  className="bg-white text-primary px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-all shadow-lg shadow-black/10 hover:shadow-xl"
                >
                  Browse Properties
                </Link>
                <Link
                  to="/register"
                  className="text-white/60 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
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
