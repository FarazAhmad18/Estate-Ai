import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Mail, Phone, Shield, Lock, Trash2, X, Eye, EyeOff, Calendar } from 'lucide-react';
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

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-semibold text-primary tracking-tight mb-2">My Profile</h1>
        <p className="text-sm text-muted mb-10">Manage your account details.</p>

        {/* Profile Card */}
        <div className="bg-surface rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-muted" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                <Camera size={15} />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Shield size={12} className="text-accent" />
                <span className="text-sm text-muted">{user?.role}</span>
              </div>
              {uploadingAvatar && <p className="text-xs text-accent mt-2">Uploading avatar...</p>}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <div className="bg-surface rounded-xl p-5 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted">Email</p>
                <p className="text-sm font-medium text-primary truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Phone size={16} className="text-muted" />
              </div>
              <div>
                <p className="text-xs text-muted">Phone</p>
                <p className="text-sm font-medium text-primary">{user?.phone || 'Not set'}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Calendar size={16} className="text-muted" />
              </div>
              <div>
                <p className="text-xs text-muted">Member Since</p>
                <p className="text-sm font-medium text-primary">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-5">Edit Details</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors"
                placeholder="+92 300 1234567"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password — hidden for Google users */}
        {!isGoogle && <div className="mt-12 pt-8 border-t border-border/50">
          <button
            type="button"
            onClick={() => { setShowChangePw(!showChangePw); if (showChangePw) setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
            className="flex items-center gap-2 text-lg font-semibold text-primary hover:text-accent transition-colors"
          >
            <Lock size={18} />
            Change Password
            <span className="text-sm font-normal text-muted ml-1">{showChangePw ? '(hide)' : '(click to expand)'}</span>
          </button>
          {showChangePw && (
          <form onSubmit={handleChangePassword} className="space-y-5 mt-5">
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={pwForm.newPassword} />
              <PasswordRequirements password={pwForm.newPassword} />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-accent transition-colors pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={changingPw || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword || pwForm.newPassword !== pwForm.confirmPassword}
              className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
          )}
        </div>}

        {/* Delete Account */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-muted mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-200 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-primary">Delete Account</h3>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setShowDeletePw(false); }}
                className="text-muted hover:text-secondary"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted mb-6">
              This will permanently delete your account, properties, favorites, and all associated data.
              {isGoogle ? ' Type DELETE to confirm.' : ' Enter your password to confirm.'}
            </p>
            <div className="relative mb-6">
              <input
                type={isGoogle ? 'text' : (showDeletePw ? 'text' : 'password')}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={isGoogle ? 'Type DELETE to confirm' : 'Enter your password'}
                className="w-full px-4 py-3 bg-surface rounded-xl text-sm border border-border/50 focus:border-red-400 transition-colors pr-10"
              />
              {!isGoogle && <button
                type="button"
                onClick={() => setShowDeletePw(!showDeletePw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
              >
                {showDeletePw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setShowDeletePw(false); }}
                className="flex-1 px-4 py-3 bg-surface text-secondary rounded-xl text-sm font-medium border border-border/50 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={(isGoogle ? deletePassword !== 'DELETE' : !deletePassword) || deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
