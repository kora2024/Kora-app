# KORA Test Credentials

## Test User Account (Admin)
- **Email**: test@kora.com
- **Password**: Kora2024!
- **FREK-ID**: FRK-XC1F3PJDKQ
- **Display Name**: Test User
- **Role**: Admin + Creator

## API Endpoints

### Auth
- **Signup**: POST /api/auth/signup
- **Login**: POST /api/auth/login
- **Me**: GET /api/auth/me (requires Bearer token)
- **Profile**: GET /api/auth/profile (requires Bearer token)
- **Become Creator**: POST /api/auth/become-creator (requires Bearer token)

### Stripe
- **Stripe Checkout**: POST /api/subscriptions/checkout-session (requires Bearer token)
- **Subscription Status**: GET /api/subscriptions/status (requires Bearer token)
- **Stripe Webhook**: POST /api/webhook/stripe

### Catalog (Music worldwide)
- **Search**: GET /api/catalog/search?q=reggae&limit=20
- **Featured**: GET /api/catalog/featured?limit=20
- **By Territory**: GET /api/catalog/territory/caribbean?limit=20
- **Track Details**: GET /api/catalog/track/jamendo/123456
- **Genres**: GET /api/catalog/genres

### Content (Creator)
- **Submit**: POST /api/content/submit (creator only)
- **My Content**: GET /api/content/my-content (creator only)
- **Published**: GET /api/content/published
- **Get Content**: GET /api/content/{id}

### Admin Dashboard
- **URL**: /api/admin (accessible via browser)
- **Pending Content**: GET /api/content/admin/pending
- **Approve**: POST /api/content/admin/{id}/approve
- **Reject**: POST /api/content/admin/{id}/reject

## Stripe Configuration
- **Price**: 3.98€/month
- **Test Key**: sk_test_emergent (from environment)

## Notes
- Backend running on port 8001
- Frontend running on port 3000
- Admin dashboard at /api/admin
- FREK-ID is auto-generated at signup
- JWT tokens expire after 7 days
