# OAuth2 Implementation Plan - Updated

## Overview

This document outlines the complete implementation plan for migrating from `X-User-ID` header authentication to OAuth2 with Google Sign-In. **This is a full migration with no backward compatibility** - all users must authenticate via Google OAuth.

## Key Decisions

1. **Full Migration**: Complete removal of `X-User-ID` header support
2. **Dev Mode Strategy**: Test data seeded with `writemileslee@gmail.com`
3. **Token-Based**: JWT access and refresh tokens for all API authentication
4. **Chrome Identity API**: Using `chrome.identity.getAuthToken()` for Google OAuth (simpler than authorization code flow)
5. **Backend Token Verification**: Backend verifies Google access tokens and issues own JWTs

## Dev Mode Test Data Strategy

### Configuration

**Environment Variables** (`backend/.env`):
```bash
ENVIRONMENT=dev
DEV_TEST_EMAIL=writemileslee@gmail.com
```

### Implementation

1. **Migration Script Updates**:
   - Read `DEV_TEST_EMAIL` from environment (default: `writemileslee@gmail.com`)
   - Create test user with this email (no user_id needed - will use email/google_id)
   - Seed test data (tracked sites, usage records) for this user
   - Log clear instructions about which email to use for sign-in

2. **User Matching**:
   - When user signs in with Google, backend matches by email
   - If email matches `DEV_TEST_EMAIL` in dev mode, user sees seeded test data
   - User record is created/updated with Google OAuth info (email, google_id)

3. **Extension Behavior**:
   - Extension detects dev mode (localhost API URL)
   - Shows dev mode indicator in UI
   - User must sign in with Google account using `writemileslee@gmail.com`
   - After sign-in, test data is immediately visible

## Implementation Checklist

### Backend Implementation

#### Phase 1: Dependencies & Infrastructure

- [ ] **Add OAuth dependencies** to `requirements.txt`:
  ```txt
  python-jose[cryptography]>=3.3.0
  python-multipart>=0.0.6
  ```

- [ ] **Create JWT utilities** (`infrastructure/auth/jwt_utils.py`):
  - `generate_access_token(user_email: str, user_id: str) -> str`
  - `generate_refresh_token(user_email: str, user_id: str) -> str`
  - `validate_token(token: str) -> dict`
  - `decode_token(token: str) -> dict`

- [ ] **Create Google OAuth client** (`infrastructure/adapters/google_oauth_client.py`):
  - `verify_access_token(access_token: str) -> dict`: Verify token with Google tokeninfo endpoint
  - `get_user_info(access_token: str) -> dict`: Get user info from Google userinfo endpoint
  - `get_user_id_from_token(token_info: dict) -> str`: Extract Google user ID (sub)
  - Error handling for OAuth API calls

#### Phase 2: Database & Domain Layer

- [ ] **Update User model** (`infrastructure/database/models.py`):
  - Add `google_id` column (String, unique, nullable)
  - Add `oauth_provider` column (String, default='google')
  - Add index on `email` for faster lookups
  - Keep `id` as primary key (UUID)

- [ ] **Update UserRepository interface** (`domain/interfaces/user_repository.py`):
  - Add `get_user_by_email(email: str) -> Optional[User]`
  - Add `get_user_by_google_id(google_id: str) -> Optional[User]`
  - Add `create_user_from_oauth(email: str, google_id: str) -> User`
  - Add `update_user_oauth(user_id: str, google_id: str) -> None`

- [ ] **Update UserRepository implementation** (`infrastructure/adapters/user_repository_impl.py`):
  - Implement new methods for OAuth user lookup
  - Handle user creation/update from OAuth data

- [ ] **Create AuthService** (`domain/services/auth_service.py`):
  - `authenticate_google_user(email: str, google_id: str) -> User`
  - `get_or_create_user_from_oauth(email: str, google_id: str) -> User`
  - Business logic for OAuth user management

- [ ] **Create AuthService interface** (`domain/interfaces/auth_service.py`):
  - Define port for auth service

#### Phase 3: Application Layer

- [ ] **Create auth schemas** (`application/schemas.py`):
  - `GoogleVerifyRequest`: Google access token from extension
  - `TokenResponse`: JWT access token, refresh token, expiry, user info
  - `RefreshTokenRequest`: Refresh token
  - `UserResponse`: User info (id, email)

- [ ] **Create auth router** (`application/routers/auth.py`):
  - `POST /api/auth/google/verify`: Verify Google access token and issue JWT tokens
    - Accepts Google access token from extension
    - Verifies token with Google (userinfo endpoint or tokeninfo)
    - Creates/updates user in database
    - Issues JWT access and refresh tokens
  - `POST /api/auth/refresh`: Refresh access token using refresh token
  - Error handling and validation

- [ ] **Create `get_current_user` dependency** (`application/dependencies.py`):
  - Extract Bearer token from `Authorization` header
  - Validate JWT token
  - Get user from database
  - Raise 401 if invalid/expired

- [ ] **Update existing routers**:
  - `application/routers/usage.py`: Replace `get_user_id` with `get_current_user`
  - `application/routers/tracked_sites.py`: Replace `get_user_id` with `get_current_user`
  - Remove `X-User-ID` header dependency

- [ ] **Update app.py**:
  - Include auth router
  - Update CORS to allow credentials

#### Phase 4: Migration & Dev Mode

- [ ] **Update migration script** (`infrastructure/database/migrate.py`):
  - **Update `seed_fake_data()` function**:
    - Read `DEV_TEST_EMAIL` from environment (default: `writemileslee@gmail.com`)
    - Remove hardcoded user_id logic (let User model generate UUID automatically)
    - Create test user with updated User model fields:
      - `email`: Use `DEV_TEST_EMAIL` value
      - `google_id`: Use a placeholder/test value (e.g., `f"dev-{DEV_TEST_EMAIL}"` or `"dev-test-google-id"`)
      - `oauth_provider`: Set to `"google"`
      - `id`: Let model auto-generate UUID (remove hardcoded "123")
    - Seed tracked sites and usage records using the created user's ID
    - Log clear instructions about which email to use for Google sign-in
    - Update logging to show test email instead of user ID
  
  **Example updated `seed_fake_data()` structure:**
  ```python
  def seed_fake_data():
      environment = os.getenv("ENVIRONMENT", "prod").lower()
      is_dev = environment == "dev"
      
      if is_dev:
          test_email = os.getenv("DEV_TEST_EMAIL", "writemileslee@gmail.com")
          logger.info(f"🔧 DEV MODE: Seeding data for {test_email}")
          logger.info(f"⚠️  Sign in with Google account: {test_email}")
          
          # Create user with OAuth fields
          user = User(
              email=test_email,
              google_id=f"dev-{test_email}",  # Placeholder - will be updated on OAuth sign-in
              oauth_provider="google"
          )
          # id will be auto-generated UUID
          db.add(user)
          db.commit()
          db.refresh(user)
          
          # Seed tracked sites and usage records using user.id...
      else:
          # Production: don't seed data
          return
  ```
  
  **Note**: The placeholder `google_id` in dev mode will be replaced with the real Google ID when the user signs in via OAuth. The OAuth callback endpoint will:
  1. Look up user by email (matches `DEV_TEST_EMAIL`)
  2. Update `google_id` with the real Google ID from OAuth response
  3. Return JWT tokens for the user
  
  - **Update indexes** in `create_indexes()`:
    - Add index on `users.email` for faster OAuth lookups: 
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`
    - Keep existing indexes for usage_records and tracked_sites

- [ ] **Database schema migration** (handled automatically by SQLAlchemy):
  - User model will have new fields: `google_id`, `oauth_provider`
  - `create_all_tables()` will create tables with new schema
  - No manual ALTER TABLE needed (migrate script drops/recreates tables)

### Extension Implementation

#### Phase 1: Authentication Infrastructure

- [ ] **Update manifest.json**:
  - Add `"identity"` permission
  - Add `"oauth2"` block with:
    - `client_id`: Google OAuth client ID (Chrome Extension type)
    - `scopes`: `["openid", "email", "profile"]`
  - Add `"key"` field to ensure stable extension ID (required for OAuth client matching)

- [ ] **Create token manager** (`src/popup/utils/tokenManager.ts`):
  - `storeTokens(accessToken, refreshToken, expiry, userEmail, userId)`
  - `getAccessToken() -> string | null`
  - `getRefreshToken() -> string | null`
  - `isTokenExpired() -> boolean`
  - `clearTokens()`
  - `refreshTokenIfNeeded() -> Promise<string>`

- [ ] **Create auth utilities** (`src/popup/utils/auth.ts`):
  - `signInWithGoogle() -> Promise<TokenResponse>`:
    - Call `chrome.identity.getAuthToken({ interactive: true })` to get Google access token
    - Send access token to backend `/api/auth/google/verify`
    - Backend verifies token and returns JWT tokens
    - Store JWT tokens locally
  - `signOut() -> Promise<void>`:
    - Clear local tokens
    - Call `chrome.identity.removeCachedAuthToken()` to revoke Google token
  - `isAuthenticated() -> Promise<boolean>`
  - `getCurrentUser() -> Promise<User | null>`

#### Phase 2: UI Components

- [ ] **Create AuthButton component** (`src/popup/components/AuthButton.tsx`):
  - Sign in button (when not authenticated)
  - Sign out button (when authenticated)
  - Loading states
  - Error handling

- [ ] **Create UserProfile component** (`src/popup/components/UserProfile.tsx`):
  - Display user email
  - Show dev mode indicator (if localhost)
  - User info display

- [ ] **Create useAuth hook** (`src/popup/hooks/useAuth.ts`):
  - `isAuthenticated` state
  - `user` state (email, id)
  - `signIn()` function
  - `signOut()` function
  - `loading` state

- [ ] **Update App.tsx**:
  - Add auth UI (AuthButton, UserProfile)
  - Conditionally render content based on auth state
  - Show "Please sign in" message when not authenticated
  - Show dev mode indicator when in dev mode

#### Phase 3: API Client Updates

- [ ] **Update API client** (`src/popup/utils/api.ts`):
  - Remove `getUserId()` function
  - Remove `X-User-ID` header logic
  - Add `getAuthHeader() -> { Authorization: string }`
  - Update all API calls to use Bearer token
  - Add automatic token refresh before API calls
  - Handle 401 errors (redirect to sign-in)

- [ ] **Update background script** (`src/background.ts`):
  - Add token refresh logic for background sync
  - Handle token expiry during sync operations
  - Retry sync after token refresh

#### Phase 4: Dev Mode Detection

- [ ] **Add dev mode utilities**:
  - Detect dev mode (localhost API URL)
  - Show dev mode indicator
  - Log dev mode status

### Testing

#### Backend Tests

- [ ] **Unit Tests**:
  - `__tests__/domain/test_auth_service.py`: Auth service logic
  - `__tests__/infrastructure/test_jwt_utils.py`: JWT generation/validation
  - `__tests__/infrastructure/test_google_oauth_client.py`: Google OAuth client (mocked)

- [ ] **Integration Tests**:
  - `__tests__/test_auth_router.py`: OAuth callback, token refresh
  - `__tests__/test_protected_routes.py`: Protected route access
  - `__tests__/infrastructure/test_user_repository_impl.py`: OAuth user lookup

#### Extension Tests

- [ ] **Unit Tests**:
  - `__tests__/popup/utils/auth.test.ts`: Auth utilities
  - `__tests__/popup/utils/tokenManager.test.ts`: Token management
  - `__tests__/popup/components/AuthButton.test.tsx`: Auth button
  - `__tests__/popup/hooks/useAuth.test.ts`: Auth hook

- [ ] **Integration Tests**:
  - `__tests__/popup/utils/api.test.ts`: Bearer token usage
  - `__tests__/background.test.ts`: Token refresh in background

### Documentation

- [x] **Create `docs/authentication.md`**:
  - Architecture diagrams
  - Authentication flows
  - Token management
  - Dev mode setup
  - Troubleshooting

- [ ] **Update `README.md`**:
  - OAuth2 setup instructions
  - Google OAuth credentials setup
  - Dev mode configuration
  - Update API endpoint documentation
  - Remove X-User-ID references

- [ ] **Update `backend/README.md`**:
  - Auth endpoints documentation
  - Environment variables
  - Dev mode setup

- [ ] **Update `SETUP_GUIDE.md`**:
  - Google OAuth setup steps
  - How to obtain OAuth credentials

## Environment Variables

### Backend (.env)

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# Note: No GOOGLE_CLIENT_SECRET needed for Chrome Extension OAuth client type

# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Development Mode
ENVIRONMENT=dev
DEV_TEST_EMAIL=writemileslee@gmail.com
```

**Note**: Chrome Extension OAuth clients don't require a client secret. The extension ID serves as the verification mechanism.

## Migration Steps

### Step 1: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Identity API (if needed)
4. Create OAuth 2.0 credentials:
   - **Application type: "Chrome App" or "Chrome Extension"**
   - **Important**: Extension ID must match the OAuth client ID configuration
   - Get your extension ID from `chrome://extensions/` (enable Developer mode)
   - Add extension ID to OAuth client settings
5. **No Client Secret needed** for Chrome Extension type OAuth clients
6. Copy Client ID to `.env` and `manifest.json`
7. **Add `"key"` field to manifest.json** to ensure stable extension ID

### Step 2: Backend Implementation

1. Install dependencies: `uv sync` or `pip install -r requirements.txt`
2. Update database models and run migration
3. Implement auth router and services
4. Update existing routers to use `get_current_user`
5. Test OAuth callback endpoint

### Step 3: Extension Implementation

1. Add `identity` permission to manifest
2. Implement token manager and auth utilities
3. Create auth UI components
4. Update API client to use Bearer tokens
5. Test sign-in flow

### Step 4: Dev Mode Setup

1. Set `ENVIRONMENT=dev` in backend `.env`
2. Set `DEV_TEST_EMAIL=writemileslee@gmail.com`
3. Run `./migrate.sh` to seed test data
4. Sign in with Google account using test email
5. Verify test data is visible

### Step 5: Testing

1. Run backend tests: `pytest __tests__/ -v`
2. Run extension tests: `npm test`
3. Test end-to-end OAuth flow
4. Test token refresh
5. Test protected routes

## Breaking Changes

### Removed Features

- ❌ `X-User-ID` header authentication (completely removed)
- ❌ `getUserId()` function in extension
- ❌ Hardcoded user ID "123" in dev mode
- ❌ UUID-based user identification

### New Requirements

- ✅ Google account required for all users
- ✅ OAuth sign-in required before using extension
- ✅ JWT tokens required for all API requests
- ✅ Token refresh mechanism for long sessions

## Security Considerations

1. **Token Storage**: Tokens stored in `chrome.storage.local` (encrypted by Chrome)
2. **HTTPS Only**: OAuth redirects use HTTPS (Chrome Identity API)
3. **Short-Lived Tokens**: 15-minute access token expiry
4. **Token Rotation**: Refresh tokens rotated on each use
5. **Secure JWT Secret**: Strong, randomly generated secret (min 32 chars)
6. **Email Verification**: Google verifies email addresses
7. **User Isolation**: Users can only access their own data

## Rollout Strategy

1. **Development**: Implement and test locally with dev mode
2. **Staging**: Deploy to staging environment, test OAuth flow
3. **Production**: Deploy to production, users must sign in with Google
4. **Migration**: Existing users prompted to sign in on next use

## Success Criteria

- [ ] Users can sign in with Google OAuth
- [ ] JWT tokens are generated and validated correctly
- [ ] Token refresh works automatically
- [ ] All API endpoints require authentication
- [ ] Dev mode test data is accessible with test email
- [ ] All tests pass
- [ ] Documentation is complete

## Timeline Estimate

- **Backend Implementation**: 2-3 days
- **Extension Implementation**: 2-3 days
- **Testing**: 1-2 days
- **Documentation**: 1 day
- **Total**: ~1 week

## Important Implementation Notes

### OAuth Flow Approach

We're using **`chrome.identity.getAuthToken()`** instead of authorization code flow because:
- Simpler for Google OAuth in Chrome extensions
- No need to handle redirect URIs manually
- Google handles token caching automatically
- Backend verifies the access token and issues its own JWTs

### Chrome Extension Requirements

1. **Manifest `oauth2` block**: Required for `getAuthToken()` to work
2. **`key` field in manifest**: Critical for stable extension ID (must match OAuth client)
3. **Extension ID stability**: Without `key`, extension ID changes on reload, breaking OAuth

### Backend Token Verification

- Backend receives Google access token from extension
- Verifies token with Google's tokeninfo or userinfo endpoint
- Extracts user email and Google ID (sub)
- Issues own JWT tokens for API authentication
- Google access token is NOT stored - only used for initial verification

### Breaking Changes

- This is a **breaking change** - all users must re-authenticate
- No backward compatibility with `X-User-ID`
- Dev mode requires specific test email for seeded data
- OAuth credentials must be configured before deployment
