import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginParticipant } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const ParticipantLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, actorType, role } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (actorType === 'user' && role === 'participant') {
        // Check if onboarding is completed
        const storedActor = JSON.parse(localStorage.getItem('actor') || '{}');
        const onboardingDone = storedActor?.user?.onboardingCompleted;
        navigate(onboardingDone ? '/participant/dashboard' : '/participant/onboarding', { replace: true });
      } else if (actorType === 'user' && role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (actorType === 'organizer') {
        navigate('/organizer/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, actorType, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginParticipant(formData);
      if (response.data.success) {
        login(response.data.token, {
          actorType: 'user',
          role: 'participant',
          user: response.data.user,
        });
        const onboardingDone = response.data.user?.onboardingCompleted;
        navigate(onboardingDone ? '/participant/dashboard' : '/participant/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Participant login</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your.email@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
          <p>
            <Link to="/">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParticipantLogin;
