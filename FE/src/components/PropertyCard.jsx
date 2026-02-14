import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Maximize, ArrowUpRight, Heart } from 'lucide-react';

export default function PropertyCard({ property, isFavorited, onToggleFavorite }) {
  const formatPrice = (price) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)} Lac`;
    return price.toLocaleString();
  };

  return (
    <Link
      to={`/properties/${property.id}`}
      className="group block bg-white rounded-2xl border border-border/60 overflow-hidden hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[4/3] bg-surface overflow-hidden relative">
        {property.PropertyImages?.[0]?.image_url ? (
          <img
            src={property.PropertyImages[0].image_url}
            alt={property.location}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted bg-gradient-to-br from-surface to-surface-2">
            <Maximize size={32} />
          </div>
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-secondary px-2.5 py-1 rounded-full shadow-sm">
            {property.type}
          </span>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${
            property.purpose === 'Sale'
              ? 'bg-accent/90 text-white'
              : 'bg-success/90 text-white'
          }`}>
            For {property.purpose}
          </span>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(property.id);
            }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
              isFavorited
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white/95 backdrop-blur-sm text-secondary hover:bg-white hover:scale-110'
            }`}
          >
            <Heart
              size={15}
              className={isFavorited ? 'fill-white text-white' : ''}
            />
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xl font-bold text-primary tracking-tight">
              PKR {formatPrice(property.price)}
              {property.purpose === 'Rent' && <span className="text-sm font-normal text-muted ml-0.5">/mo</span>}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-muted">
              <MapPin size={13} className="flex-shrink-0" />
              <span className="text-sm truncate">{property.location}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300 flex-shrink-0">
            <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform duration-300" />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/40">
          {property.bedrooms && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <BedDouble size={14} className="text-accent/60" />
              <span>{property.bedrooms} Beds</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Maximize size={14} className="text-accent/60" />
            <span>{property.area?.toLocaleString()} sq ft</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
