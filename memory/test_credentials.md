# KORA Test Credentials

## Test User Account
- **Email**: test@kora.com
- **Password**: Kora2024!
- **FREK-ID**: FRK-XC1F3PJDKQ
- **Display Name**: Test User

## API Endpoints
- **Signup**: POST /api/auth/signup
- **Login**: POST /api/auth/login
- **Me**: GET /api/auth/me (requires Bearer token)
- **Stripe Checkout**: POST /api/subscriptions/checkout-session (requires Bearer token)
- **Subscription Status**: GET /api/subscriptions/status (requires Bearer token)
- **Stripe Webhook**: POST /api/webhook/stripe

## Stripe Configuration
- **Price**: 3.98€/month
- **Test Key**: sk_test_emergent (from environment)

## Notes
- Backend running on port 8001
- Frontend running on port 3000
- FREK-ID is auto-generated at signup
- JWT tokens expire after 7 days
