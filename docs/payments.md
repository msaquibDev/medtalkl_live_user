# Razorpay purchase flow

Paid faculty videos and conferences use the Razorpay Checkout adapter in `lib/payments.ts`. A paid item remains locked unless the server verifies the Razorpay signature and records the member's entitlement. The member app reads verified video and conference IDs from `GET /api/member/my-learning`; it does not treat browser storage as proof of payment.

## Backend API contract

The separate backend must implement these authenticated routes before checkout can complete:

### `POST /api/payments/orders`

Request:

```json
{ "itemType": "faculty-video", "itemId": 2 }
```

`itemType` can be `faculty-video` or `conference`. Authenticate the member from a server-side session, look up the item and price in trusted server data, and create the order. Ignore any client supplied price. Return:

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

The request includes `itemType`, `itemId`, `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`. Find the original order using the authenticated member and server-side order record. Verify the signature with the server-only Razorpay secret, confirm the order belongs to the requested item and amount, and persist the member's video or conference entitlement. Return `{ "verified": true }` only after verification and persistence succeed.

### `GET /api/member/my-learning`

Authenticate the member and return only verified entitlements:

```json
{ "videoIds": [2, 3], "conferenceIds": [8] }
```

The backend must also protect paid media URLs or issue signed links after entitlement checks. Keep `RAZORPAY_KEY_SECRET` server-only; never expose it through a `NEXT_PUBLIC_` variable.