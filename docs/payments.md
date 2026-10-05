# Video payment flow

The demo provider is active by default. Copy `.env.example` to `.env.local` and leave `NEXT_PUBLIC_RAZORPAY_ENABLED=false` while the payment API is unavailable. A demo payment is clearly labelled and unlocks the video in this browser's My Learning list.

The Razorpay Checkout adapter is in `lib/payments.ts`. After the API is implemented, set `NEXT_PUBLIC_RAZORPAY_ENABLED=true` and provide the server routes below. Restart or rebuild Next.js after changing the public environment variable.

## API contract required to enable Razorpay

### `POST /api/payments/orders`

Request:

```json
{ "videoId": 2 }
```

Authenticate the member from a server-side session. Look up the video and price in trusted server data; do not use an amount supplied by the browser. Create one Razorpay order per attempt and return:

```json
{
  "orderId": "order_...",
  "keyId": "rzp_test_...",
  "amount": 49900,
  "currency": "INR"
}
```

The amount is expressed in the currency's smallest subunit.

### `POST /api/payments/verify`

Razorpay Checkout sends `videoId`, `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to this route. Find the original order using the authenticated member and server-side order record. Verify the signature with the server-only Razorpay secret, confirm the order is for the requested video and amount, then persist the member's video entitlement. Return `{ "verified": true }` only after verification and persistence succeed.

### `GET /api/member/my-learning`

Authenticate the member and return the video IDs whose purchases have been verified and persisted for that member:

```json
{ "videoIds": [2, 3] }
```

The Razorpay-enabled member pages read this endpoint after reload. Browser storage alone is not a trusted payment record. Keep `RAZORPAY_KEY_SECRET` server-only. Never expose it through a `NEXT_PUBLIC_` variable.
