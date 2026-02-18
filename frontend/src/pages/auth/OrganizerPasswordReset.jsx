import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { requestOrganizerPasswordReset } from '../../api/auth';
import { KeyRound, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import './Login.css';

const OrganizerPasswordReset = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await requestOrganizerPasswordReset(formData);
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="success-icon"
            >
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            </motion.div>
            <h1>Request Submitted</h1>
            <p className="text-muted-foreground">
              Your password reset request has been sent to the admin team. You will be notified once it's reviewed.
            </p>
          </div>

          <div className="auth-footer">
            <Link to="/login/organizer" className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="flex items-center justify-center gap-3 mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1>Reset Password</h1>
          <p>Submit a password reset request to the admin team</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Your Login Email</label>
            <input
              id="email"
              type="email"
              placeholder="your.club@organizer.felicity.iiit.ac.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the login email assigned to your organizer account.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason for Reset</label>
            <textarea
              id="reason"
              placeholder="Please explain why you need a password reset (e.g., forgot password, security concern, etc.)"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum 500 characters
            </p>
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login/organizer" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrganizerPasswordReset;
