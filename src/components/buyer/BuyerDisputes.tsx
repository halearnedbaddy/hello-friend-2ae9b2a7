import { AlertTriangle, MessageSquare, CheckCircle, Loader } from 'lucide-react';
import { useState } from 'react';

interface BuyerDisputesProps {
  disputes: any[];
  loading: boolean;
  error: string | null;
}

export function BuyerDisputes({ disputes, loading, error }: BuyerDisputesProps) {
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-bold">Failed to load disputes</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Disputes</h2>
        <p className="text-sm text-gray-500">{disputes.length} dispute(s)</p>
      </div>

      <div className="space-y-4">
        {disputes.length > 0 ? (
          disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedDispute(selectedDispute === dispute.id ? null : dispute.id)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                  <AlertTriangle size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      dispute.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                        dispute.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                    }`}>
                      {dispute.status}
                    </span>
                    <span className="text-sm text-gray-500">Case #{dispute.id.slice(0, 8)}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{dispute.reason}</h3>

                  <p className="text-sm text-gray-600 mb-3">
                    Transaction: <span className="font-semibold">{dispute.transaction.itemName}</span>
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Seller: <span className="font-semibold text-gray-900">{dispute.transaction.seller.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      KES {dispute.transaction.amount.toLocaleString()}
                    </span>
                  </div>

                  {selectedDispute === dispute.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition flex items-center justify-center gap-2">
                        <MessageSquare size={16} /> Add Message
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-900">No Disputes</h3>
            <p className="text-gray-500">You haven't raised any disputes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
