import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Mail, Phone, Shield, Lock, Trash2, X, Eye, EyeOff, Calendar, AlertTriangle, ChevronDown } from 'lucide-react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import PasswordRequirements from '../components/PasswordRequirements';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function BuyerProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', profile);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/profile/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const isGoogle = user?.isGoogleUser;

  const handleDeleteAccount = async () => {
    if (isGoogle ? deletePassword !== 'DELETE' : !deletePassword) return;
    setDeleting(true);
    try {
      await api.delete('/profile', { data: isGoogle ? { confirmText: deletePassword } : { password: deletePassword } });
      logout();
      setShowDeleteModal(false);
      toast.success('Account deleted successfully', { duration: 3000 });
      await new Promise((r) => setTimeout(r, 2500));
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.put('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen pt-24 pb-16 mesh-gradient">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8 animate-fade-in-up">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Account</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-muted">Manage your account details and preferences.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6 border border-border/50 shadow-sm animate-fade-in-up stagger-1">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full gradient-accent flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-white">{userInitial}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-white text-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-surface transition-colors shadow-lg border border-border/50">
                <Camera size={15} />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">{user?.name}</h2>
              <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-accent/90 px-2.5 py-0.5 rounded-full">
                {user?.role}
              </span>
              {uploadingAvatar && <p className="text-xs text-accent mt-2">Uploading avatar...</p>}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up stagger-2">
          <div className="bg-white rounded-2xl p-5 border border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted uppercase tracking-wider font-medium">Email</p>
                <p className="text-sm font-semibold text-primary truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-medium">Phone</p>
                <p className="text-sm font-semibold text-primary">{user?.phone || 'Not set'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-medium">Member Since</p>
                <p className="text-sm font-semibold text-primary">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border/50 mb-6 animate-fade-in-up stagger-3">
          <h3 className="text-base font-bold text-primary mb-6">Edit Details</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3.5 bg-surface-2 rounded-xl text-sm border border-border/40 text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-2">Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                placeholder="+92 300 1234567"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="text-white px-8 py-3 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        {!isGoogle && (
          <div className="bg-white rounded-2xl border border-border/50 mb-6 overflow-hidden animate-fade-in-up stagger-4">
            <button
              type="button"
              onClick={() => { setShowChangePw(!showChangePw); if (showChangePw) setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
              className="flex items-center justify-between w-full px-6 sm:px-8 py-5 hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Lock size={16} className="text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-primary">Change Password</p>
                  <p className="text-xs text-muted">Update your account password</p>
                </div>
              </div>
              <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${showChangePw ? 'rotate-180' : ''}`} />
            </button>
            {showChangePw && (
              <form onSubmit={handleChangePassword} className="px-6 sm:px-8 pb-6 space-y-5 border-t border-border/40 pt-5">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all pr-12"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all pr-12"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwForm.newPassword && (
                    <div className="mt-3 space-y-2">
                      <PasswordStrengthIndicator password={pwForm.newPassword} />
                      <PasswordRequirements password={pwForm.newPassword} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      required
                      className={`w-full px-4 py-3.5 bg-surface rounded-xl text-sm border transition-all pr-12 ${
                        pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                          ? 'border-danger focus:ring-danger/10'
                          : 'border-border/60 focus:border-accent focus:ring-2 focus:ring-accent/10'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="mt-1.5 text-xs text-danger">Passwords do not match</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={changingPw || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword || pwForm.newPassword !== pwForm.confirmPassword}
                  className="text-white px-8 py-3 rounded-xl text-sm font-semibold btn-primary disabled:opacity-50"
                >
                  {changingPw ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Delete Account */}
        <div className="bg-white rounded-2xl border border-red-200/60 p-6 sm:p-8 animate-fade-in-up stagger-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-danger">Danger Zone</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-red-50 text-danger rounded-xl text-sm font-semibold border border-red-200 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setShowDeletePw(false); }} />
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl shadow-black/10 animate-scale-in">
            <button
              onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setShowDeletePw(false); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-secondary hover:bg-surface transition-all"
            >
              <X size={16} />
            </button>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={20} className="text-danger" />
            </div>
            <h3 className="text-lg font-bold text-primary">Delete Account</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              This will permanently delete your account, properties, favorites, and all associated data.
              {isGoogle ? ' Type DELETE to confirm.' : ' Enter your password to confirm.'}
            </p>
            <div className="relative mt-5">
              <input
                type={isGoogle ? 'text' : (showDeletePw ? 'text' : 'password')}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={isGoogle ? 'Type DELETE to confirm' : 'Enter your password'}
                className="w-full px-4 py-3.5 bg-surface rounded-xl text-sm border border-border/60 focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-all pr-12"
              />
              {!isGoogle && <button
                type="button"
                onClick={() => setShowDeletePw(!showDeletePw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
              >
                {showDeletePw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setShowDeletePw(false); }}
                className="flex-1 px-4 py-3 bg-surface text-secondary rounded-xl text-sm font-semibold hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={(isGoogle ? deletePassword !== 'DELETE' : !deletePassword) || deleting}
                className="flex-1 px-4 py-3 bg-danger text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm shadow-danger/20"
              >
                {deleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </div>
                ) : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
