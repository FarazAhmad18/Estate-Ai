import { Link } from 'react-router-dom';
import { Sparkles, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-primary text-white overflow-hidden">
      {/* Decorative gradient mesh */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top CTA Strip */}
        <div className="py-10 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">Stay updated with the latest listings</h3>
              <p className="mt-1.5 text-sm text-white/50">Get notified about new properties in your preferred areas.</p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors flex-shrink-0 shadow-lg shadow-black/10"
            >
              Join Now <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Estate<span className="text-accent-light">AI</span>
              </span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              Discover your perfect property with AI-powered insights and a seamless experience across Pakistan.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin size={13} />
                <span>Lahore, Pakistan</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-5">Explore</h4>
            <div className="space-y-3.5">
              <Link to="/properties" className="block text-sm text-white/60 hover:text-white transition-colors">Properties</Link>
              <Link to="/properties?purpose=Sale" className="block text-sm text-white/60 hover:text-white transition-colors">Buy</Link>
              <Link to="/properties?purpose=Rent" className="block text-sm text-white/60 hover:text-white transition-colors">Rent</Link>
              <Link to="/register" className="block text-sm text-white/60 hover:text-white transition-colors">Become an Agent</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-5">Company</h4>
            <div className="space-y-3.5">
              <span className="block text-sm text-white/60">About</span>
              <span className="block text-sm text-white/60">Careers</span>
              <span className="block text-sm text-white/60">Contact</span>
              <span className="block text-sm text-white/60">Blog</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-5">Contact</h4>
            <div className="space-y-3.5">
              <a href="mailto:hello@estateai.pk" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <Mail size={13} />
                hello@estateai.pk
              </a>
              <a href="tel:+923001234567" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <Phone size={13} />
                +92 300 123 4567
              </a>
            </div>
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Legal</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-white/60">Privacy Policy</span>
                <span className="block text-sm text-white/60">Terms of Service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} EstateAI. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Made with care in Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
