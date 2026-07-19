import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { forgotPassword } from '../../api/auth';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import './Login.css';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const initialActorType = searchParams.get('actorType') === 'organizer' ? 'organizer' : 'participant';

  const [actorType, setActorType] = useState(initialActorType);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email, actorType });
      setSuccess(true);
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
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="success-icon">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            </motion.div>
            <h1>Check Your Email</h1>
            <p className="text-muted-foreground">
              If an account with that email exists, we've sent a password reset link. It expires in 1 hour.
            </p>
          </div>
          <div className="auth-footer">
            <Link to={actorType === 'organizer' ? '/login/organizer' : '/login/participant'} className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors">
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
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>I am a</label>
            <div className="college-options">
              <label className="college-option">
                <input
                  type="checkbox"
                  checked={actorType === 'participant'}
                  onChange={() => setActorType('participant')}
                />
                <span>Participant</span>
              </label>
              <label className="college-option">
                <input
                  type="checkbox"
                  checked={actorType === 'organizer'}
                  onChange={() => setActorType('organizer')}
                />
                <span>Organizer</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder={actorType === 'organizer' ? 'your.club@login-email.com' : 'your.email@college.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to={actorType === 'organizer' ? '/login/organizer' : '/login/participant'} className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
