# Subscription System Setup Guide

This guide will help you set up the subscription system with payment integration for your SaaS application.

## Features

- ✅ **Subscription Plans**: Database-driven plan configuration with features, pricing, and billing periods
- ✅ **Payment Integration**: Support for both Stripe and Razorpay
- ✅ **Subscription Management**: Automatic subscription activation and management
- ✅ **Billing Dashboard**: Professional billing interface with plan selection and payment history
- ✅ **Real-time Status**: Live subscription status updates and plan indicators
- ✅ **Security**: Row-level security and proper payment validation

## Database Setup

### 1. Run SQL Scripts

Execute these SQL scripts in your Supabase SQL editor (in order):

```sql
-- 1. First, run the initial schema
-- File: scripts/001_initial_schema.sql
```

```sql
-- 2. Then, add subscription plans
-- File: scripts/002_subscription_plans.sql
```

### 2. Verify Setup

Run the initialization script to check your setup:

```bash
node scripts/init-db.js
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Payment Provider (choose one)
PAYMENT_PROVIDER=razorpay  # or "stripe"

# Razorpay (if using Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Stripe (if using Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Payment Provider Setup

### Razorpay Setup

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Get your API keys from the dashboard
3. Set up webhook endpoints:
   - **Webhook URL**: `https://yourdomain.com/api/webhook/razorpay`
   - **Events**: `payment.captured`, `subscription.activated`, `subscription.cancelled`

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Create subscription products and prices
4. Set up webhook endpoints:
   - **Webhook URL**: `https://yourdomain.com/api/webhook/stripe`
   - **Events**: `customer.subscription.created`, `customer.subscription.updated`, `invoice.payment_succeeded`

## Subscription Flow

### 1. Plan Selection
- Users can view available subscription plans on the billing page
- Plans are fetched from the `subscription_plans` table
- Each plan shows features, pricing, and billing period

### 2. Payment Process
- Users click "Choose Plan" to initiate payment
- Payment processed through selected provider (Stripe/Razorpay)
- Payment success triggers subscription activation

### 3. Subscription Activation
- Payment success calls `/api/payment-success`
- Creates payment record and activates subscription
- User redirected to billing page with success message

### 4. Billing Dashboard
- Shows current subscription status
- Displays plan name with active indicator
- Lists payment history
- Shows next billing date

## Database Schema

### subscription_plans
```sql
- id: TEXT (primary key) - Plan identifier
- name: TEXT - Display name
- description: TEXT - Plan description
- price: NUMERIC - Price amount
- currency: TEXT - Currency code
- billing_period: TEXT - 'month' or 'year'
- features: JSONB - Array of features
- is_popular: BOOLEAN - Popular plan indicator
- stripe_price_id: TEXT - Stripe price ID
- razorpay_plan_id: TEXT - Razorpay plan ID
- is_active: BOOLEAN - Plan availability
```

### subscriptions
```sql
- id: UUID - Subscription ID
- user_id: UUID - User reference
- status: TEXT - 'active', 'canceled', 'past_due', 'trialing'
- plan_id: TEXT - Plan reference
- current_period_start: TIMESTAMP
- current_period_end: TIMESTAMP
- cancel_at_period_end: BOOLEAN
- stripe_subscription_id: TEXT
- razorpay_subscription_id: TEXT
```

### payments
```sql
- id: UUID - Payment ID
- user_id: UUID - User reference
- amount: NUMERIC - Payment amount
- currency: TEXT - Currency code
- status: TEXT - 'succeeded', 'failed', 'pending'
- payment_provider: TEXT - 'stripe' or 'razorpay'
- provider_payment_id: TEXT - Provider transaction ID
```

## API Endpoints

- `GET /api/subscription-plans` - Fetch available plans
- `POST /api/checkout` - Create payment session
- `POST /api/payment-success` - Handle payment success
- `POST /api/webhook/razorpay` - Razorpay webhooks
- `POST /api/webhook/stripe` - Stripe webhooks

## Components

### BillingContent
- Main billing dashboard component
- Displays current subscription and plan selection
- Shows payment history

### CheckoutButton
- Handles plan selection and payment initiation
- Integrates with both Stripe and Razorpay
- Manages payment success/failure states

### useSubscription Hook
- Fetches current user subscription
- Provides loading state
- Auto-updates on user changes

## Customization

### Adding New Plans
1. Insert new plan in `subscription_plans` table
2. Configure payment provider product/price
3. Update plan features and pricing

### Modifying Features
1. Update `features` JSON array in database
2. Customize display in `BillingContent` component

### Payment Providers
- Switch providers by changing `PAYMENT_PROVIDER` environment variable
- Both providers can be configured simultaneously

## Testing

### Test Payment Flow
1. Select a subscription plan
2. Complete payment with test credentials
3. Verify subscription activation
4. Check billing dashboard updates

### Test Webhooks
1. Use provider test environments
2. Verify webhook delivery
3. Check database updates

## Security Notes

- All database tables use Row Level Security (RLS)
- Payment handling uses server-side validation
- Webhook signatures are verified
- User authentication required for all operations

## Troubleshooting

### Common Issues

1. **Payment not activating subscription**
   - Check webhook configuration
   - Verify API endpoint accessibility
   - Review server logs for errors

2. **Plans not loading**
   - Verify SQL scripts executed
   - Check subscription_plans table data
   - Review API endpoint response

3. **Type errors**
   - Ensure database types are updated
   - Verify import statements
   - Check TypeScript configuration

### Debug Mode
Add console logging to payment handlers for debugging:

```javascript
console.log('Payment data:', paymentData)
console.log('Subscription created:', subscription)
```

## Support

For additional help:
1. Check the application logs
2. Review payment provider documentation
3. Verify environment variable configuration
4. Test with payment provider test modes