import { useState, useEffect, useRef } from 'react';
import { MapPin, User } from 'lucide-react';
import api from '../lib/api';

export default function LocationAutocomplete({ value, onChange, onSelect, onEnter, placeholder = 'Search by location or agent...', className = '', inputClassName = '' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || !value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      api.get('/properties/suggestions', { params: { q: value.trim() } })
        .then((res) => {
          setSuggestions(res.data.suggestions || []);
          setOpen(true);
          setHighlighted(-1);
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  const select = (suggestion) => {
    setOpen(false);
    setSuggestions([]);
    onSelect(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (open && highlighted >= 0) {
        e.preventDefault();
        select(suggestions[highlighted]);
      } else {
        setOpen(false);
        if (onEnter) onEnter();
      }
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => (h < suggestions.length - 1 ? h + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => (h > 0 ? h - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const highlightMatch = (text) => {
    if (!value || !value.trim()) return text;
    const idx = text.toLowerCase().indexOf(value.trim().toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + value.trim().length);
    const after = text.slice(idx + value.trim().length);
    return <>{before}<span className="font-semibold text-primary">{match}</span>{after}</>;
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder={placeholder}
        className={inputClassName}
      />
      {open && value && value.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border/50 shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">Not found</div>
          ) : (
            suggestions.map((s, i) => (
              <button
                key={`${s.type}-${s.text}`}
                type="button"
                onMouseDown={() => select(s)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                  i === highlighted ? 'bg-surface text-primary' : 'text-secondary hover:bg-surface/50'
                }`}
              >
                {s.type === 'agent' ? (
                  <User size={14} className="text-muted flex-shrink-0" />
                ) : (
                  <MapPin size={14} className="text-muted flex-shrink-0" />
                )}
                <span className="flex-1">{highlightMatch(s.text)}</span>
                <span className="text-xs text-muted">{s.type === 'agent' ? 'Agent' : 'Location'}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
