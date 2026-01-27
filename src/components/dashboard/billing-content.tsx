"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";
import { format } from "date-fns";
import { CheckoutButton } from "./checkout-button";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  CreditCard,
  Calendar,
  Crown,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type SubscriptionPlan =
  Database["public"]["Tables"]["subscription_plans"]["Row"];

interface BillingContentProps {
  subscription: Subscription | null;
  payments: Payment[];
}

export function BillingContent({
  subscription,
  payments,
}: BillingContentProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);

  // Fetch subscription plans and current plan details
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/subscription-plans");
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
        }
      } catch (error) {
        console.error("Failed to fetch subscription plans:", error);
      }
    };

    fetchPlans();
  }, []);

  // Get current plan details
  useEffect(() => {
    if (subscription && plans.length > 0) {
      const plan = plans.find((p) => p.id === subscription.plan_id);
      setCurrentPlan(plan || null);
    }
  }, [subscription, plans]);

  return (
    <div className="space-y-6">
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Payment successful! Your subscription is now active.
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Payment was canceled. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription plan and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription && currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                    {currentPlan.is_popular && (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    )}
                    {subscription.status === "active" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-lg font-semibold">
                    ${currentPlan.price.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{currentPlan.billing_period}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Badge
                      variant={
                        subscription.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                  {currentPlan.description && (
                    <p className="text-sm text-muted-foreground">
                      {currentPlan.description}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </div>

              {/* Plan Features */}
              {currentPlan.features && Array.isArray(currentPlan.features) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {(currentPlan.features as string[]).map(
                      (feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {subscription.current_period_end && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Next billing date:{" "}
                    {format(
                      new Date(subscription.current_period_end),
                      "MMMM dd, yyyy"
                    )}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-6">
              <div className="text-center space-y-2">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium">No Active Subscription</p>
                <p className="text-sm text-muted-foreground">
                  Choose a plan to get started
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {plans.map((plan) => (
                  <div key={plan.id} className="space-y-2">
                    <div
                      className={`p-4 border rounded-lg space-y-3 relative ${
                        plan.is_popular
                          ? "border-primary shadow-md"
                          : "border-border"
                      }`}
                    >
                      {plan.is_popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">
                            Popular
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        {plan.is_popular && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-2xl font-bold">
                        ${plan.price.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.billing_period}
                        </span>
                      </p>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      )}

                      {/* Plan Features */}
                      {plan.features && Array.isArray(plan.features) && (
                        <div className="space-y-1">
                          {(plan.features as string[])
                            .slice(0, 3)
                            .map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-xs"
                              >
                                <Check className="h-3 w-3 text-green-500" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          {(plan.features as string[]).length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{(plan.features as string[]).length - 3} more
                              features
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <CheckoutButton planId={plan.id}>
                      Choose {plan.name}
                    </CheckoutButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your recent payment transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No payment history yet.</p>
              <p className="text-sm text-muted-foreground">
                Your transactions will appear here once you make a payment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {payment.currency.toUpperCase()}{" "}
                        {payment.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.created_at), "MMM dd, yyyy")} •{" "}
                        {payment.payment_provider}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      payment.status === "succeeded"
                        ? "default"
                        : payment.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
