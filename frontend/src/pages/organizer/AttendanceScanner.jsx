import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { scanQRAttendance, markManualAttendance, exportAttendance, getEventAttendance } from '../../api/organizer';

function AttendanceScanner() {
  const { eventId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  const fetchAttendance = async () => {
    try {
      const response = await getEventAttendance(eventId);
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleQRScan = async () => {
    if (!qrCode.trim()) {
      setMessage('Please enter QR code');
      return;
    }
    setLoading(true);
    try {
      await scanQRAttendance(eventId, qrCode);
      setMessage('Attendance marked via QR!');
      setQrCode('');
      fetchAttendance();
    } catch (error) {
      setMessage(error.response?.data?.message || 'QR scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualMark = async () => {
    if (!participantId.trim()) {
      setMessage('Please enter participant ID');
      return;
    }
    setLoading(true);
    try {
      await markManualAttendance(eventId, participantId);
      setMessage('Attendance marked manually!');
      setParticipantId('');
      fetchAttendance();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Manual marking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportAttendance(eventId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${eventId}.csv`;
      a.click();
      setMessage('Attendance exported successfully!');
    } catch (error) {
      setMessage('Export failed');
    }
  };

  return (
    <div>
      <div className="navbar">
        <h2>Attendance Scanner</h2>
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
          <h3>QR Code Scanner</h3>
          <label>Enter QR Code</label>
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Scan or paste QR code here"
          />
          <button className="btn btn-primary" onClick={handleQRScan} disabled={loading}>
            {loading ? 'Processing...' : 'Mark Attendance'}
          </button>
        </div>

        <div className="card">
          <h3>Manual Attendance</h3>
          <label>Participant ID</label>
          <input
            type="text"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="Enter participant ID"
          />
          <button className="btn btn-success" onClick={handleManualMark} disabled={loading}>
            {loading ? 'Processing...' : 'Mark Manually'}
          </button>
        </div>

        <div className="card">
          <h3>Attendance List ({attendance.length})</h3>
          <button className="btn btn-secondary" onClick={handleExport}>Export to CSV</button>
          {attendance.length === 0 ? (
            <p>No attendance records yet</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>Marked At</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, idx) => (
                  <tr key={idx}>
                    <td>{record.participant?.firstName} {record.participant?.lastName}</td>
                    <td>{record.participant?.email}</td>
                    <td>{new Date(record.markedAt).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${record.method === 'qr' ? 'badge-success' : 'badge-info'}`}>
                        {record.method}
                      </span>
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

export default AttendanceScanner;
