# Setup Guide

This guide will walk you through setting up the SaaS MVP template from scratch.

## Step 1: Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to be provisioned (2-3 minutes)
4. Go to Project Settings > API
5. Copy your project URL and anon key

### Run Database Migrations

1. Go to the SQL Editor in your Supabase dashboard
2. Run each script from the `scripts/` folder in order:
   - `001_create_profiles.sql`
   - `002_create_todos.sql`
   - `003_create_subscriptions.sql`
   - `004_create_payments.sql`

Alternatively, you can run these scripts directly in v0 using the script runner.

### Enable Email Auth

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set up email redirect URLs

## Step 2: Payment Provider Setup

### Option A: Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Go to Developers > API keys
3. Copy your Secret key and Publishable key
4. Go to Products and create two products:
   - Starter Plan ($19/month)
   - Pro Plan ($49/month)
5. Copy the Price IDs for each product
6. Go to Developers > Webhooks
7. Add endpoint: `https://yourdomain.com/api/webhook/stripe`
8. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
9. Copy the webhook signing secret

### Option B: Razorpay

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Go to Settings > API Keys
3. Generate and copy your Key ID and Key Secret
4. Go to Subscriptions > Plans
5. Create two plans:
   - Starter Plan (₹1900/month)
   - Pro Plan (₹4900/month)
6. Copy the Plan IDs
7. Go to Settings > Webhooks
8. Add endpoint: `https://yourdomain.com/api/webhook/razorpay`
9. Select events to listen to:
   - `subscription.activated`
   - `payment.captured`
   - `subscription.cancelled`
10. Copy the webhook secret

## Step 3: Email Setup

1. Create a Resend account at [resend.com](https://resend.com)
2. Go to API Keys
3. Create a new API key
4. Copy the API key
5. (Optional) Add and verify your domain for production emails

## Step 4: Environment Variables

Create a `.env.local` file in your project root with the following:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard

# Payment Provider (stripe or razorpay)
PAYMENT_PROVIDER=stripe

# Stripe (if using Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Razorpay (if using Razorpay)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_STARTER_PLAN_ID=plan_...
RAZORPAY_PRO_PLAN_ID=plan_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=onboarding@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## Step 5: Install Dependencies

\`\`\`bash
bun install
\`\`\`

## Step 6: Run Development Server

\`\`\`bash
bun run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Step 7: Test the Application

### Test Authentication

1. Go to `/signup` and create an account
2. Check your email for the welcome message
3. Verify you can log in at `/login`
4. Check that you're redirected to `/dashboard`

### Test Dashboard

1. Navigate through different dashboard pages
2. Create a todo item
3. Update your profile in settings
4. Check the billing page

### Test Payments (Test Mode)

1. Go to the billing page
2. Click "Choose Starter Plan" or "Choose Pro Plan"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete the checkout
5. Verify subscription appears in dashboard
6. Check for payment confirmation email

## Step 8: Deploy to Production

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add all environment variables
5. Update `NEXT_PUBLIC_APP_URL` to your production URL
6. Deploy!

### Post-Deployment Tasks

1. Update webhook URLs in Stripe/Razorpay:
   - Stripe: `https://yourdomain.com/api/webhook/stripe`
   - Razorpay: `https://yourdomain.com/api/webhook/razorpay`

2. Update Supabase redirect URLs:
   - Go to Authentication > URL Configuration
   - Add your production URL to allowed redirect URLs

3. Switch to production API keys:
   - Replace test keys with live keys in Vercel environment variables
   - Update Stripe/Razorpay to use live mode

4. Verify your email domain in Resend for production emails

5. Test the entire flow in production:
   - Sign up
   - Make a payment
   - Verify emails are received
   - Check webhook logs

## Troubleshooting

### Authentication Issues

- Check Supabase URL and keys are correct
- Verify redirect URLs are configured in Supabase
- Check browser console for errors

### Payment Issues

- Verify webhook endpoints are accessible
- Check webhook signatures are being validated
- Review webhook logs in Stripe/Razorpay dashboard
- Ensure database tables exist and RLS policies are correct

### Email Issues

- Verify Resend API key is correct
- Check email templates are rendering correctly
- Review Resend logs for delivery status
- Verify FROM_EMAIL is authorized in Resend

### Database Issues

- Ensure all migration scripts have been run
- Check RLS policies are enabled
- Verify service role key has proper permissions
- Review Supabase logs for errors

## Next Steps

- Customize the branding and colors
- Add your own features and pages
- Set up analytics and monitoring
- Configure custom domain
- Add more email templates
- Implement additional payment plans
- Add team/organization features
- Set up CI/CD pipeline

## Support

If you encounter any issues:
1. Check the error logs in your browser console
2. Review Supabase logs
3. Check webhook logs in payment provider dashboard
4. Review Resend email logs
5. Open an issue on GitHub with detailed information
