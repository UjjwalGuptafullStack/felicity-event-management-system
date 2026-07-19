import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { resetPassword } from '../../api/auth';
import { KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const actorType = searchParams.get('actorType') === 'organizer' ? 'organizer' : 'participant';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginPath = actorType === 'organizer' ? '/login/organizer' : '/login/participant';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, actorType, newPassword });
      setSuccess(true);
      setTimeout(() => navigate(loginPath, { replace: true }), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="success-icon">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            </motion.div>
            <h1>Password Updated</h1>
            <p className="text-muted-foreground">Redirecting you to log in…</p>
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
          <h1>Set a New Password</h1>
          <p>Choose a new password for your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to={loginPath} className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
