import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { sound } from '../services/soundSynthesizer';

export const RazorpayModal = ({
  amount,
  bookingDetails,
  onSuccess,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('driver@okaxis');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProcessPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create order on backend
      const orderRes = await api.createPaymentOrder(amount, `booking_${Date.now()}`);

      // 2. Simulate payment confirmation & verify on backend
      const paymentPayload = {
        razorpay_order_id: orderRes.order.id,
        razorpay_payment_id: `pay_rzp_${Date.now()}`,
        razorpay_signature: 'simulated_test_sig',
        method: activeTab === 'upi' ? `Razorpay UPI (${upiId})` : 'Razorpay Card'
      };

      const verifyRes = await api.verifyPaymentSignature(paymentPayload);

      if (verifyRes.success) {
        sound.playChime();
        onSuccess({
          paymentId: paymentPayload.razorpay_payment_id,
          orderId: paymentPayload.razorpay_order_id,
          method: paymentPayload.method
        });
      } else {
        throw new Error(verifyRes.message || 'Payment signature verification failed');
      }
    } catch (err) {
      setError(err.message || 'Payment processing encountered an error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-elevated border border-surface-border overflow-hidden animate-scale-up">
        {/* Header with Razorpay Test Mode Styling */}
        <div className="bg-primary px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-sm">
              R
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide">Razorpay Gateway</div>
              <div className="text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Test Sandbox Environment
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base font-bold"
          >
            ✕
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-surface-border">
            <div>
              <span className="text-xs text-surface-muted block">Payment for Bay Reservation</span>
              <span className="text-sm font-bold text-primary">
                Slot {bookingDetails?.slotId} · {bookingDetails?.durationHours} hr
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-surface-muted block">Total Payable</span>
              <span className="text-xl font-extrabold text-primary">₹{amount}</span>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('upi')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'upi'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-surface-muted hover:text-primary'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instant UPI</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'card'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-surface-muted hover:text-primary'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card / Debit</span>
            </button>
          </div>

          {/* Form Content */}
          {activeTab === 'upi' ? (
            <div className="space-y-3 pt-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">UPI Virtual ID (VPA)</span>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono focus:outline-none focus:border-secondary"
                />
              </label>
              <p className="text-[11px] text-surface-muted">
                Accepts Google Pay, PhonePe, Paytm & BHIM UPI handles.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Card Number</span>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono focus:outline-none focus:border-secondary"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Expiry (MM/YY)</span>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono focus:outline-none focus:border-secondary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">CVV</span>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono focus:outline-none focus:border-secondary"
                  />
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handleProcessPayment}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin">◌</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ₹{amount} & Authorize Reservation</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-surface-muted pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted Razorpay Sandbox Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
