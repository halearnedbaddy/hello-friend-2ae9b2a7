import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export interface BuyerOrder {
  id: string;
  itemName: string;
  amount: number;
  status: string;
  seller: { name: string; phone: string };
  createdAt: string;
  updatedAt: string;
}

export interface BuyerDispute {
  id: string;
  transactionId: string;
  status: string;
  reason: string;
  transaction: {
    itemName: string;
    amount: number;
    seller: { name: string };
  };
  createdAt: string;
}

export interface BuyerWallet {
  availableBalance: number;
  pendingBalance: number;
  totalSpent: number;
  totalTransactions: number;
}

export function useBuyerData() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [disputes, setDisputes] = useState<BuyerDispute[]>([]);
  const [wallet, setWallet] = useState<BuyerWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all buyer data in parallel
      const [ordersRes, disputesRes, walletRes] = await Promise.all([
        api.request('/api/v1/buyer/orders?page=1&limit=20'),
        api.request('/api/v1/buyer/disputes'),
        api.request('/api/v1/buyer/wallet'),
      ]);

      if (ordersRes.success && ordersRes.data) {
        const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.orders || [];
        setOrders(ordersData);
      }
      if (disputesRes.success && disputesRes.data) {
        const disputesData = Array.isArray(disputesRes.data) ? disputesRes.data : disputesRes.data.disputes || [];
        setDisputes(disputesData);
      }
      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buyer data');
    } finally {
      setLoading(false);
    }
  };

  return { orders, disputes, wallet, loading, error, refetch: fetchAllData };
}
