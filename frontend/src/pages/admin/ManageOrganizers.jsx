import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  createOrganizer,
  getOrganizers,
  disableOrganizer,
  enableOrganizer,
  deleteOrganizer,
  resetOrganizerPassword,
} from '../../api/admin';
import { GradientButton } from '../../components/design-system/GradientButton';
import {
  UserCog,
  LayoutDashboard,
  LogOut,
  UserPlus,
  Mail,
  Phone,
  Tags,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  ChevronDown,
  KeyRound,
  X,
} from 'lucide-react';

const initialFormState = {
  name: '',
  category: '',
  description: '',
  contactEmail: '',
  contactNumber: '',
};

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/20 transition-colors font-medium"
          >
            Cancel
          </motion.button>
          <GradientButton variant={danger ? 'secondary' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </GradientButton>
        </div>
      </motion.div>
    </div>
  );
}

function ManageOrganizers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [notice, setNotice] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [resetResult, setResetResult] = useState(null); // { organizerName, loginEmail, temporaryPassword }

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 6000);
  };

  const fetchOrganizers = async () => {
    try {
      const response = await getOrganizers();
      setOrganizers(response.data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
      showNotice('error', 'Failed to fetch organizers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrganizer = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    setCredentials(null);

    try {
      const response = await createOrganizer(formData);
      showNotice('success', response.data?.message || 'Organizer created successfully.');
      setCredentials(response.data?.credentials || null);
      setFormData(initialFormState);
      fetchOrganizers();
    } catch (error) {
      showNotice('error', error.response?.data?.message || 'Failed to create organizer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (organizer) => {
    const id = organizer.id || organizer._id;
    if (!id) return;
    try {
      if (organizer.isActive) {
        await disableOrganizer(id);
        showNotice('success', `${organizer.name} has been disabled.`);
      } else {
        await enableOrganizer(id);
        showNotice('success', `${organizer.name} has been re-enabled.`);
      }
      fetchOrganizers();
    } catch (error) {
      showNotice('error', error.response?.data?.message || 'Failed to update organizer status.');
    }
  };

  const confirmDelete = (organizer) => {
    setConfirmDialog({
      title: 'Permanently Delete Organizer',
      message: `Are you sure you want to permanently delete "${organizer.name}"? This cannot be undone.`,
      danger: true,
      confirmLabel: 'Delete Permanently',
      onConfirm: async () => {
        setConfirmDialog(null);
        const id = organizer.id || organizer._id;
        try {
          await deleteOrganizer(id);
          showNotice('success', `${organizer.name} has been permanently deleted.`);
          fetchOrganizers();
        } catch (error) {
          showNotice('error', error.response?.data?.message || 'Failed to delete organizer.');
        }
      },
    });
  };

  const handleResetPassword = (organizer) => {
    setConfirmDialog({
      title: 'Reset Password',
      message: `Generate a new password for "${organizer.name}"? The organizer will need to use the new password next time they log in.`,
      danger: false,
      confirmLabel: 'Reset Password',
      onConfirm: async () => {
        setConfirmDialog(null);
        const id = organizer.id || organizer._id;
        try {
          const response = await resetOrganizerPassword(id);
          setResetResult({
            organizerName: organizer.name,
            ...response.data.credentials
          });
        } catch (error) {
          showNotice('error', error.response?.data?.message || 'Failed to reset password.');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organizers...</p>
        </div>
      </div>
    );
  }

  const activeCount = organizers.filter((o) => o.isActive).length;
  const disabledCount = organizers.length - activeCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCog className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Manage Clubs / Organizers
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          danger={confirmDialog.danger}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Reset Password Result Modal */}
      <AnimatePresence>
        {resetResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setResetResult(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Password Reset</h3>
                </div>
                <button onClick={() => setResetResult(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground text-sm mb-5">
                New credentials for <strong className="text-foreground">{resetResult.organizerName}</strong>. Share these with the organizer.
              </p>
              <div className="space-y-3">
                <div className="bg-muted/10 border border-border rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Login Email</p>
                  <p className="font-mono text-primary font-medium break-all">{resetResult.loginEmail}</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">New Temporary Password</p>
                  <p className="font-mono text-primary text-lg font-bold tracking-widest">{resetResult.temporaryPassword}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Note this password now — it cannot be retrieved again after closing this dialog.
              </p>
              <div className="mt-5 flex justify-end">
                <GradientButton size="sm" onClick={() => setResetResult(null)}>Done</GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 py-10 space-y-8 max-w-6xl">
        {/* Notice */}
        <AnimatePresence>
          {notice && (
            <motion.div
              key="notice"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 border rounded-xl px-5 py-4 ${
                notice.type === 'success'
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
            >
              {notice.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{notice.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total', value: organizers.length, color: 'text-foreground', bg: 'bg-card' },
            { label: 'Active', value: activeCount, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Disabled', value: disabledCount, color: 'text-destructive', bg: 'bg-destructive/10' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} border border-border rounded-xl p-4 flex items-center gap-3`}>
              <Users className={`w-5 h-5 ${color}`} />
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Create Organizer Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Create New Club / Organizer</h3>
              <p className="text-xs text-muted-foreground">Login email and password are auto-generated and emailed to the contact address.</p>
            </div>
          </div>

          <form onSubmit={handleCreateOrganizer} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Organizer / Club Name <span className="text-destructive">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Felicity Tech Club"
                  className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <div className="relative">
                  <Tags className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a category…</option>
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Literary & Debate">Literary &amp; Debate</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Social & Volunteer">Social &amp; Volunteer</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Music & Fine Arts">Music &amp; Fine Arts</option>
                    <option value="Media & Photography">Media &amp; Photography</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Contact Email <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="organizer@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Credentials will be emailed to this address.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Contact Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short overview of the organizer or club"
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap pt-1">
              <GradientButton type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Organizer'}
              </GradientButton>
              <p className="text-xs text-muted-foreground">Login email is auto-generated from the organizer name.</p>
            </div>
          </form>

          {/* Credentials Banner */}
          {credentials && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <div className="mx-6 mb-6 rounded-xl border border-primary/25 bg-primary/10 p-5">
                <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Generated Credentials
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-card rounded-lg px-4 py-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Login Email</p>
                    <p className="text-primary font-mono font-medium break-all">{credentials.loginEmail}</p>
                  </div>
                  <div className="bg-card rounded-lg px-4 py-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Temporary Password</p>
                    <p className="text-primary font-mono font-medium">{credentials.temporaryPassword}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  These credentials have been emailed to the organizer's contact address. Share them again if needed.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Organizer Directory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                <UserCog className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Club / Organizer Directory</h3>
                <p className="text-xs text-muted-foreground">Enable, disable, or permanently remove accounts.</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{organizers.length} total</span>
          </div>

          {organizers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UserCog className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No organizers yet. Create one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Login Email</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((organizer, index) => (
                    <motion.tr
                      key={organizer.id || organizer._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{organizer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(organizer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{organizer.category || '—'}</td>
                      <td className="py-4 px-4">
                        <p className="text-foreground">{organizer.contactEmail}</p>
                        {organizer.contactNumber && (
                          <p className="text-xs text-muted-foreground">{organizer.contactNumber}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs text-muted-foreground break-all">{organizer.loginEmail || '—'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          organizer.isActive
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${organizer.isActive ? 'bg-primary' : 'bg-destructive'}`} />
                          {organizer.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <GradientButton
                            size="sm"
                            variant={organizer.isActive ? 'secondary' : 'primary'}
                            onClick={() => handleToggleStatus(organizer)}
                          >
                            {organizer.isActive ? 'Disable' : 'Enable'}
                          </GradientButton>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleResetPassword(organizer)}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Reset password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => confirmDelete(organizer)}
                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Permanently delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ManageOrganizers;
