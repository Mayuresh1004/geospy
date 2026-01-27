# SaaS MVP Template

A complete, production-ready SaaS starter template built with Next.js 15, Supabase, and modern web technologies. This template includes everything you need to launch your SaaS product quickly.

## Features

- **Authentication & Authorization**: Complete auth system with Supabase (email/password, magic links, OAuth)
- **Database**: PostgreSQL with Supabase, including Row Level Security (RLS)
- **Payment Processing**: Integrated Stripe and Razorpay support with webhook handlers (optional)
- **Email Notifications**: Transactional emails with Resend and React Email
- **Dashboard**: Full-featured admin dashboard with sidebar navigation
- **Landing Page**: Modern, responsive marketing site with pricing and FAQ
- **Dark Mode**: Built-in theme switching with next-themes
- **Analytics**: Vercel Analytics integration
- **Type Safety**: Full TypeScript support with database types
- **UI Components**: shadcn/ui component library
- **Charts & Visualizations**: Recharts integration for data visualization

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe / Razorpay
- **Email**: Resend + React Email
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Type Safety**: TypeScript
- **Analytics**: Vercel Analytics

## Getting Started

### Prerequisites

- Bun
- A Supabase account
- A Stripe or Razorpay account (optional - for payments)
- A Resend account (for emails)

### Installation

1. Clone the repository or download the code

2. Install dependencies:
\`\`\`bash
bun install
\`\`\`

3. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your credentials:

\`\`\`bash
cp .env.example .env.local
\`\`\`

**Required environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (get from Supabase dashboard)
- `RESEND_API_KEY`: Your Resend API key
- `FROM_EMAIL`: Email address to send from (e.g., noreply@yourdomain.com)
- `NEXT_PUBLIC_APP_URL`: Your app URL (http://localhost:3000 for development)

**Optional environment variables (for payments):**
- `PAYMENT_PROVIDER`: Either "stripe" or "razorpay" (default: "stripe")
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `STRIPE_STARTER_PRICE_ID`: Stripe price ID for starter plan
- `STRIPE_PRO_PRICE_ID`: Stripe price ID for pro plan
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `RAZORPAY_KEY_ID`: Your Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay key secret
- `RAZORPAY_WEBHOOK_SECRET`: Your Razorpay webhook secret
- `RAZORPAY_STARTER_PLAN_ID`: Razorpay plan ID for starter plan
- `RAZORPAY_PRO_PLAN_ID`: Razorpay plan ID for pro plan

**Note**: The app works without payment credentials. Payment features will show a friendly error message until you add the keys.

4. Run the database migrations:

Execute the SQL scripts in the `scripts` folder in your Supabase SQL editor or use the v0 script runner.

5. Start the development server:

\`\`\`bash
bun run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (auth)/              # Authentication pages (login, signup)
│   │   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── (marketing)/         # Public marketing pages
│   │   ├── api/                 # API routes (checkout, webhooks)
│   │   ├── favicon.ico
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── dashboard/           # Dashboard-specific components
│   │   ├── landing/             # Landing page components
│   │   └── ui/                  # Reusable UI components (shadcn)
│   ├── emails/                  # Email templates (React Email)
│   ├── hooks/
│   ├── lib/
│   │   ├── email/               # Email utilities
│   │   ├── payments/            # Payment provider integrations
│   │   └── supabase/            # Supabase client utilities
│   └── types/                   # TypeScript type definitions
├── public/                      # Static assets
├── scripts/                     # Database migration scripts
├── .env                         # Environment variables
├── bun.lock                     # Bun lock file
├── components.json              # shadcn/ui configuration
├── eslint.config.mjs            # ESLint configuration
├── middleware.ts                # Next.js middleware
├── next.config.ts               # Next.js configuration
├── package.json                 # Package dependencies
├── postcss.config.mjs           # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## Database Schema

The template includes the following tables:

- **profiles**: User profile information
- **todos**: Example CRUD functionality
- **subscriptions**: User subscription data
- **payments**: Payment transaction history

All tables include Row Level Security (RLS) policies for data protection.

## Payment Integration

**Payment integration is optional.** The app works fully without payment credentials. When users try to checkout without configured payment providers, they'll see a friendly error message.

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Create products and prices in Stripe
4. Add the price IDs to your environment variables
5. Set `PAYMENT_PROVIDER=stripe` in your environment variables
6. Set up webhook endpoint: `https://yourdomain.com/api/webhook/stripe`
7. Add the webhook secret to your environment variables

### Razorpay Setup

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Get your API keys from the Razorpay dashboard
3. Create subscription plans in Razorpay
4. Add the plan IDs to your environment variables
5. Set `PAYMENT_PROVIDER=razorpay` in your environment variables
6. Set up webhook endpoint: `https://yourdomain.com/api/webhook/razorpay`
7. Add the webhook secret to your environment variables

## Email Setup

1. Create a Resend account at [resend.com](https://resend.com)
2. Verify your domain or use the test domain
3. Get your API key from the Resend dashboard
4. Add the API key to your environment variables
5. Customize email templates in the `emails/` folder

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables in the Vercel dashboard
4. Deploy!

### Post-Deployment

1. Update webhook URLs in Stripe/Razorpay dashboard
2. Update `NEXT_PUBLIC_APP_URL` environment variable
3. Test authentication flow
4. Test payment flow
5. Test email delivery

## Customization

### Branding

- Update the app name in `components/landing/header.tsx` and `components/dashboard/sidebar.tsx`
- Modify colors in `app/globals.css` (design tokens)
- Update metadata in `app/layout.tsx`
- Replace placeholder logo and favicon

### Features

- Add new dashboard pages in `app/(dashboard)/dashboard/`
- Create new API routes in `app/api/`
- Add email templates in `emails/`
- Extend database schema with new tables in `scripts/`

## Security Best Practices

- All database tables use Row Level Security (RLS)
- API routes verify authentication before processing
- Webhook endpoints verify signatures
- Environment variables are never exposed to the client (except NEXT_PUBLIC_* vars)
- Passwords are hashed by Supabase Auth
- HTTPS is enforced in production
- Payment credentials are optional and gracefully handled

## Support

For issues or questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub
- Contact support

## License

MIT License - feel free to use this template for your projects.

## Credits

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Stripe](https://stripe.com)
- [Resend](https://resend.com)
- [Vercel](https://vercel.com)
