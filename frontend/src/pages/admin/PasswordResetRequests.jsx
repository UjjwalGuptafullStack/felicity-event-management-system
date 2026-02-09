import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPendingPasswordResets, approvePasswordReset, rejectPasswordReset } from '../../api/admin';

function PasswordResetRequests() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

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
      setTempPassword(response.data.temporaryPassword);
      setMessage(`Request approved! Temporary password: ${response.data.temporaryPassword}`);
      fetchRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectPasswordReset(requestId);
      setMessage('Request rejected successfully!');
      fetchRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="navbar">
        <h2>Password Reset Requests</h2>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')} style={{ marginRight: '1rem' }}>
            Dashboard
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="container">
        {message && (
          <div className="card" style={{ background: tempPassword ? '#d1ecf1' : '#d4edda', color: tempPassword ? '#0c5460' : '#155724' }}>
            {message}
          </div>
        )}

        <div className="card">
          <h3>Pending Password Reset Requests</h3>
          {requests.length === 0 ? (
            <p>No pending requests</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Reason</th>
                  <th>Requested At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request._id}>
                    <td>{request.user?.email || 'N/A'}</td>
                    <td>{request.reason}</td>
                    <td>{new Date(request.createdAt).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-warning">{request.status}</span>
                    </td>
                    <td>
                      <button className="btn btn-success" onClick={() => handleApprove(request._id)} style={{ marginRight: '0.5rem' }}>
                        Approve
                      </button>
                      <button className="btn btn-danger" onClick={() => handleReject(request._id)}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasswordResetRequests;
