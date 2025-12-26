import { useState } from "react";
import { api } from "@/services/api";

// Construct API base URL - backend runs on port 8000
const API_BASE = import.meta.env.VITE_API_BASE_URL || (() => {
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const hostname = url.hostname;
      const protocol = url.protocol;
      
      if (hostname.includes('replit.dev')) {
        const backendDomain = hostname.replace(/-5000-/, '-8000-');
        return `${protocol}//${backendDomain}`;
      }
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//127.0.0.1:8000`;
      }
      
      return `${protocol}//${hostname}:8000`;
    } catch {
      return 'http://127.0.0.1:8000';
    }
  }
  return 'http://127.0.0.1:8000';
})();

interface Props {
  transactionId: string;
  initialStatus: string;
}

export function SellerActions({ transactionId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [payoutContact, setPayoutContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "ESCROWED") {
    return null;
  }

  async function handleAccept() {
    setLoading(true);
    setError(null);
    setMessage(null);

    // Demo mode
    if (transactionId === "demo-transaction") {
      setTimeout(() => {
        setStatus("ACTIVE");
        setMessage("Order accepted. Funds remain in escrow until delivery is marked.");
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await api.acceptOrder(transactionId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to accept order');
      }

      setStatus(response.data?.status ?? "ACCEPTED");
      setMessage("Order accepted. Funds remain in escrow until delivery is marked.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-null-lg border border-border bg-card p-4 text-sm">
      <h2 className="mb-2 font-semibold text-card-foreground">Seller actions</h2>
      <p className="mb-3 text-muted-foreground">
        Funds are in escrow. As the seller, confirm you accept this order and
        optionally provide the M-Pesa number to receive payout.
      </p>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Payout contact (M-Pesa phone)</span>
        <input
          type="text"
          value={payoutContact}
          onChange={(e) => setPayoutContact(e.target.value)}
          placeholder="e.g. +2547..."
          className="rounded-null-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
        />
      </label>

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="mt-3 inline-flex items-center justify-center rounded-null-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Accepting..." : "Accept order"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-2 text-xs text-green-600" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
