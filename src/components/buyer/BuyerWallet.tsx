import { DollarSign, TrendingUp, Clock, Send, Loader } from 'lucide-react';

interface BuyerWalletProps {
  wallet: any;
  loading: boolean;
  error: string | null;
}

export function BuyerWallet({ wallet, loading, error }: BuyerWalletProps) {
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
        <p className="font-bold">Failed to load wallet</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Wallet</h2>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-200 rounded-lg text-green-700">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-sm text-green-700 font-medium">Available Balance</p>
          <h3 className="text-3xl font-black text-green-900 mt-2">
            KES {(wallet?.availableBalance || 0).toLocaleString()}
          </h3>
          <button className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
            <Send size={16} /> Withdraw
          </button>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-200 rounded-lg text-orange-700">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-sm text-orange-700 font-medium">Pending Balance</p>
          <h3 className="text-3xl font-black text-orange-900 mt-2">
            KES {(wallet?.pendingBalance || 0).toLocaleString()}
          </h3>
          <p className="text-xs text-orange-600 mt-4">Waiting for seller release</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-200 rounded-lg text-blue-700">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-sm text-blue-700 font-medium">Total Spent</p>
          <h3 className="text-3xl font-black text-blue-900 mt-2">
            KES {(wallet?.totalSpent || 0).toLocaleString()}
          </h3>
          <p className="text-xs text-blue-600 mt-4">Across {wallet?.totalTransactions || 0} purchases</p>
        </div>
      </div>

      {/* Transaction History Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Escrow Released</p>
                <p className="text-xs text-gray-500">Order confirmed</p>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900">+KES 50,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
