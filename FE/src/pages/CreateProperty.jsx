import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ImagePlus, ArrowLeft, Plus, Sparkles, Loader2 } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TYPES = ['House', 'Apartment', 'Villa', 'Commercial', 'Land'];
const PURPOSES = ['Sale', 'Rent'];

export default function CreateProperty() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'House',
    purpose: 'Sale',
    price: '',
    location: '',
    bedrooms: '',
    area: '',
    description: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const canGenerateAI = form.type && form.price;

  const handleGenerateDescription = async () => {
    if (!canGenerateAI) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/generate-description', {
        type: form.type,
        purpose: form.purpose,
        price: form.price,
        location: form.location,
        bedrooms: form.bedrooms,
        area: form.area,
      });
      update('description', res.data.description);
      toast.success('Description generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate description');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.price || !form.location || !form.area || !form.description) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/properties', {
        ...form,
        price: parseFloat(form.price),
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        area: parseFloat(form.area),
      });

      const propertyId = res.data.property.id;

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append('images', img.file));
        await api.post(`/properties/${propertyId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Property created!');
      navigate(`/properties/${propertyId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 mesh-gradient">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 animate-fade-in-up">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">New Listing</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Create Listing</h1>
          <p className="mt-1 text-sm text-muted">Add a new property to your portfolio.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images */}
          <div className="bg-white rounded-2xl border border-border/50 p-6">
            <label className="block text-xs font-semibold text-secondary mb-3">Photos</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-white/90 px-2 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              {images.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                  <ImagePlus size={20} className="text-muted" />
                  <span className="text-[10px] text-muted mt-1 font-medium">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageAdd}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="mt-3 text-[11px] text-muted">{images.length}/10 photos added. First photo will be the cover.</p>
          </div>

          {/* Type & Purpose */}
          <div className="bg-white rounded-2xl border border-border/50 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-3">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => update('type', type)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        form.type === type
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-surface text-secondary border border-border/50 hover:border-accent/30'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-3">Purpose</label>
                <div className="flex gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update('purpose', p)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                        form.purpose === p
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-surface text-secondary border border-border/50 hover:border-accent/30'
                      }`}
                    >
                      For {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-2">
                  Price (PKR) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted"
                  placeholder="e.g. 15000000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary mb-2">
                  Area (sq ft) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={form.area}
                  onChange={(e) => update('area', e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted"
                  placeholder="e.g. 2500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-secondary mb-2">
                  Location <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted"
                  placeholder="e.g. DHA Phase 5, Lahore"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary mb-2">Bedrooms</label>
                <input
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => update('bedrooms', e.target.value)}
                  className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted"
                  placeholder="e.g. 4"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-secondary">
                  Description <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={!canGenerateAI || aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-500 to-accent text-white hover:shadow-md hover:shadow-accent/20"
                  title={!canGenerateAI ? 'Fill in type and price first' : 'Generate description with AI'}
                >
                  {aiLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {aiLoading ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-none placeholder:text-muted"
                placeholder="Describe the property in detail..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="text-white px-8 py-3.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <><Plus size={16} /> Create Listing</>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm text-muted hover:text-secondary transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
