import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPendingMerchandise, approveMerchandise, rejectMerchandise } from '../../api/organizer';

function MerchandiseApprovals() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await getPendingMerchandise();
      setPurchases(response.data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (purchaseId) => {
    try {
      await approveMerchandise(purchaseId);
      setMessage('Purchase approved successfully!');
      fetchPurchases();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (purchaseId) => {
    try {
      await rejectMerchandise(purchaseId);
      setMessage('Purchase rejected successfully!');
      fetchPurchases();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="navbar">
        <h2>Merchandise Approvals</h2>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/organizer/dashboard')} style={{ marginRight: '1rem' }}>
            Dashboard
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="container">
        {message && <div className="card" style={{ background: '#d4edda', color: '#155724' }}>{message}</div>}

        <div className="card">
          <h3>Pending Merchandise Purchases</h3>
          {purchases.length === 0 ? (
            <p>No pending purchases</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Event</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                  <th>Payment Proof</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(purchase => (
                  <tr key={purchase._id}>
                    <td>{purchase.participant?.email || 'N/A'}</td>
                    <td>{purchase.event?.title || 'N/A'}</td>
                    <td>{purchase.itemName}</td>
                    <td>{purchase.quantity}</td>
                    <td>₹{purchase.totalAmount}</td>
                    <td>
                      <a href={purchase.paymentProof} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        View Proof
                      </a>
                    </td>
                    <td>
                      <button className="btn btn-success" onClick={() => handleApprove(purchase._id)} style={{ marginRight: '0.5rem' }}>
                        Approve
                      </button>
                      <button className="btn btn-danger" onClick={() => handleReject(purchase._id)}>
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

export default MerchandiseApprovals;
