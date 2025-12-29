import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Home, ShoppingBag, Wallet, AlertTriangle, Share2, Settings, HelpCircle,
  MessageSquare, TrendingUp, Phone, Mail, Plus,
  ChevronRight, Bell, Menu, X, CheckCircle, Clock,
  ArrowUpRight, ArrowDownLeft, Camera
} from 'lucide-react';
import { DisputesManagement } from '@/components/DisputesManagement';
import { OrdersTab } from '@/components/OrdersTab';
import StatusBadge from '@/components/StatusBadge';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { LinkGenerator } from '@/components/LinkGenerator';

// Types
interface Order {
  id: string;
  buyer: string;
  amount: number;
  item: string;
  status: 'pending' | 'shipped' | 'completed' | 'dispute';
  timeLeft: string;
  rating: number;
  reviews: number;
}

interface Transaction {
  type: 'deposit' | 'withdrawal';
  amount: number;
  desc: string;
  date: string;
}

interface SocialLink {
  icon: string;
  name: string;
  handle: string;
  followers: string;
  connected: boolean;
}

interface WalletData {
  available: number;
  pending: number;
  total: number;
}

interface SellerProfile {
  name: string;
  verified: boolean;
  memberSince: string;
  isActive: boolean;
}

export function SellerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);

  // Empty data states - ready for API integration
  const [orders] = useState<Order[]>([]);
  const [transactions] = useState<Transaction[]>([]);
  const [socialLinks] = useState<SocialLink[]>([
    { icon: '📸', name: 'Instagram', handle: '', followers: '', connected: false },
    { icon: '💬', name: 'WhatsApp Business', handle: '', followers: '', connected: false },
    { icon: '👍', name: 'Facebook Marketplace', handle: '', followers: '', connected: false },
    { icon: '📌', name: 'TikTok Shop', handle: 'Coming Soon', followers: '', connected: false },
  ]);
  const [wallet] = useState<WalletData>({ available: 0, pending: 0, total: 0 });
  const [profile] = useState<SellerProfile>({ name: 'Seller', verified: false, memberSince: '', isActive: false });

  // Payment link form state
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    itemName: '',
    description: '',
    price: ''
  });

  // Store settings state
  const [storeData, setStoreData] = useState<{
    id?: string;
    name?: string;
    slug?: string;
    logo?: string | null;
    bio?: string | null;
    visibility?: string;
    status?: string;
  } | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  // Load store data when store tab is active
  useEffect(() => {
    async function loadStore() {
      if (activeTab === 'store') {
        setStoreLoading(true);
        const res = await api.getMyStore();
        if (res.success && res.data) {
          setStoreData(res.data as any);
        }
        setStoreLoading(false);
      }
    }
    loadStore();
  }, [activeTab]);

  const handleSaveStore = async () => {
    if (!storeData) return;
    setStoreSaving(true);
    setStoreError(null);
    try {
      const res = await api.updateStore({
        name: storeData.name,
        slug: storeData.slug,
        logo: storeData.logo || undefined,
        bio: storeData.bio || undefined,
        visibility: storeData.visibility as 'PRIVATE' | 'PUBLIC' | undefined,
      });
      if (res.success) {
        alert('Store updated successfully!');
      } else {
        setStoreError(res.error || 'Failed to update store');
      }
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : 'Failed to update store');
    } finally {
      setStoreSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, we'll use a URL. In production, upload to cloud storage
      const reader = new FileReader();
      reader.onload = (event) => {
        setStoreData(prev => prev ? { ...prev, logo: event.target?.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'create_link', label: 'Create Link', icon: Plus },
    { id: 'store', label: 'Store Settings', icon: Settings },
    { id: 'ai_drafts', label: 'AI Drafts', icon: Camera },
    { id: 'published', label: 'Published Products', icon: ShoppingBag },
    { id: 'sync_logs', label: 'Sync Logs', icon: Clock },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  const handleCreatePaymentLink = () => {
    if (!paymentLinkForm.itemName || !paymentLinkForm.price) {
      alert('Please fill in item name and price');
      return;
    }
    // TODO: API integration to create payment link
    alert('Payment link functionality coming soon!');
    setPaymentLinkForm({ itemName: '', description: '', price: '' });
  };

  // HOME TAB
  const renderHome = () => (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-null-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, {profile.name}! 👋</h1>
            <p className="text-blue-100">
              {profile.verified ? '✅ Verified Seller' : '⏳ Pending Verification'}
              {profile.memberSince && ` • Member since ${profile.memberSince}`}
              {profile.isActive && ' • 🟢 Active Now'}
            </p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-null-lg transition">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'New Orders', value: orders.filter(o => o.status === 'pending').length, color: 'from-green-500 to-emerald-600' },
          { label: 'Active Orders', value: orders.filter(o => o.status === 'shipped').length, color: 'from-blue-500 to-cyan-600' },
          { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: 'from-purple-500 to-pink-600' },
          { label: 'Total Revenue', value: `KES ${wallet.total.toLocaleString()}`, color: 'from-orange-500 to-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-null-xl p-6 text-white shadow-lg`}>
            <p className="text-sm opacity-90 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-green-200 rounded-null-xl p-6">
          <p className="text-gray-600 text-sm mb-2">Available to Withdraw</p>
          <p className="text-3xl font-bold text-green-600 mb-4">KES {wallet.available.toLocaleString()}</p>
          <button
            onClick={() => setWithdrawalModal(true)}
            className="w-full bg-green-600 text-white py-2 rounded-null-lg hover:bg-green-700 transition font-semibold"
          >
            Withdraw Now
          </button>
        </div>

        <div className="bg-white border border-yellow-200 rounded-null-xl p-6">
          <p className="text-gray-600 text-sm mb-2">Pending Escrow</p>
          <p className="text-3xl font-bold text-yellow-600 mb-4">KES {wallet.pending.toLocaleString()}</p>
          <p className="text-xs text-gray-500">({orders.filter(o => o.status === 'pending' || o.status === 'shipped').length} orders pending confirmation)</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-null-xl p-6">
          <p className="text-gray-600 text-sm mb-2">Total Earnings</p>
          <p className="text-3xl font-bold text-blue-600 mb-2">KES {wallet.total.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <TrendingUp size={16} /> All time earnings
          </div>
        </div>
      </div>

      {/* Action Board */}
      <div className="bg-red-50 border border-red-200 rounded-null-xl p-6">
        <h3 className="text-lg font-bold text-red-800 mb-4">🔴 Awaiting Your Action</h3>
        {orders.filter(o => o.status === 'pending').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>No pending actions! You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.filter(o => o.status === 'pending').map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-null-lg border border-gray-200 hover:border-red-300 transition cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{order.buyer}</p>
                  </div>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="text-gray-700 text-sm mb-3">{order.item} • KES {order.amount.toLocaleString()}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-green-600 text-white py-1 rounded-null text-sm hover:bg-green-700 transition">Accept</button>
                  <button className="flex-1 bg-red-600 text-white py-1 rounded-null text-sm hover:bg-red-700 transition">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-null-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4">📊 Recent Activity</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity yet.</p>
            <p className="text-sm">Your transactions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                {tx.type === 'deposit' ? (
                  <ArrowDownLeft className="text-green-600 flex-shrink-0 mt-1" size={20} />
                ) : (
                  <ArrowUpRight className="text-red-600 flex-shrink-0 mt-1" size={20} />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{tx.desc}</p>
                  <p className="text-sm text-gray-600">{tx.date}</p>
                </div>
                <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}KES {tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ORDERS TAB
  const renderOrders = () => (
    <OrdersTab onCreatePaymentLink={() => setActiveTab('social')} />
  );

  // WALLET TAB
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [showAddPayoutMethod, setShowAddPayoutMethod] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    type: 'MOBILE_MONEY',
    provider: 'M-PESA',
    accountNumber: '',
    accountName: '',
    isDefault: false,
  });

  useEffect(() => {
    async function loadPaymentMethods() {
      if (activeTab === 'wallet') {
        setPaymentMethodsLoading(true);
        const res = await api.getPaymentMethods();
        if (res.success && res.data) {
          setPaymentMethods(Array.isArray(res.data) ? res.data : []);
        }
        setPaymentMethodsLoading(false);
      }
    }
    loadPaymentMethods();
  }, [activeTab]);

  const handleAddPayoutMethod = async () => {
    if (!payoutForm.accountNumber || !payoutForm.accountName) {
      alert('Please fill in all required fields');
      return;
    }
    const res = await api.addPaymentMethod(payoutForm);
    if (res.success) {
      setPayoutForm({ type: 'MOBILE_MONEY', provider: 'M-PESA', accountNumber: '', accountName: '', isDefault: false });
      setShowAddPayoutMethod(false);
      const updatedRes = await api.getPaymentMethods();
      if (updatedRes.success && updatedRes.data) {
        setPaymentMethods(Array.isArray(updatedRes.data) ? updatedRes.data : []);
      }
      alert('Payout method added successfully!');
    } else {
      alert(res.error || 'Failed to add payout method');
    }
  };

  const renderWallet = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">💼 Wallet & Balance</h2>

      {/* Payout Methods Section */}
      <div className="bg-white rounded-null-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">💰 Payout Methods</h3>
          <button
            onClick={() => setShowAddPayoutMethod(!showAddPayoutMethod)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-semibold"
          >
            {showAddPayoutMethod ? 'Cancel' : '+ Add Payout Method'}
          </button>
        </div>

        {paymentMethods.length === 0 && !showAddPayoutMethod && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-semibold mb-1">⚠️ No Payout Method Added</p>
            <p className="text-sm text-yellow-700">You need to add a payout method before you can activate your store or withdraw funds.</p>
          </div>
        )}

        {showAddPayoutMethod && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
              <select
                value={payoutForm.type}
                onChange={(e) => setPayoutForm({ ...payoutForm, type: e.target.value, provider: e.target.value === 'MOBILE_MONEY' ? 'M-PESA' : '' })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              >
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_ACCOUNT">Bank Account</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
              {payoutForm.type === 'MOBILE_MONEY' ? (
                <select
                  value={payoutForm.provider}
                  onChange={(e) => setPayoutForm({ ...payoutForm, provider: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="M-PESA">M-Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="T-KASH">T-Kash</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={payoutForm.provider}
                  onChange={(e) => setPayoutForm({ ...payoutForm, provider: e.target.value })}
                  placeholder="Bank name (e.g., Equity, KCB)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {payoutForm.type === 'MOBILE_MONEY' ? 'Phone Number' : 'Account Number'} *
              </label>
              <input
                type="text"
                value={payoutForm.accountNumber}
                onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                placeholder={payoutForm.type === 'MOBILE_MONEY' ? '+254 712 345 678' : 'Account number'}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
              <input
                type="text"
                value={payoutForm.accountName}
                onChange={(e) => setPayoutForm({ ...payoutForm, accountName: e.target.value })}
                placeholder="Full name as on account"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={payoutForm.isDefault}
                onChange={(e) => setPayoutForm({ ...payoutForm, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default payout method</label>
            </div>
            <button
              onClick={handleAddPayoutMethod}
              className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold"
            >
              Add Payout Method
            </button>
          </div>
        )}

        {paymentMethods.length > 0 && (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-semibold">{method.provider}</p>
                  <p className="text-sm text-gray-600">{method.accountNumber}</p>
                  <p className="text-xs text-gray-500">{method.accountName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Default</span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {method.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-null-xl p-8 text-white">
          <p className="text-green-100 mb-2">Available to Withdraw</p>
          <p className="text-4xl font-bold mb-4">KES {wallet.available.toLocaleString()}</p>
          <button
            onClick={() => setWithdrawalModal(true)}
            disabled={paymentMethods.length === 0}
            className="w-full bg-white text-green-600 py-3 rounded-null-lg hover:bg-gray-100 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💸 Withdraw
          </button>
          {paymentMethods.length === 0 && (
            <p className="text-xs text-green-100 mt-2 text-center">Add payout method first</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-null-xl p-8 text-white">
          <p className="text-yellow-100 mb-2">Pending Escrow</p>
          <p className="text-4xl font-bold mb-2">KES {wallet.pending.toLocaleString()}</p>
          <p className="text-sm text-yellow-100">({orders.filter(o => o.status !== 'completed').length} orders pending)</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-null-xl p-8 text-white">
          <p className="text-blue-100 mb-2">Total Earnings</p>
          <p className="text-4xl font-bold mb-2">KES {wallet.total.toLocaleString()}</p>
          <p className="text-sm text-blue-100">All time</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-null-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-6">📝 Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No transactions yet</p>
            <p className="text-sm">Your transaction history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx: any, idx: number) => {
              // If transaction has fee breakdown, show it
              const hasFeeBreakdown = tx.platformFee !== undefined && tx.sellerPayout !== undefined;
              const grossAmount = hasFeeBreakdown ? (tx.platformFee + tx.sellerPayout) : tx.amount;
              
              return (
                <div key={idx} className="p-4 bg-gray-50 rounded-null-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-null-full ${tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownLeft className="text-green-600" size={20} />
                        ) : (
                          <ArrowUpRight className="text-red-600" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{tx.desc || tx.itemName || 'Transaction'}</p>
                        <p className="text-sm text-gray-600">{tx.date || new Date(tx.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {hasFeeBreakdown ? (
                        <div>
                          <p className="text-lg font-bold text-green-600">+KES {tx.sellerPayout.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Net (after fees)</p>
                        </div>
                      ) : (
                        <p className={`text-xl font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}KES {tx.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {hasFeeBreakdown && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Gross Amount:</span>
                        <span className="font-semibold">KES {grossAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee ({tx.platformFeePercent || 5}%):</span>
                        <span className="text-red-600">-KES {tx.platformFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Your Payout:</span>
                        <span>KES {tx.sellerPayout.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // DISPUTES TAB
  const renderDisputes = () => <DisputesManagement />;

  // SOCIAL TAB
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectForm, setConnectForm] = useState({ pageUrl: '', pageId: '' });

  useEffect(() => {
    async function loadSocial() {
      if (activeTab === 'social') {
        setSocialLoading(true);
        const res = await api.listSocialAccounts();
        if (res.success && res.data) {
          setSocialAccounts(Array.isArray(res.data) ? res.data : []);
        }
        setSocialLoading(false);
      }
    }
    loadSocial();
  }, [activeTab]);

  const handleConnectSocial = async (platform: 'INSTAGRAM' | 'FACEBOOK') => {
    if (!connectForm.pageUrl) {
      alert('Please enter the page URL');
      return;
    }
    setConnectingPlatform(platform);
    const res = await api.connectSocialPage({
      platform,
      pageUrl: connectForm.pageUrl,
      pageId: connectForm.pageId || undefined,
    });
    if (res.success) {
      setConnectForm({ pageUrl: '', pageId: '' });
      setConnectingPlatform(null);
      const updatedRes = await api.listSocialAccounts();
      if (updatedRes.success && updatedRes.data) {
        setSocialAccounts(Array.isArray(updatedRes.data) ? updatedRes.data : []);
      }
      alert('Social page connected! AI will scan for products.');
    } else {
      alert(res.error || 'Failed to connect');
      setConnectingPlatform(null);
    }
  };

  const handleRescan = async (id: string) => {
    const res = await api.rescanSocialPage(id);
    if (res.success) {
      alert('Rescan triggered! Check sync logs for status.');
    } else {
      alert(res.error || 'Failed to trigger rescan');
    }
  };

  const renderSocial = () => {
    if (socialLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading social accounts...</div>
        </div>
      );
    }

    const platforms = [
      { key: 'INSTAGRAM', name: 'Instagram', icon: '📸' },
      { key: 'FACEBOOK', name: 'Facebook', icon: '👍' },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">📱 Social Media Connections</h2>
        <p className="text-gray-600">Connect your social pages to automatically import products via AI.</p>

        <div className="grid md:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const connected = socialAccounts.find(acc => acc.platform === platform.key);
            return (
              <div key={platform.key} className={`rounded-null-xl p-6 border-2 ${connected ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-3xl mb-2">{platform.icon}</p>
                    <p className="font-bold text-lg">{platform.name}</p>
                    {connected ? (
                      <p className="text-sm text-gray-600">{connected.pageUrl}</p>
                    ) : (
                      <p className="text-sm text-gray-600">Not Connected</p>
                    )}
                  </div>
                  {connected && <span className="px-3 py-1 bg-green-200 text-green-800 rounded-null-full text-xs font-bold">✓ Connected</span>}
                </div>
                {connected ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleRescan(connected.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded-null-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Rescan Now
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      Last scanned: {connected.lastScannedAt ? new Date(connected.lastScannedAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={`${platform.name} page URL`}
                      value={connectForm.pageUrl}
                      onChange={(e) => setConnectForm({ ...connectForm, pageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                    <button
                      onClick={() => handleConnectSocial(platform.key as 'INSTAGRAM' | 'FACEBOOK')}
                      disabled={connectingPlatform === platform.key || !connectForm.pageUrl}
                      className="w-full bg-blue-600 text-white py-2 rounded-null-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                    >
                      {connectingPlatform === platform.key ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Payment Link */}
        <div className="bg-white rounded-null-xl border border-gray-200 p-8">
        <h3 className="text-2xl font-bold mb-6">🔗 Create Payment Link</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Item Name"
            value={paymentLinkForm.itemName}
            onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, itemName: e.target.value }))}
            className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Item Description (optional)"
            value={paymentLinkForm.description}
            onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            rows={3}
          />
          <input
            type="number"
            placeholder="Price (KES)"
            value={paymentLinkForm.price}
            onChange={(e) => setPaymentLinkForm(prev => ({ ...prev, price: e.target.value }))}
            className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCreatePaymentLink}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-null-lg hover:shadow-lg transition font-bold text-lg"
          >
            <Plus className="inline mr-2" size={20} />
            Generate Payment Link
          </button>
        </div>
        </div>
      </div>
    );
  };

  // STORE SETTINGS TAB
  const renderStore = () => {
    if (storeLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading store settings...</div>
        </div>
      );
    }

    if (!storeData) {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">🏬 Create Your Store</h2>
          <div className="bg-white rounded-null-xl border border-gray-200 p-6">
            <p className="text-gray-600 mb-4">You don't have a store yet. Create one to get started!</p>
            <button
              onClick={() => {
                const name = prompt('Store Name:');
                const slug = prompt('Store Slug (URL-friendly):');
                if (name && slug) {
                  api.createStore({ name, slug }).then(res => {
                    if (res.success) {
                      setStoreData(res.data as any);
                    } else {
                      alert(res.error || 'Failed to create store');
                    }
                  });
                }
              }}
              className="px-4 py-2 rounded-null-lg bg-blue-600 text-white"
            >
              Create Store
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">🏬 Store Settings</h2>

        {/* Store Logo */}
        <div className="bg-white rounded-null-xl border border-gray-200 p-6">
          <h3 className="font-bold mb-4">Store Logo</h3>
          <div className="flex items-center gap-4">
            {storeData.logo ? (
              <img src={storeData.logo} alt="Store logo" className="w-24 h-24 object-cover rounded-lg" />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <Camera size={32} className="text-gray-400" />
              </div>
            )}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <span className="px-4 py-2 rounded-null-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition inline-block">
                  Upload Logo
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px, PNG or JPG</p>
            </div>
          </div>
        </div>

        {/* Store Details */}
        <div className="bg-white rounded-null-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-bold mb-4">Store Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
              <input
                type="text"
                value={storeData.name || ''}
                onChange={(e) => setStoreData(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                placeholder="My Awesome Store"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Slug (URL) *</label>
              <input
                type="text"
                value={storeData.slug || ''}
                onChange={(e) => setStoreData(prev => prev ? { ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } : null)}
                className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                placeholder="my-awesome-store"
              />
              <p className="text-xs text-gray-500 mt-1">Your store URL: /store/{storeData.slug || 'your-slug'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Bio</label>
            <textarea
              value={storeData.bio || ''}
              onChange={(e) => setStoreData(prev => prev ? { ...prev, bio: e.target.value } : null)}
              className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              rows={4}
              placeholder="Tell customers about your store..."
            />
          </div>
          {storeError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {storeError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSaveStore}
              disabled={storeSaving}
              className="px-4 py-2 rounded-null-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {storeSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <a
              href={`/store/${storeData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-null-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
            >
              Preview Store
            </a>
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="bg-white rounded-null-xl border border-gray-200 p-6">
          <h3 className="font-bold mb-4">Store Visibility</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                checked={storeData.visibility === 'PRIVATE'}
                onChange={(e) => setStoreData(prev => prev ? { ...prev, visibility: e.target.value } : null)}
                className="w-5 h-5"
              />
              <div>
                <p className="font-semibold">Private</p>
                <p className="text-sm text-gray-600">Only accessible via direct link</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={storeData.visibility === 'PUBLIC'}
                onChange={(e) => setStoreData(prev => prev ? { ...prev, visibility: e.target.value } : null)}
                className="w-5 h-5"
              />
              <div>
                <p className="font-semibold">Public</p>
                <p className="text-sm text-gray-600">Store can be discovered (opt-in)</p>
              </div>
            </label>
          </div>
        </div>

        {/* Store Status */}
        <div className="bg-white rounded-null-xl border border-gray-200 p-6">
          <h3 className="font-bold mb-3">Store Status</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-null-full text-sm font-bold ${
              storeData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              storeData.status === 'FROZEN' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {storeData.status || 'INACTIVE'}
            </span>
          </div>
          <div className="flex gap-3">
            {storeData.status !== 'ACTIVE' && (
              <button
                onClick={async () => {
                  const res = await api.updateStoreStatus('ACTIVE');
                  if (res.success) {
                    setStoreData(prev => prev ? { ...prev, status: 'ACTIVE' } : null);
                    alert('Store activated!');
                  } else {
                    alert(res.error || 'Failed to activate store. Make sure you have connected a social page and added a payout method.');
                  }
                }}
                className="px-4 py-2 rounded-null-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                Activate Store
              </button>
            )}
            {storeData.status === 'ACTIVE' && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to deactivate your store?')) {
                    const res = await api.updateStoreStatus('INACTIVE');
                    if (res.success) {
                      setStoreData(prev => prev ? { ...prev, status: 'INACTIVE' } : null);
                    }
                  }
                }}
                className="px-4 py-2 rounded-null-lg bg-yellow-600 text-white hover:bg-yellow-700 transition"
              >
                Deactivate Store
              </button>
            )}
          </div>
        </div>

        {/* Rescan Content */}
        <div className="bg-white rounded-null-xl border border-gray-200 p-6">
          <h3 className="font-bold mb-3">Rescan Content</h3>
          <p className="text-sm text-gray-600 mb-3">Trigger a rescan to refresh storefront and social content.</p>
          <button
            onClick={async () => {
              const res = await api.triggerStoreRescan();
              if (res.success) {
                alert('Rescan triggered! Check sync logs for status.');
              } else {
                alert(res.error || 'Failed to trigger rescan');
              }
            }}
            className="px-4 py-2 rounded-null-lg bg-gray-900 text-white hover:bg-gray-800 transition"
          >
            Trigger Rescan
          </button>
        </div>
      </div>
    );
  };

  // AI DRAFTS TAB
  const [drafts, setDrafts] = useState<any[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any | null>(null);

  useEffect(() => {
    async function loadDrafts() {
      if (activeTab === 'ai_drafts') {
        setDraftsLoading(true);
        const res = await api.listDraftProducts();
        if (res.success && res.data) {
          setDrafts(Array.isArray(res.data) ? res.data : []);
        }
        setDraftsLoading(false);
      }
    }
    loadDrafts();
  }, [activeTab]);

  const handleEditDraft = (draft: any) => {
    setEditingDraft(draft);
  };

  const handleSaveDraft = async () => {
    if (!editingDraft) return;
    const res = await api.updateProductDetails(editingDraft.id, {
      name: editingDraft.name,
      description: editingDraft.description,
      price: editingDraft.price,
      images: editingDraft.images,
    });
    if (res.success) {
      setEditingDraft(null);
      const updatedRes = await api.listDraftProducts();
      if (updatedRes.success && updatedRes.data) {
        setDrafts(Array.isArray(updatedRes.data) ? updatedRes.data : []);
      }
    }
  };

  const handlePublishDraft = async (id: string) => {
    if (!confirm('Publish this product? It will be visible on your storefront.')) return;
    const res = await api.publishProduct(id);
    if (res.success) {
      const updatedRes = await api.listDraftProducts();
      if (updatedRes.success && updatedRes.data) {
        setDrafts(Array.isArray(updatedRes.data) ? updatedRes.data : []);
      }
    }
  };

  const renderAiDrafts = () => {
    if (draftsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading drafts...</div>
        </div>
      );
    }

    if (editingDraft) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">✏️ Edit Draft Product</h2>
            <button
              onClick={() => setEditingDraft(null)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800"
            >
              Cancel
            </button>
          </div>
          <div className="bg-white rounded-null-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={editingDraft.name || ''}
                onChange={(e) => setEditingDraft({ ...editingDraft, name: e.target.value })}
                className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editingDraft.description || ''}
                onChange={(e) => setEditingDraft({ ...editingDraft, description: e.target.value })}
                className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
              <input
                type="number"
                value={editingDraft.price || ''}
                onChange={(e) => setEditingDraft({ ...editingDraft, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Images (URLs, one per line)</label>
              <textarea
                value={Array.isArray(editingDraft.images) ? editingDraft.images.join('\n') : ''}
                onChange={(e) => setEditingDraft({ ...editingDraft, images: e.target.value.split('\n').filter(Boolean) })}
                className="w-full px-4 py-3 rounded-null-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 rounded-null-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
              <button
                onClick={() => handlePublishDraft(editingDraft.id)}
                className="px-4 py-2 rounded-null-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                Save & Publish
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">🧠 AI Draft Products</h2>
        {drafts.length === 0 ? (
          <div className="bg-white rounded-null-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-2">No drafts yet.</p>
            <p className="text-sm text-gray-500">Connect social pages to generate AI drafts from your posts.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => {
              const confidenceScore = draft.aiConfidenceScore;
              const hasWarnings = draft.extractionWarnings && draft.extractionWarnings.length > 0;
              const hasMissingFields = draft.missingFields && draft.missingFields.length > 0;
              
              return (
                <div key={draft.id} className="bg-white rounded-null-xl border border-gray-200 p-6 relative">
                  {/* AI Confidence Badge */}
                  {confidenceScore !== undefined && (
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        confidenceScore >= 0.8 ? 'bg-green-100 text-green-800' :
                        confidenceScore >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        AI: {Math.round(confidenceScore * 100)}%
                      </div>
                    </div>
                  )}
                  
                  {draft.images && draft.images.length > 0 && (
                    <img src={draft.images[0]} alt={draft.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  )}
                  <h3 className="font-semibold text-lg mb-2">{draft.name}</h3>
                  {draft.price && (
                    <p className="text-green-600 font-bold mb-2">KES {draft.price.toLocaleString()}</p>
                  )}
                  {draft.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{draft.description}</p>
                  )}
                  
                  {/* AI Quality Indicators */}
                  {(hasWarnings || hasMissingFields) && (
                    <div className="mb-4 space-y-2">
                      {hasWarnings && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">⚠️ Warnings:</p>
                          <ul className="text-xs text-yellow-700 list-disc list-inside">
                            {draft.extractionWarnings.slice(0, 2).map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hasMissingFields && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                          <p className="text-xs font-semibold text-orange-800 mb-1">📋 Missing:</p>
                          <p className="text-xs text-orange-700">{draft.missingFields.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDraft(draft)}
                      className="flex-1 px-3 py-2 rounded-null-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handlePublishDraft(draft.id)}
                      className="flex-1 px-3 py-2 rounded-null-lg bg-green-600 text-white text-sm hover:bg-green-700 transition"
                    >
                      Publish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // PUBLISHED PRODUCTS TAB
  const [publishedProducts, setPublishedProducts] = useState<any[]>([]);
  const [publishedLoading, setPublishedLoading] = useState(false);

  useEffect(() => {
    async function loadPublished() {
      if (activeTab === 'published') {
        setPublishedLoading(true);
        const res = await api.listPublishedProducts();
        if (res.success && res.data) {
          setPublishedProducts(Array.isArray(res.data) ? res.data : []);
        }
        setPublishedLoading(false);
      }
    }
    loadPublished();
  }, [activeTab]);

  const handleArchiveProduct = async (id: string) => {
    if (!confirm('Archive this product? It will be removed from your storefront.')) return;
    const res = await api.archiveProduct(id);
    if (res.success) {
      const updatedRes = await api.listPublishedProducts();
      if (updatedRes.success && updatedRes.data) {
        setPublishedProducts(Array.isArray(updatedRes.data) ? updatedRes.data : []);
      }
    }
  };

  const renderPublishedProducts = () => {
    if (publishedLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading products...</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">✅ Published Products</h2>
        {publishedProducts.length === 0 ? (
          <div className="bg-white rounded-null-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No published products yet.</p>
            <p className="text-sm text-gray-500 mt-2">Publish drafts to make them visible on your storefront.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-null-xl border border-gray-200 p-6">
                {product.images && product.images.length > 0 && (
                  <img src={product.images[0]} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                {product.price && (
                  <p className="text-green-600 font-bold mb-2">KES {product.price.toLocaleString()}</p>
                )}
                {product.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                )}
                <div className="flex gap-2">
                  <a
                    href={`/store/${storeData?.slug || 'your-store'}/product/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 rounded-null-lg bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 transition text-center"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleArchiveProduct(product.id)}
                    className="flex-1 px-3 py-2 rounded-null-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // SYNC LOGS TAB
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [syncLogsLoading, setSyncLogsLoading] = useState(false);

  useEffect(() => {
    async function loadSyncLogs() {
      if (activeTab === 'sync_logs') {
        setSyncLogsLoading(true);
        const res = await api.adminListSyncLogs(1, 50);
        if (res.success && res.data) {
          const logs = Array.isArray(res.data) ? res.data : (res.data as any).logs || [];
          setSyncLogs(logs);
        }
        setSyncLogsLoading(false);
      }
    }
    loadSyncLogs();
  }, [activeTab]);

  const renderSyncLogs = () => {
    if (syncLogsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading sync logs...</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🪵 Sync Logs</h2>
          <button
            onClick={async () => {
              const res = await api.triggerStoreRescan();
              if (res.success) {
                alert('Rescan triggered! Refresh to see new logs.');
                const updatedRes = await api.adminListSyncLogs(1, 50);
                if (updatedRes.success && updatedRes.data) {
                  const logs = Array.isArray(updatedRes.data) ? updatedRes.data : (updatedRes.data as any).logs || [];
                  setSyncLogs(logs);
                }
              }
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-semibold"
          >
            Trigger Rescan
          </button>
        </div>

        {syncLogs.length === 0 ? (
          <div className="bg-white rounded-null-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No sync logs yet.</p>
            <p className="text-sm text-gray-500 mt-2">Sync logs will appear here after you connect social pages and scans run.</p>
          </div>
        ) : (
          <div className="bg-white rounded-null-xl border border-gray-200 p-6">
            <div className="space-y-3">
              {syncLogs.map((log: any, idx: number) => (
                <div key={log.id || idx} className="p-4 rounded-null-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{log.message || log.eventType || 'Sync Event'}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown time'}
                      </p>
                      {(log.newCount > 0 || log.updatedCount > 0 || log.archivedCount > 0) && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          {log.newCount > 0 && <span className="text-green-600">+{log.newCount} new</span>}
                          {log.updatedCount > 0 && <span className="text-blue-600">~{log.updatedCount} updated</span>}
                          {log.archivedCount > 0 && <span className="text-red-600">-{log.archivedCount} archived</span>}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-null-full text-xs font-bold ${
                      log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      log.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                      log.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // SETTINGS TAB
  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Settings</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-null-xl border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Profile Picture</p>
          <div className="w-24 h-24 bg-gray-200 rounded-null-lg mb-4 flex items-center justify-center">
            <Camera size={32} className="text-gray-400" />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded-null-lg hover:bg-blue-700 transition font-semibold text-sm">
            Change Photo
          </button>
        </div>

        <div className="md:col-span-2 bg-white rounded-null-xl border border-gray-200 p-6">
          <p className="font-bold text-lg mb-4">Verification Status</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-null-lg border border-yellow-200">
              <span className="font-semibold">ID Verification</span>
              <span className="text-yellow-600 font-bold">⏳ Pending</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-null-lg border border-yellow-200">
              <span className="font-semibold">Phone</span>
              <span className="text-yellow-600 font-bold">⏳ Pending</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-null-lg border border-yellow-200">
              <span className="font-semibold">M-Pesa</span>
              <span className="text-yellow-600 font-bold">⏳ Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-null-xl border border-gray-200 p-6">
        <p className="font-bold text-lg mb-4">Quick Settings</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Push Notifications</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">SMS Alerts</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Email Updates</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full bg-red-600 text-white py-3 rounded-null-lg hover:bg-red-700 transition font-bold text-lg"
      >
        🚪 Log Out
      </button>
    </div>
  );

  // SUPPORT TAB
  const renderSupport = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">❓ Help & Support</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-null-xl border border-gray-200 p-6 text-center hover:shadow-lg transition cursor-pointer">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <p className="font-bold mb-2">Live Chat</p>
          <p className="text-sm text-gray-600 mb-4">Available 9 AM - 6 PM</p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-null-lg hover:bg-blue-700 transition font-semibold">
            Start Chat
          </button>
        </div>

        <div className="bg-white rounded-null-xl border border-gray-200 p-6 text-center hover:shadow-lg transition cursor-pointer">
          <Mail className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <p className="font-bold mb-2">Email Support</p>
          <p className="text-sm text-gray-600 mb-4">support@swiftline.com</p>
          <button className="w-full bg-green-600 text-white py-2 rounded-null-lg hover:bg-green-700 transition font-semibold">
            Send Email
          </button>
        </div>

        <div className="bg-white rounded-null-xl border border-gray-200 p-6 text-center hover:shadow-lg transition cursor-pointer">
          <Phone className="w-12 h-12 mx-auto mb-4 text-orange-600" />
          <p className="font-bold mb-2">Call Us</p>
          <p className="text-sm text-gray-600 mb-4">+254 701 234 567</p>
          <button className="w-full bg-orange-600 text-white py-2 rounded-null-lg hover:bg-orange-700 transition font-semibold">
            Call Now
          </button>
        </div>
      </div>

      <div className="bg-white rounded-null-xl border border-gray-200 p-6">
        <p className="font-bold text-lg mb-4">Common Questions</p>
        <div className="space-y-3">
          {[
            'How do orders work?',
            'What if buyer doesn\'t confirm?',
            'How to withdraw funds?',
            'How to handle disputes?',
            'How to connect social media?',
          ].map((q, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-null-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer flex justify-between items-center">
              <span>{q}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-700">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div
              className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate('/')}
            >
              SWIFTLINE
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-null-lg transition">
              <Bell size={24} />
            </button>
            <button className="w-10 h-10 rounded-null-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-bold flex items-center justify-center">
              S
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} md:w-64 bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden md:overflow-visible fixed md:sticky top-16 h-[calc(100vh-64px)] z-30`}>
          <div className="p-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-null-lg transition ${activeTab === item.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:ml-0">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'wallet' && renderWallet()}
          {activeTab === 'disputes' && renderDisputes()}
          {activeTab === 'create_link' && <LinkGenerator />}
          {activeTab === 'store' && renderStore()}
          {activeTab === 'ai_drafts' && renderAiDrafts()}
          {activeTab === 'published' && renderPublishedProducts()}
          {activeTab === 'sync_logs' && renderSyncLogs()}
          {activeTab === 'social' && renderSocial()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'support' && renderSupport()}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={withdrawalModal}
        onClose={() => setWithdrawalModal(false)}
        availableBalance={wallet.available}
      />

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-null-xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">🔗 Share on Social</h3>
              <button onClick={() => setShareModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-null-lg mb-6 border border-blue-200">
              <p className="text-sm font-mono text-blue-900 break-all">Create a payment link first to share</p>
            </div>

            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-null-lg bg-pink-600 text-white hover:bg-pink-700 transition font-semibold">
                📸 Share on Instagram
              </button>
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-null-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold">
                💬 Share on WhatsApp
              </button>
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-null-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold">
                👍 Share on Facebook
              </button>
            </div>

            <button onClick={() => setShareModal(false)} className="w-full px-4 py-3 rounded-null-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-semibold">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
