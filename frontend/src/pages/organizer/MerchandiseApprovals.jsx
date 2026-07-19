import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getPendingMerchandise, approveMerchandise, rejectMerchandise } from '../../api/organizer';
import { GradientButton } from '../../components/design-system/GradientButton';
import { ShoppingBag, CheckCircle, XCircle, ExternalLink, PackageSearch } from 'lucide-react';

function MerchandiseApprovals() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const fetchPurchases = async () => {
    try {
      const response = await getPendingMerchandise();
      setRegistrations(response.data.registrations || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      showNotice('error', 'Failed to load pending purchases.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (regId) => {
    setActioningId(regId);
    try {
      await approveMerchandise(regId);
      showNotice('success', 'Purchase approved — the ticket has been issued.');
      fetchPurchases();
    } catch (error) {
      showNotice('error', error.response?.data?.message || 'Approval failed.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (regId) => {
    setActioningId(regId);
    try {
      await rejectMerchandise(regId);
      showNotice('success', 'Purchase rejected.');
      fetchPurchases();
    } catch (error) {
      showNotice('error', error.response?.data?.message || 'Rejection failed.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Merchandise Approvals</h1>
            <p className="text-sm text-muted-foreground">Review and approve pending merchandise payments across your events.</p>
          </div>
        </div>

        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 border rounded-xl px-5 py-4 ${
                notice.type === 'success'
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
            >
              {notice.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
              <span>{notice.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {registrations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pending merchandise purchases.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Participant</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Proof</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors align-top">
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{reg.participant?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{reg.participant?.email}</p>
                      </td>
                      <td className="py-4 px-4 text-foreground">{reg.event?.name || 'N/A'}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {reg.purchasedItems.map((item, idx) => (
                          <p key={idx}>
                            {item.quantity}× {item.name}{item.variant ? ` (${item.variant})` : ''}
                          </p>
                        ))}
                      </td>
                      <td className="py-4 px-4 font-medium text-foreground">₹{reg.totalAmount}</td>
                      <td className="py-4 px-4">
                        {reg.paymentProofUrl ? (
                          <a
                            href={reg.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:text-primary-light text-xs font-medium"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <GradientButton
                            size="sm"
                            variant="primary"
                            disabled={actioningId === reg.id}
                            onClick={() => handleApprove(reg.id)}
                          >
                            Approve
                          </GradientButton>
                          <button
                            disabled={actioningId === reg.id}
                            onClick={() => handleReject(reg.id)}
                            className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MerchandiseApprovals;
