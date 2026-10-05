export type VideoPaymentRequest = {
  videoId: number;
  videoTitle: string;
  amount: string;
  memberEmail: string;
};

export type VideoPaymentReceipt = {
  provider: "demo" | "razorpay";
  paymentId: string;
};

export interface VideoPaymentProvider {
  readonly mode: "demo" | "razorpay";
  pay(request: VideoPaymentRequest): Promise<VideoPaymentReceipt>;
}

type RazorpayOrder = {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open(): void;
  on(event: "payment.failed", callback: (event: { error?: { description?: string } }) => void): void;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name?: string; email: string };
  theme: { color: string };
  handler(response: RazorpaySuccess): void;
  modal: { ondismiss(): void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/** Demo mode is the default until the server payment API is deployed. */
export const demoVideoPaymentProvider: VideoPaymentProvider = {
  mode: "demo",
  async pay(request) {
    return { provider: "demo", paymentId: `demo_${request.videoId}_${Date.now()}` };
  },
};

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

/**
 * Razorpay adapter contract:
 * POST /api/payments/orders creates the order on the server using the video ID.
 * POST /api/payments/verify checks the Checkout signature on the server and
 * records access in the member's learning library. Never trust client amounts.
 */
export const razorpayVideoPaymentProvider: VideoPaymentProvider = {
  mode: "razorpay",
  async pay(request) {
    const orderResponse = await fetch("/api/payments/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: request.videoId }),
    });
    if (!orderResponse.ok) throw new Error("Could not create a Razorpay order.");
    const order = await orderResponse.json() as RazorpayOrder;
    if (!order.orderId || !order.keyId || !order.amount || !order.currency) throw new Error("The order response is incomplete.");

    await loadRazorpayCheckout();
    if (!window.Razorpay) throw new Error("Razorpay Checkout did not initialize.");

    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (error: Error) => { if (!settled) { settled = true; reject(error); } };
      const checkout = new window.Razorpay!({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Meditalk Live",
        description: request.videoTitle,
        prefill: { email: request.memberEmail },
        theme: { color: "#078271" },
        handler: async (response) => {
          try {
            const verification = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoId: request.videoId, ...response }),
            });
            const result = await verification.json() as { verified?: boolean };
            if (!verification.ok || !result.verified) throw new Error("Razorpay could not verify this payment.");
            settled = true;
            resolve({ provider: "razorpay", paymentId: response.razorpay_payment_id });
          } catch (error) { fail(error instanceof Error ? error : new Error("Payment verification failed.")); }
        },
        modal: { ondismiss: () => fail(new Error("Payment was cancelled.")) },
      });
      checkout.on("payment.failed", (event) => fail(new Error(event.error?.description || "Payment failed.")));
      checkout.open();
    });
  },
};

export const activeVideoPaymentProvider: VideoPaymentProvider =
  process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === "true"
    ? razorpayVideoPaymentProvider
    : demoVideoPaymentProvider;
