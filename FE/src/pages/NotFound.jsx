import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient">
      <div className="text-center animate-fade-in-up max-w-md">
        <div className="text-8xl font-bold text-accent/10 mb-2 tracking-tighter">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-semibold btn-primary"
          >
            <Home size={14} />
            Go Home
          </Link>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-secondary px-6 py-3 rounded-full text-sm font-semibold border border-border/60 bg-white hover:border-accent hover:text-accent transition-all"
          >
            <Search size={14} />
            Browse Properties
          </Link>
        </div>
      </div>
    </div>
  );
}
