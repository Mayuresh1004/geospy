-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_period TEXT NOT NULL CHECK (billing_period IN ('month', 'year')),
  features JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT FALSE,
  stripe_price_id TEXT,
  razorpay_plan_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for subscription plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read subscription plans (they're public)
CREATE POLICY "Allow public read access to subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- Add updated_at trigger for subscription plans
CREATE TRIGGER set_updated_at_subscription_plans
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, description, price, currency, billing_period, features, is_popular, stripe_price_id, razorpay_plan_id) 
VALUES 
  ('starter', 'Starter Plan', 'Perfect for getting started', 9.00, 'usd', 'month', 
   '["Up to 100 todos", "Basic support", "Mobile app access"]', false, 
   'price_starter_monthly', 'plan_starter_monthly'),
  ('pro', 'Pro Plan', 'For professional use', 29.00, 'usd', 'month', 
   '["Unlimited todos", "Priority support", "Advanced analytics", "Team collaboration", "Custom integrations"]', true, 
   'price_pro_monthly', 'plan_pro_monthly'),
  ('enterprise', 'Enterprise Plan', 'For large organizations', 99.00, 'usd', 'month', 
   '["Everything in Pro", "Dedicated support", "SLA guarantee", "Custom branding", "SSO integration"]', false, 
   'price_enterprise_monthly', 'plan_enterprise_monthly')
ON CONFLICT (id) DO NOTHING;