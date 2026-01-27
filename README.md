# SaaS MVP Template 🚀

A complete, production-ready SaaS starter template built with **Next.js 16**, **Supabase**, and modern web technologies.  
Perfect for hackathons, MVPs, and rapid product experiments.

👉 **New here? Start with the [Setup Guide](./SETUP_GUIDE.md)**  
💬 **Questions? Join the conversation in [Discussions](../../discussions)**

---

## ✨ Features

- **Authentication & Authorization**  
  Email/password, magic links, and OAuth via Supabase Auth
- **Database**  
  PostgreSQL with Supabase + Row Level Security (RLS)
- **Email Notifications**  
  Transactional emails with Resend + React Email
- **Dashboard**  
  Protected admin dashboard with sidebar navigation
- **Landing Page**  
  Responsive marketing site with pricing & FAQ sections
- **Dark Mode**  
  Theme switching via `next-themes`
- **Type Safety**  
  End-to-end TypeScript (including database types)
- **UI Components**  
  shadcn/ui + Radix UI
- **Charts & Visualizations**  
  Recharts integration

---

## 🧰 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Resend + React Email
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui + Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Language**: TypeScript
- **Runtime**: Bun

---

## 🚀 Getting Started (Quick Start)

> For full instructions, see the **[Setup Guide](./SETUP_GUIDE.md)**

```bash
bun install
bun run dev
```

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
│   ├── hooks/
│   ├── lib/
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

All tables include Row Level Security (RLS) policies for data protection.

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
