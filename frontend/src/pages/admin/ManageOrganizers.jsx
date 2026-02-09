import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllOrganizers, approveOrganizer, suspendOrganizer } from '../../api/admin';

function ManageOrganizers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await getAllOrganizers();
      setOrganizers(response.data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (organizerId) => {
    try {
      await approveOrganizer(organizerId);
      setMessage('Organizer approved successfully!');
      fetchOrganizers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleSuspend = async (organizerId) => {
    try {
      await suspendOrganizer(organizerId);
      setMessage('Organizer suspended successfully!');
      fetchOrganizers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Suspension failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="navbar">
        <h2>Manage Organizers</h2>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')} style={{ marginRight: '1rem' }}>
            Dashboard
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="container">
        {message && <div className="card" style={{ background: '#d4edda', color: '#155724' }}>{message}</div>}

        <div className="card">
          <h3>All Organizers</h3>
          {organizers.length === 0 ? (
            <p>No organizers found</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Organization</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map(organizer => (
                  <tr key={organizer._id}>
                    <td>{organizer.name}</td>
                    <td>{organizer.email}</td>
                    <td>{organizer.organizationName || 'N/A'}</td>
                    <td>
                      <span className={`badge ${organizer.isVerified ? 'badge-success' : 'badge-warning'}`}>
                        {organizer.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${organizer.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {organizer.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      {!organizer.isVerified && (
                        <button className="btn btn-success" onClick={() => handleApprove(organizer._id)} style={{ marginRight: '0.5rem' }}>
                          Approve
                        </button>
                      )}
                      {organizer.isActive ? (
                        <button className="btn btn-danger" onClick={() => handleSuspend(organizer._id)}>
                          Suspend
                        </button>
                      ) : (
                        <button className="btn btn-success" onClick={() => handleApprove(organizer._id)}>
                          Activate
                        </button>
                      )}
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

export default ManageOrganizers;
