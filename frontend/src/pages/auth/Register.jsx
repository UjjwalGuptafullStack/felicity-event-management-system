import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerParticipant } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import '../auth/Login.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    collegeOrOrg: '',
  });
  const [collegeChoice, setCollegeChoice] = useState('');
  const [otherCollege, setOtherCollege] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const iiitCollegeName = 'International Institute of Information Technology, Hyderabad';
    const iiitDomains = ['iiit.ac.in', 'research.iiit.ac.in', 'students.iiit.ac.in'];
    const email = formData.email.trim().toLowerCase();
    const emailDomain = email.includes('@') ? email.split('@').pop() : '';

    if (!collegeChoice) {
      setError('Please select your college option.');
      setLoading(false);
      return;
    }

    if (collegeChoice === 'iiith') {
      if (!iiitDomains.includes(emailDomain)) {
        setError('IIITH participants must use an @iiit.ac.in, @research.iiit.ac.in, or @students.iiit.ac.in email.');
        setLoading(false);
        return;
      }
    }

    if (collegeChoice === 'other') {
      if (!otherCollege.trim()) {
        setError('Please enter your college or organization name.');
        setLoading(false);
        return;
      }
      if (iiitDomains.includes(emailDomain)) {
        setError('IIITH emails are only allowed when the IIITH option is selected.');
        setLoading(false);
        return;
      }
    }

    const payload = {
      ...formData,
      collegeOrOrg: collegeChoice === 'iiith' ? iiitCollegeName : otherCollege.trim(),
    };

    try {
      const response = await registerParticipant(payload);
      if (response.data.success) {
        login(response.data.token, {
          actorType: 'user',
          role: 'participant',
          user: response.data.user,
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join Felicity</h1>
          <p>Participant registration</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                placeholder="Aarav"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                placeholder="Sharma"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

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
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              id="contactNumber"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>College / Organization</label>
            <div className="college-options">
              <label className="college-option">
                <input
                  type="checkbox"
                  checked={collegeChoice === 'iiith'}
                  onChange={(e) => setCollegeChoice(e.target.checked ? 'iiith' : '')}
                />
                <span>International Institute of Information Technology, Hyderabad</span>
              </label>
              <label className="college-option">
                <input
                  type="checkbox"
                  checked={collegeChoice === 'other'}
                  onChange={(e) => setCollegeChoice(e.target.checked ? 'other' : '')}
                />
                <span>Other</span>
              </label>
            </div>
            {collegeChoice === 'other' && (
              <input
                id="collegeOrOrg"
                type="text"
                placeholder="Your college or organization"
                value={otherCollege}
                onChange={(e) => setOtherCollege(e.target.value)}
                required
              />
            )}
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login/participant">Login</Link>
          </p>
          <p>
            <Link to="/">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
