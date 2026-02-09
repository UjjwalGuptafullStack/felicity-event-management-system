import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEventById } from '../../api/events';
import { registerForEvent, purchaseMerchandise, submitFeedback } from '../../api/participant';

function EventDetails() {
  const { id } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [merchandiseItem, setMerchandiseItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentProof, setPaymentProof] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await getEventById(id);
        setEvent(response.data.event);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!selectedTicket) {
      setMessage('Please select a ticket type');
      return;
    }
    try {
      await registerForEvent(id, selectedTicket);
      setMessage('Registration successful!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleMerchandisePurchase = async () => {
    if (!merchandiseItem || !paymentProof) {
      setMessage('Please fill all merchandise fields');
      return;
    }
    try {
      await purchaseMerchandise({
        eventId: id,
        itemName: merchandiseItem,
        quantity,
        paymentProof
      });
      setMessage('Merchandise purchase submitted! Awaiting approval.');
      setMerchandiseItem('');
      setQuantity(1);
      setPaymentProof('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Purchase failed');
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      await submitFeedback({
        eventId: id,
        rating: feedbackRating,
        comment: feedbackComment
      });
      setMessage('Feedback submitted successfully!');
      setFeedbackComment('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Feedback submission failed');
    }
  };

  if (loading) return <div className="loading">Loading event...</div>;
  if (!event) return <div className="container">Event not found</div>;

  const isPastEvent = new Date(event.date) < new Date();

  return (
    <div>
      <div className="navbar">
        <h2>{event.title}</h2>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/events')} style={{ marginRight: '1rem' }}>
            Back to Events
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="container">
        {message && <div className="card" style={{ background: '#d4edda', color: '#155724' }}>{message}</div>}

        <div className="card">
          <h3>Event Details</h3>
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Capacity:</strong> {event.capacity}</p>
          <p><strong>Description:</strong> {event.description}</p>
        </div>

        {!isPastEvent && (
          <div className="card">
            <h3>Register for Event</h3>
            <label>Select Ticket Type</label>
            <select value={selectedTicket} onChange={(e) => setSelectedTicket(e.target.value)}>
              <option value="">-- Select Ticket --</option>
              {event.ticketTypes?.map(ticket => (
                <option key={ticket._id} value={ticket._id}>
                  {ticket.name} - ₹{ticket.price} ({ticket.availableQuantity} available)
                </option>
              ))}
            </select>
            <button className="btn btn-success" onClick={handleRegister}>Register</button>
          </div>
        )}

        {event.merchandiseDetails?.items?.length > 0 && !isPastEvent && (
          <div className="card">
            <h3>Purchase Merchandise</h3>
            <label>Item Name</label>
            <select value={merchandiseItem} onChange={(e) => setMerchandiseItem(e.target.value)}>
              <option value="">-- Select Item --</option>
              {event.merchandiseDetails.items.map((item, idx) => (
                <option key={idx} value={item.name}>
                  {item.name} - ₹{item.price} ({item.stock} in stock)
                </option>
              ))}
            </select>
            <label>Quantity</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            <label>Payment Proof URL</label>
            <input type="text" value={paymentProof} onChange={(e) => setPaymentProof(e.target.value)} placeholder="Enter payment proof URL" />
            <button className="btn btn-primary" onClick={handleMerchandisePurchase}>Submit Purchase</button>
          </div>
        )}

        {isPastEvent && (
          <div className="card">
            <h3>Submit Feedback</h3>
            <label>Rating (1-5)</label>
            <select value={feedbackRating} onChange={(e) => setFeedbackRating(Number(e.target.value))}>
              <option value={1}>1 - Poor</option>
              <option value={2}>2 - Fair</option>
              <option value={3}>3 - Good</option>
              <option value={4}>4 - Very Good</option>
              <option value={5}>5 - Excellent</option>
            </select>
            <label>Comment (Optional)</label>
            <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} rows="4" />
            <button className="btn btn-success" onClick={handleFeedbackSubmit}>Submit Feedback</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetails;
