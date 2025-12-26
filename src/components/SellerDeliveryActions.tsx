import { useState } from "react";
import { api } from "@/services/api";

interface Props {
  transactionId: string;
  initialStatus: string;
}

export function SellerDeliveryActions({ transactionId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "ACCEPTED" && status !== "SHIPPED" && status !== "DELIVERED") {
    return null;
  }

  async function handleMarkDelivered() {
    setLoading(true);
    setError(null);
    setMessage(null);

    // Demo mode
    if (transactionId === "demo-transaction") {
      setTimeout(() => {
        setStatus("DELIVERED");
        setMessage("Marked as delivered. Buyer will be asked to confirm, or funds will auto-release later.");
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const urls = evidenceUrls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      // Use shipping endpoint to mark as delivered
      const response = await api.addShippingInfo(transactionId, {
        courierName: "Self-delivery",
        trackingNumber: `DEL-${Date.now()}`,
        notes: urls.length > 0 ? `Delivery proof: ${urls.join(", ")}` : undefined,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark as delivered');
      }

      setStatus(response.data?.status ?? "SHIPPED");
      setMessage("Shipping info added. Order marked as shipped. Buyer will be notified.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-null-lg border border-border bg-card p-4 text-sm">
      <h2 className="mb-2 font-semibold text-card-foreground">Delivery</h2>
      <p className="mb-3 text-muted-foreground">
        Once you have delivered the item/service, mark it as delivered. Optionally,
        provide links to proof (e.g., image URLs).
      </p>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Evidence URLs (comma-separated)</span>
        <textarea
          value={evidenceUrls}
          onChange={(e) => setEvidenceUrls(e.target.value)}
          placeholder="https://... , https://..."
          className="min-h-[60px] rounded-null-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
        />
      </label>

      <button
        type="button"
        onClick={handleMarkDelivered}
        disabled={loading || status === "DELIVERED"}
        className="mt-3 inline-flex items-center justify-center rounded-null-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "DELIVERED"
          ? "Already marked delivered"
          : loading
            ? "Saving..."
            : "Mark delivered"}
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
