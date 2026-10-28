# Security Specification — Savoria Artisanal Bistro & Bar

## 1. Data Invariants

1. **Default-Deny Catch-All**: No unlisted collection or subcollection may be read or written (`match /{document=**} { allow read, write: if false; }`).
2. **Verified Identity**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin Authorization**: Admin rights are granted exclusively if `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` OR `(request.auth.token.email_verified == true && request.auth.token.email in ['junaeidshohan2005@gmail.com', 'junaeidshohan@gmail.com', 'junaeishohan@gmail.com'])`.
4. **PII Isolation (`users/{userId}`)**: User profiles contain `email`, `phone`, and `address`. Read (`get`) is strictly isolated to `request.auth.uid == userId || isAdmin()`, and `list` is strictly restricted to `isAdmin()`.
5. **Anti-Privilege Escalation**: Non-admin users creating their own profile (`users/{userId}`) must set `role == 'user'` and `id == request.auth.uid`. Non-admin profile updates can only modify `['displayName', 'photoURL', 'phone', 'address', 'updatedAt']` while keeping `role`, `id`, `email`, and `createdAt` immutable.
6. **Order Ownership & Query Enforcement (`orders/{orderId}`)**: `get` and `list` require `resource.data.userId == request.auth.uid || isAdmin()`. `create` requires `incoming().userId == request.auth.uid` and `incoming().status == 'pending'`.
7. **Terminal State Locking (`orders/{orderId}`)**: Non-admin customers can ONLY cancel their own order when `existing().status == 'pending'`, transitioning exclusively to `incoming().status == 'cancelled'` via `affectedKeys().hasOnly(['status', 'updatedAt'])`. Once `delivered` or `cancelled`, non-admins are locked out of any further updates.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on User Create**: `{ id: uid, email: 'a@b.com', displayName: 'Alice', role: 'user', isSuperAdmin: true, createdAt: '...', updatedAt: '...' }` -> Rejected by `hasOnly`.
2. **Self-Assigned Admin Role on User Create**: `{ id: uid, email: 'attacker@evil.com', displayName: 'Attacker', role: 'admin', createdAt: '...', updatedAt: '...' }` -> Rejected because `role == 'user' || isAdmin()` fails.
3. **Unverified Admin Email Spoof**: Token with `email: 'junaeidshohan2005@gmail.com'` and `email_verified: false` attempting admin write -> Rejected by `request.auth.token.email_verified == true`.
4. **PII Cross-User Scrape (`get` / `list`)**: Authenticated user `uid_B` reading `users/uid_A` or listing `users` -> Rejected by owner/admin gate.
5. **Privilege Escalation on User Update**: User updating `users/uid_A` with `{ role: 'admin' }` -> Rejected by `affectedKeys().hasOnly(...)` and `incoming().role == existing().role`.
6. **ID Poisoning Attack**: Document ID > 128 chars or containing special characters (`..`, `/`, spaces) -> Rejected by `isValidId()`.
7. **Denial-of-Wallet Oversized String**: `deliveryAddress` with 50,000 characters -> Rejected by `.size() <= 512` in `isValidOrder()`.
8. **Order Spoofing (`userId` mismatch)**: User `uid_A` creating an order with `userId: 'uid_B'` -> Rejected by `incoming().userId == request.auth.uid`.
9. **Order Status Shortcutting on Create**: User creating an order with `status: 'delivered'` -> Rejected (`incoming().status == 'pending'`).
10. **Terminal State Re-opening**: Customer attempting to update an already `'delivered'` or `'cancelled'` order back to `'pending'` -> Rejected (`existing().status == 'pending'`).
11. **Order Price Tampering on Update**: Customer updating `total: 0.01` alongside `status: 'cancelled'` -> Rejected by `affectedKeys().hasOnly(['status', 'updatedAt'])`.
12. **Unauthorized Menu Mutation**: Regular signed-in user adding or deleting `menuItems/{id}` -> Rejected (`isAdmin()` required).
