# Requirements Document

## Introduction

This feature adds a complete user account system to Visual Automata Studio — a React/TypeScript/Vite single-page application that teaches automata theory through interactive lessons, challenges, and a canvas-based playground. The system comprises three integrated areas:

1. **User Authentication** — Sign-up, login, logout, and session persistence using a managed provider (Supabase), so that passwords are never stored in plaintext and no secrets are hardcoded.
2. **User Profile & Settings** — A profile page accessible from the existing navigation where authenticated users can view and update their display name.
3. **Persistent Learning Progress** — Cloud-backed storage of completed lessons, earned XP, challenge history, and streak data, scoped per authenticated user and isolated across accounts, while guest/local-storage behaviour is preserved for unauthenticated visitors.

The feature must not alter the automata simulation logic, the Clean Canvas design language, or any existing page outside its own integration points.

---

## Glossary

- **Auth_Service**: The Supabase authentication module that handles credential management, token issuance, and session lifecycle.
- **Auth_Provider**: The React context provider that wraps the application and exposes the current session state to all child components.
- **Auth_Guard**: A route-level component that redirects unauthenticated users to the login page and returns them to their original destination after successful login.
- **Progress_Service**: The cloud storage module that reads and writes a user's `LearningState` record to the Supabase database.
- **Progress_Store**: The existing `ProgressManager` class (`src/features/learning/progressStore.ts`) that manages in-memory learning state and currently persists to `localStorage`.
- **Profile_Service**: The Supabase database module that stores and retrieves a user's display name and account metadata.
- **Sign_Up_Page**: The `/signup` route that collects name, email, and password from a new user.
- **Login_Page**: The `/login` route that collects email and password from a returning user.
- **Profile_Page**: The `/profile` route that displays and allows editing of the authenticated user's name and email.
- **Account_Menu**: The dropdown in the sidebar and mobile navigation that exposes Profile and Logout actions to authenticated users.
- **Guest_Mode**: The unauthenticated state where progress is stored in `localStorage` only, preserving existing behaviour.
- **LearningState**: The TypeScript interface defined in `src/features/learning/types.ts` that holds `completedLessons`, `completedChallenges`, `rewardedIds`, `totalXP`, `streak`, and `lastActiveDate`.
- **Session**: A Supabase-issued JWT token stored in the browser that identifies the authenticated user across page refreshes.
- **Environment_Variable**: A value declared in `.env.local` and referenced via `import.meta.env.*` in Vite, never committed to version control; a safe `.env.example` is committed instead.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to create an account with my name, email, and password, so that my learning progress can be saved and accessed from any device.

#### Acceptance Criteria

1. THE Sign_Up_Page SHALL render a form with fields for display name, email address, and password.
2. WHEN a user submits the sign-up form with a display name between 1 and 50 non-whitespace characters, a correctly formatted email, and a password between 8 and 128 characters, THE Auth_Service SHALL create a new account and establish a Session.
3. WHEN a user submits the sign-up form with an email address that does not match the RFC 5322 format, THE Sign_Up_Page SHALL display an inline validation error on the email field before contacting the Auth_Service.
4. WHEN a user submits the sign-up form with a password shorter than eight characters or longer than 128 characters, THE Sign_Up_Page SHALL display an inline validation error on the password field before contacting the Auth_Service.
5. WHEN a user submits the sign-up form with an empty required field, THE Sign_Up_Page SHALL display an inline validation error on each empty field before contacting the Auth_Service.
6. WHEN the Auth_Service returns an error indicating the email address is already registered, THE Sign_Up_Page SHALL display an error message identifying the conflict as a duplicate email without exposing raw server error text.
7. WHILE a sign-up submission is in progress, THE Sign_Up_Page SHALL display a loading indicator and disable the submit button to prevent duplicate submissions.
8. WHEN account creation succeeds, THE Auth_Service SHALL store the Session in browser storage and THE Sign_Up_Page SHALL redirect the user to the Dashboard page within 2 seconds.
9. THE Auth_Service SHALL store credentials using the hashing and salting mechanism provided by the managed authentication provider.
10. THE Sign_Up_Page SHALL never transmit or log a plaintext password beyond the HTTPS transport layer.
11. THE Sign_Up_Page SHALL include a link to the Login_Page for users who already have an account.
12. WHEN the Auth_Service is unreachable or returns an unexpected error, THE Sign_Up_Page SHALL re-enable the submit button, preserve all field values, and display a user-readable error message indicating the service is unavailable.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my saved progress on any device.

#### Acceptance Criteria

1. THE Login_Page SHALL render a form with fields for email address and password.
2. WHEN a user submits the login form with a registered email and the correct password, THE Auth_Service SHALL issue a Session and THE Login_Page SHALL redirect the user to the URL preserved in the `redirect` query parameter, or to the Dashboard page if no redirect parameter is present.
3. IF a user submits the login form with an unregistered email or an incorrect password, THEN THE Login_Page SHALL display a single error message indicating the credentials are invalid, without specifying which field was wrong.
4. IF a user submits the login form with an empty required field or a malformed email address, THEN THE Login_Page SHALL display an inline validation error on each invalid field before contacting the Auth_Service.
5. WHILE a login submission is in progress, THE Login_Page SHALL display a loading indicator and disable the submit button.
6. THE Login_Page SHALL include a link to the Sign_Up_Page for users who do not yet have an account.
7. WHILE a user is unauthenticated, WHEN the user navigates to a protected route, THE Auth_Guard SHALL redirect the user to the Login_Page and preserve the original destination URL as the value of a `redirect` query parameter.
8. WHEN a login request fails due to a network timeout or service unavailability, THE Login_Page SHALL re-enable the submit button, preserve all field values, and display a user-readable error message indicating the service is unavailable.

---

### Requirement 3: Session Persistence and Logout

**User Story:** As an authenticated user, I want my session to survive a page refresh, so that I do not need to log in again every time I visit.

#### Acceptance Criteria

1. WHEN an authenticated user refreshes the browser page and the stored Session token is present and not expired, THE Auth_Provider SHALL restore the Session from localStorage without requiring the user to log in again.
2. WHEN a user triggers the Logout action from the Account_Menu, THE Auth_Service SHALL revoke the Session, THE Auth_Provider SHALL clear all session tokens and user identity data from in-memory state and from localStorage, and the application SHALL redirect the user to the Login_Page.
3. WHEN the server-side session revocation fails during logout, THE Auth_Provider SHALL still clear all session tokens and user identity data from in-memory state and localStorage and redirect the user to the Login_Page.
4. IF the stored Session token is expired and a single silent refresh attempt within 5 seconds fails, THEN THE Auth_Provider SHALL clear the session and redirect the user to the Login_Page.
5. IF no valid Session exists, THEN THE Auth_Guard SHALL prevent access to all routes marked as requiring authentication in the application route configuration and redirect the user to the Login_Page.

---

### Requirement 4: Protected Routes

**User Story:** As an application owner, I want certain pages to require authentication, so that unauthenticated users cannot access account-specific content.

#### Acceptance Criteria

1. IF a user is unauthenticated and attempts to access the `/profile` route, THEN THE Auth_Guard SHALL redirect the user to the Login_Page without rendering any protected content.
2. WHEN an unauthenticated user attempts to navigate directly to a protected URL, THE Auth_Guard SHALL preserve the full pathname and search parameters as the value of a `redirect` query parameter appended to the Login_Page URL.
3. WHILE authentication state is being resolved on initial load, THE Auth_Guard SHALL not render protected page content and SHALL not issue any navigation redirect.
4. THE Dashboard, Learn, Challenges, Projects, Playground, and About pages SHALL remain accessible to unauthenticated users.
5. THE Auth_Guard SHALL not be applied to the Dashboard, Learn, Challenges, Projects, Playground, and About routes.
6. THE Login_Page and Sign_Up_Page SHALL remain accessible to unauthenticated users and SHALL not be wrapped by the Auth_Guard.

---

### Requirement 5: User Profile and Display Name

**User Story:** As an authenticated user, I want to view my name and email, and update my display name, so that the application reflects my preferred identity.

#### Acceptance Criteria

1. THE Profile_Page SHALL display the authenticated user's current display name and email address.
2. WHEN an authenticated user submits the update form with a non-empty display name of at most 50 characters, THE Profile_Service SHALL persist the new name.
3. WHEN the Profile_Service successfully persists the new display name, THE Profile_Page SHALL reflect the updated name without requiring a page reload.
4. IF a user submits an empty or whitespace-only display name, THEN THE Profile_Page SHALL display a validation error indicating the name is required and SHALL NOT contact the Profile_Service.
5. WHILE a profile update is in progress, THE Profile_Page SHALL display a loading indicator and disable the submit button.
6. WHEN the Profile_Service returns an error during a name update, THE Profile_Page SHALL display a user-readable error message that indicates the cause and SHALL restore the form to the previous value.
7. WHEN a profile update succeeds, THE Profile_Page SHALL display a transient success message for between 2 and 5 seconds.
8. THE Profile_Page SHALL be reachable by clicking the Profile action in the Account_Menu.

---

### Requirement 6: Account Menu in Navigation

**User Story:** As an authenticated user, I want quick access to my profile and a logout action from the navigation, so that I can manage my account without hunting through the application.

#### Acceptance Criteria

1. WHILE a user is authenticated, THE Account_Menu SHALL appear in both the Sidebar and the MobileNav in the same bottom section where the theme-toggle button resides.
2. WHILE a user is authenticated, THE Account_Menu SHALL display the authenticated user's display name and an initial badge derived from the first character of the display name.
3. WHEN a user clicks the Account_Menu trigger, THE Account_Menu SHALL display two actions: "Profile" navigating to `/profile`, and "Logout" triggering the logout flow; the menu SHALL close after an action is selected or after the user clicks outside the menu.
4. IF a user is unauthenticated, THEN THE Account_Menu SHALL be replaced by a "Sign In" button that navigates to the Login_Page.
5. WHEN the Account_Menu Logout action is triggered, THE Auth_Service SHALL revoke the session per Requirement 3.2 and THE Account_Menu trigger SHALL revert to the "Sign In" button.
6. WHILE authentication state is being resolved on initial load, THE navigation SHALL not render either the Account_Menu or the "Sign In" button until the state is known.
7. WHEN the logout server-revocation fails, THE Account_Menu trigger SHALL still revert to the "Sign In" button and the user SHALL be redirected to the Login_Page.

---

### Requirement 7: Persistent Cloud Learning Progress

**User Story:** As an authenticated user, I want my completed lessons, earned XP, and challenge history to be saved to my account, so that my progress is available when I log in from any device.

#### Acceptance Criteria

1. WHEN an authenticated user completes a lesson, THE Progress_Service SHALL write the updated `LearningState` to the Supabase database scoped to that user's account identifier.
2. WHEN an authenticated user completes a challenge, THE Progress_Service SHALL write the updated `LearningState` to the Supabase database scoped to that user's account identifier.
3. WHEN an authenticated user opens the application after a previous session, THE Progress_Service SHALL load the user's `LearningState` from the database and initialise THE Progress_Store with that data within 10 seconds; no progress UI SHALL render until the Progress_Store is initialised or the load has definitively failed.
4. WHEN an authenticated user logs out and a different authenticated user logs in on the same browser, THE Progress_Store SHALL load the new user's `LearningState` so that the previously logged-in user's data is never shown to the second user.
5. IF a database read request is authenticated as user A and targets a row belonging to user B, THEN THE Progress_Service SHALL reject the request and return an authorisation error.
6. IF a database write request is authenticated as user A and targets a row belonging to user B, THEN THE Progress_Service SHALL reject the request and return an authorisation error.
7. WHEN a user's `LearningState` row does not yet exist in the database (first login), THE Progress_Service SHALL create an empty initial record equivalent to `EMPTY_STATE` defined in `progressStore.ts`.
8. WHEN cloud persistence fails due to a network error, THE Progress_Store SHALL continue operating using the in-memory state, SHALL log a warning, and SHALL queue the failed completion for retry; the retry queue SHALL hold at most 100 entries and SHALL flush all queued completions in recorded order on the next successful database write.
9. WHEN the Progress_Service fails to load `LearningState` from the database, THE Progress_Store SHALL initialise with `EMPTY_STATE`, SHALL display an error message to the user, and SHALL feed any in-session completions into the retry queue.

---

### Requirement 8: Guest Mode and Progress Migration

**User Story:** As a visitor using the application without an account, I want my progress to be saved locally, so that I do not lose my work before deciding to create an account.

#### Acceptance Criteria

1. WHILE a user is unauthenticated, THE Progress_Store SHALL persist `completedLessons`, `completedChallenges`, `challengeAttempts`, `rewardedIds`, `totalXP`, `streak`, and `lastActiveDate` fields of `LearningState` to `localStorage` using the existing `STORAGE_KEY` key.
2. WHEN an unauthenticated user creates an account or logs in and local `LearningState` exists in `localStorage`, THE Progress_Service SHALL merge the local progress with the cloud record within the same operation that establishes the Session, combining completed lessons, completed challenges, rewarded IDs, and summing XP without duplication; for any `lessonId` or `challengeId` present in both records, the entry with the higher score or xpAwarded value SHALL be retained and unique keys from both records SHALL be unioned.
3. WHEN performing a migration merge, THE Progress_Service SHALL treat `rewardedIds` as a deduplication ledger so that XP already present in both the local and cloud records is counted only once.
4. WHEN the cloud write of the merged `LearningState` succeeds, THE Progress_Service SHALL remove the `localStorage` entry to prevent it from being re-applied on subsequent logins.
5. WHEN the cloud write of the merged `LearningState` fails, THE Progress_Service SHALL retain the `localStorage` entry unchanged so that guest progress is not permanently lost.

---

### Requirement 9: Progress Data Isolation

**User Story:** As a user, I want to be confident that my learning progress cannot be seen or changed by another user, so that my account data remains private.

#### Acceptance Criteria

1. WHEN an authenticated user requests progress data belonging to a different user, THE Progress_Service SHALL reject the request and return an authorisation error, returning no progress data from the targeted user's records.
2. WHEN a request is executed without an authenticated session token, THE Progress_Service SHALL reject the request and return an authorisation error, returning no progress data.
3. THE Progress_Service SHALL never include another user's identifier or `LearningState` in any API response returned to the requesting client.
4. WHEN an authenticated user attempts to create or modify a progress record belonging to a different user, THE Progress_Service SHALL reject the operation and return an authorisation error, leaving the targeted user's records unchanged.

---

### Requirement 10: Environment Configuration and Secrets Management

**User Story:** As a developer setting up the project, I want clear documentation on required environment variables, so that I can configure the application without risking exposure of secrets.

#### Acceptance Criteria

1. THE application SHALL read the Supabase project URL and anon key exclusively from `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` at runtime.
2. THE repository SHALL contain a `.env.example` file listing all required environment variable names, each with a non-empty descriptive placeholder string and a single-line comment of at least 5 words explaining the variable's purpose.
3. THE `.gitignore` file SHALL include `.env.local` and `.env` to prevent secrets from being committed to version control.
4. IF the `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` environment variables are absent at application startup, THEN THE Auth_Service SHALL call `console.error` with a readable message, SHALL not create a Supabase client, and SHALL set its initialisation state to failed; auth-related UI elements SHALL be hidden or replaced with an "unavailable" notice while all non-auth pages remain accessible.

---

### Requirement 11: TypeScript Compliance and Test Coverage

**User Story:** As a maintainer, I want the new feature code to pass TypeScript checks and have relevant tests, so that regressions are caught automatically.

#### Acceptance Criteria

1. WHEN the `tsc -b` build command is executed against the project, THE compiler SHALL report zero type errors in all files added or modified by this feature.
2. THE Progress_Service migration merge function SHALL have a property-based test that, FOR ALL pairs of valid `LearningState` objects, verifies the merged result contains no duplicate entries in `rewardedIds` and the merged `totalXP` equals the sum of unique XP contributions from both inputs as determined by the `rewardedIds` deduplication ledger.
3. THE evaluator normalisation function `normalizeAnswer` SHALL have a property-based test verifying that, FOR ALL non-empty strings, applying `normalizeAnswer` twice produces the same result as applying it once (idempotence).
4. THE `deserializeProject` parser SHALL have a round-trip property test verifying that, FOR ALL valid `SavedProject` objects, serialising then deserialising produces an object with equivalent `name`, `machine`, `nodePositions`, and `formatVersion` fields (excluding `savedAt`, which is regenerated on serialization).
5. WHEN the `npm test` command is executed, THE test runner SHALL complete all tests with zero failures.
6. THE existing tests in `src/engine/engine.test.ts` and `src/features/learning/learning.test.ts` SHALL continue to pass without modification.
