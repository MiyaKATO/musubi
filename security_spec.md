# Security Specification for DocHub Portal

## 1. Data Invariants
- **Link Integrity**: Every document in the `links` collection must have `title`, `url`, `category`, and `sourceType`.
- **Enumerations**: 
  - `category` must be one of `['test', 'design', 'knowledge']`.
  - `sourceType` must be one of `['box', 'drive', 'local', 'other']`.
- **Identity**: `createdBy` must match `request.auth.uid` upon creation and is immutable.
- **Timestamps**: 
  - `createdAt` must be `request.time` on creation and immutable.
  - `updatedAt` must be `request.time` on every write.
- **Access Control**:
  - `read`: Authenticated users can list and get.
  - `create`: Authenticated users with verified emails.
  - `update`: Only the original creator or an Admin can update.
  - `delete`: Only the original creator or an Admin can delete.
- **Admin**: User `kato-miya@yubisui.co.jp` is a bootstrapped admin.

## 2. The Dirty Dozen (Payloads to Reject)
1. **Unauthenticated Write**: Attempting to `create` a link without being signed in.
2. **Identity Spoofing**: Setting `createdBy` to `some-other-uuid` during `create`.
3. **Ghost Fields**: Including `isVerified: true` in the `create` or `update` payload.
4. **Invalid Category**: Setting `category` to `personal`.
5. **PII Leak**: Querying for links where `createdBy` is `null` (if we had private fields).
6. **Immutable Field Tampering**: Attempting to change `createdAt` during an `update`.
7. **Bypassing Timestamp**: `create` without `createdAt` being a server timestamp.
8. **Unauthorized Update**: User A attempting to update User B's link.
9. **Unauthorized Delete**: User A attempting to delete User B's link.
10. **Resource Poisoning**: `title` exceeding 100 characters or containing a 1MB string.
11. **Malicious ID**: Attempting to create a document with ID `../../secrets`.
12. **State Jilting**: Updating a link without providing the mandatory `updatedAt` server timestamp.

## 3. Test Runner (Conceptual)
All the above must return `PERMISSION_DENIED`.
