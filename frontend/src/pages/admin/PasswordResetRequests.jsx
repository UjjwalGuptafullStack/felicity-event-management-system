import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { getPendingPasswordResets, approvePasswordReset, rejectPasswordReset } from '../../api/admin';
import { GradientButton } from '../../components/design-system/GradientButton';
import { KeyRound, LayoutDashboard, LogOut, CheckCircle, XCircle, Clock, Mail, Calendar, User, FileText } from 'lucide-react';

function PasswordResetRequests() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 8000);
  };

  const fetchRequests = async () => {
    try {
      const response = await getPendingPasswordResets();
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await approvePasswordReset(requestId);
      const tmp = response.data.temporaryPassword;
      setGeneratedPassword(tmp);
      showNotice('success', 'Request approved! See the temporary password below.');
      fetchRequests();
    } catch (error) {
      showNotice('error', error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectComment.trim()) {
      showNotice('error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await rejectPasswordReset(requestId, rejectComment.trim());
      showNotice('success', 'Request rejected and organizer notified.');
      setRejectingRequest(null);
      setRejectComment('');
      fetchRequests();
    } catch (error) {
      showNotice('error', error.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Password Reset Requests
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

      <div className="container mx-auto px-6 py-10 space-y-8 max-w-5xl">
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
              {notice.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
              <span>{notice.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated temporary password */}
        <AnimatePresence>
          {generatedPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-primary/25 rounded-xl p-5">
                <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Temporary Password Generated
                </p>
                <div className="bg-background rounded-lg px-4 py-3 border border-border mt-2 inline-block">
                  <span className="font-mono text-primary font-medium text-lg">{generatedPassword}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Share this with the user securely. It will expire after first use or on next change.</p>
                <button
                  onClick={() => setGeneratedPassword(null)}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Pending Reset Requests</h3>
              <p className="text-muted-foreground mt-1">
                {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting your review
              </p>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-16 text-center"
          >
            <CheckCircle className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-foreground mb-2">All Caught Up!</h4>
            <p className="text-muted-foreground">No pending password reset requests at the moment.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                {/* Card Header */}
                <div className="bg-muted/5 px-8 py-6 border-b border-border">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-bold text-foreground mb-2">
                          {request.organizer?.name || 'Unknown Organizer'}
                        </h4>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span className="text-sm truncate">{request.organizer?.loginEmail || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span className="text-sm">
                            {new Date(request.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-warning/10 text-warning border border-warning/20">
                        <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                        Pending Review
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-8 py-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <h5 className="text-sm font-semibold text-foreground uppercase tracking-wide">Reason for Reset</h5>
                    </div>
                    <div className="bg-muted/5 border border-border rounded-xl p-5">
                      <p className="text-foreground leading-relaxed">
                        {request.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    {rejectingRequest === request.id ? (
                      /* Rejection Comment Input */
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-destructive/5 border border-destructive/20 rounded-xl p-6"
                      >
                        <label className="block text-sm font-semibold text-foreground mb-3">
                          Reason for Rejection <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                          placeholder="Explain why this password reset request is being declined..."
                          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 resize-none"
                          rows={4}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {rejectComment.length}/500 characters • This message will be sent to the organizer
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleReject(request.id)}
                            className="flex-1 px-6 py-3 rounded-xl text-base font-semibold bg-destructive text-white hover:bg-destructive/90 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-5 h-5" />
                            Confirm Rejection
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setRejectingRequest(null);
                              setRejectComment('');
                            }}
                            className="px-6 py-3 rounded-xl text-base font-medium bg-muted/10 text-foreground hover:bg-muted/20 transition-all duration-300"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      /* Default Action Buttons */
                      <div className="flex items-center gap-4">
                        <GradientButton 
                          size="lg" 
                          variant="primary" 
                          onClick={() => handleApprove(request.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Approve & Generate Password
                        </GradientButton>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setRejectingRequest(request.id)}
                          className="flex-1 px-6 py-3 rounded-xl text-base font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-300 border border-destructive/20 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject Request
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordResetRequests;
