# Security Specification & Test-Driven Security Design (TDD)

## 1. Data Invariants

Our music app manages user profiles/interactions and custom music playlists. The security rules protect these assets based on the following mathematical invariants:

*   **Pillar 1: User Profile Isolation**: A user's profile document (`/users/{userId}`) is strictly owned by `{userId}`. No other authenticated or unauthenticated user can read or write to this document.
*   **Pillar 2: Playlist Access control**: A playlist is private by default. A private playlist (`isPublic` is `false`) can only be read by its creator (`creatorId == request.auth.uid`). A public playlist (`isPublic` is `true`) can be read by any signed-in user.
*   **Pillar 3: Playlist Lifecycle & Write Integrity**: Playlists can only be created, updated, or deleted by their verified creators (`creatorId == request.auth.uid`).
*   **Pillar 4: Immutable Fields**: Key metadata of playlists (`id`, `creatorId`, `creatorName`, `createdAt`) are entirely immutable once created. They cannot be modified in any update operation.
*   **Pillar 5: Server Time Synchronization**: All update and creation timestamps must rely on `request.time` (the server's internal secure clock), and not a client-provided time.
*   **Pillar 6: Bound Enforcement**: All lists, names, and descriptions are heavily bounded (e.g., maximum size for names, max size for the list of tracks) to protect against resource exhaustion and Denial-of-Wallet attacks.
*   **Pillar 7: Email Verification Enforcements**: All write operations require verified email registration (`request.auth.token.email_verified == true`).

---

## 2. The "Dirty Dozen" Payloads (Exploit Payloads)

These twelve payloads attempt to violate security boundaries, bypass role validations, hijack resource ownership, or inject massive strings.

### Payload 1: Profile Spoofing Attack
*   **Target Path**: `/users/victim_user`
*   **Actor**: `attacker_user`
*   **Payload**:
    ```json
    {
      "uid": "victim_user",
      "email": "victim@gmail.com",
      "displayName": "Victim User",
      "listeningMinutes": 500
    }
    ```
*   **Reason for Rejection**: Actor UID (`attacker_user`) does not match the target document ID (`victim_user`), nor does it match the `uid` specified in the body.

### Payload 2: Privilege Self-Elevation / Ghost Fields
*   **Target Path**: `/users/attacker_user`
*   **Actor**: `attacker_user`
*   **Payload**:
    ```json
    {
      "uid": "attacker_user",
      "email": "attacker@gmail.com",
      "displayName": "Attacker",
      "isAdmin": true,
      "role": "admin"
    }
    ```
*   **Reason for Rejection**: The validation helper enforces strict keys, and the `users` document does not permit shadow fields like `isAdmin` or `role`.

### Payload 3: Unverified Identity Registration
*   **Target Path**: `/users/unverified_user`
*   **Actor**: `unverified_user` (`email_verified` is `false`)
*   **Payload**:
    ```json
    {
      "uid": "unverified_user",
      "email": "unverified@gmail.com",
      "displayName": "Unverified Joe",
      "likedTracks": []
    }
    ```
*   **Reason for Rejection**: Requires `request.auth.token.email_verified == true`.

### Payload 4: Denial of Wallet / Bulk Inject Attack
*   **Target Path**: `/users/attacker_user`
*   **Actor**: `attacker_user`
*   **Payload**:
    ```json
    {
      "uid": "attacker_user",
      "email": "attacker@gmail.com",
      "displayName": "A".repeat(50000), 
      "likedTracks": []
    }
    ```
*   **Reason for Rejection**: Field size limits violated (e.g., `displayName` must be less than or equal to 100 characters).

### Payload 5: Playlist Author Spoofing
*   **Target Path**: `/playlists/new_playlist_id`
*   **Actor**: `attacker_user`
*   **Payload**:
    ```json
    {
      "id": "new_playlist_id",
      "name": "Attacker's Mix",
      "trackIds": [],
      "creatorId": "victim_user",
      "creatorName": "Victim User",
      "createdAt": "2026-06-13T00:00:00Z"
    }
    ```
*   **Reason for Rejection**: `creatorId` in the written data must match the authenticating UID (`attacker_user`).

### Payload 6: Playlist Read Hijacking (Private Snooping)
*   **Target Path**: `/playlists/private_playlist_creator_victim`
*   **Actor**: `attacker_user`
*   **Payload**: GET request (Direct read lookups)
*   **Reason for Rejection**: Playlist `isPublic` is false, and `creatorId` (`victim_user`) is not equal to `request.auth.uid` (`attacker_user`).

### Payload 7: Playlist Modification Hijack
*   **Target Path**: `/playlists/victim_playlist`
*   **Actor**: `attacker_user`
*   **Payload**:
    ```json
    {
      "name": "Hacked Name"
    }
    ```
*   **Reason for Rejection**: Actor is not the playlist creator.

### Payload 8: Immutable Creator Hijacking on Update
*   **Target Path**: `/playlists/attacker_playlist`
*   **Actor**: `attacker_playlist_creator_attacker`
*   **Payload**:
    ```json
    {
      "name": "Updated Playlist Name",
      "creatorId": "victim_user"
    }
    ```
*   **Reason for Rejection**: `creatorId` can never be altered on update (`incoming().creatorId == existing().creatorId`).

### Payload 9: Playlist ID Poisoning / Traversal Guard
*   **Target Path**: `/playlists/../invalid-id`
*   **Actor**: `authenticated_user`
*   **Payload**: Creation attempt
*   **Reason for Rejection**: Path variable `playlistId` must match the alphanumeric guard `isValidId()`.

### Payload 10: Playlist Array Size Poisoning
*   **Target Path**: `/playlists/user_playlist_id`
*   **Actor**: `user_playlist_creator`
*   **Payload**:
    ```json
    {
      "name": "My favorites",
      "trackIds": ["track_id"].repeat(1001),
      "creatorId": "user_playlist_creator"
    }
    ```
*   **Reason for Rejection**: Maximum list bounds exceeded (`trackIds.size() <= 100`).

### Payload 11: Playlist Temporal Spoofing
*   **Target Path**: `/playlists/new_playlist`
*   **Actor**: `authenticated_user`
*   **Payload**:
    ```json
    {
      "id": "new_playlist",
      "name": "Future hits",
      "trackIds": [],
      "creatorId": "authenticated_user",
      "creatorName": "User",
      "createdAt": "2035-01-01T00:00:00Z"
    }
    ```
*   **Reason for Rejection**: `createdAt` must match rules server time `request.time`.

### Payload 12: Affected Keys Update-Gap Bypass
*   **Target Path**: `/playlists/user_playlist_id`
*   **Actor**: `user_playlist_creator`
*   **Payload**: Attempting to update `name` and silently injecting a modified `createdAt` in the same bundle.
*   **Reason for Rejection**: Modification action is restricted by `affectedKeys().hasOnly(['name', 'description'])` logic gate.

---

## 3. Test Suite Plan (`firestore.rules.test.ts`)

In true security testing environments, tests compile the ruleset and load the security local runner emulator to run queries. The structured tests should conceptually map to the following structure:

```ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Verification mappings are detailed here. All testing of the 12 Dirty Dozen payloads must fail assertions as described.
```
