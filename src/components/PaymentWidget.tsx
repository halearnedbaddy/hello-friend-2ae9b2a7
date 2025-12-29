import { useState } from 'react';
import { Smartphone, Loader } from 'lucide-react';
import { api } from '@/services/api';

interface PaymentWidgetProps {
  transactionId: string;
  amount: number;
  buyerName: string;
  onPaymentSuccess?: () => void;
}

export function PaymentWidget({ transactionId, amount, onPaymentSuccess }: PaymentWidgetProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  const handleSTKPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.request('/api/v1/payments/initiate-stk', {
        method: 'POST',
        body: {
          transactionId,
          phoneNumber,
          amount,
        },
      });

      if (response.success && response.data) {
        const data = response.data as { checkoutRequestID: string };
        setPaymentStatus('pending');
        
        // Start polling for payment status
        pollPaymentStatus(data.checkoutRequestID);
      } else {
        setError(response.error || 'Failed to initiate payment');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = (_checkoutId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.request('/api/v1/payments/check-status', {
          method: 'POST',
          body: { transactionId },
          requireAuth: true,
        });

        const txData = response.data as { status: string };
        if (txData.status === 'PAYMENT_CONFIRMED') {
          setPaymentStatus('success');
          clearInterval(pollInterval);
          onPaymentSuccess?.();
        } else if (txData.status === 'PAYMENT_FAILED') {
          setPaymentStatus('failed');
          clearInterval(pollInterval);
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="text-green-600" size={20} />
        <h3 className="font-bold text-lg">Pay with M-Pesa</h3>
      </div>

      {paymentStatus === 'idle' && (
        <form onSubmit={handleSTKPush} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (254XXXXXXXXX)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="2547xxxxxxxx"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Amount:</p>
            <p className="text-2xl font-bold text-gray-900">KES {amount.toLocaleString()}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Initiating...
              </>
            ) : (
              'Send STK Push'
            )}
          </button>
        </form>
      )}

      {paymentStatus === 'pending' && (
        <div className="text-center py-8">
          <div className="inline-block">
            <Loader size={40} className="text-green-600 animate-spin mb-4" />
          </div>
          <p className="text-gray-700 font-medium">Waiting for PIN prompt on {phoneNumber}</p>
          <p className="text-sm text-gray-500 mt-2">Check your phone for the M-Pesa PIN prompt</p>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-700 font-bold">Payment Successful!</p>
          <p className="text-sm text-green-600 mt-2">Transaction ID: {transactionId}</p>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-red-700 font-bold">Payment Failed</p>
          <button
            onClick={() => setPaymentStatus('idle')}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
