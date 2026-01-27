"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface CheckoutButtonProps {
  planId: string
  children: React.ReactNode
}

export function CheckoutButton({ planId, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleRazorpayPayment = (orderData: { razorpayKeyId: string; amount: number; currency: string; orderId: string; userId: string }, userId: string) => {
    if (!window.Razorpay) {
      toast({
        title: "Payment Error",
        description: "Razorpay SDK not loaded. Please refresh and try again.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "SaaS MVP",
      description: `Payment for ${planId} plan`,
      order_id: orderData.orderId,
      handler: async function (response: RazorpayResponse) {
        try {
          // Call our payment success API to activate subscription
          const successResponse = await fetch('/api/payment-success', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              planId: planId,
              userId: userId
            })
          })

          const successData = await successResponse.json()

          if (successResponse.ok && successData.success) {
            toast({
              title: "Payment Successful!",
              description: "Your subscription has been activated successfully.",
            })
            router.push(successData.redirectUrl || '/dashboard/billing?success=true')
          } else {
            throw new Error(successData.error || 'Failed to activate subscription')
          }
        } catch (error) {
          console.error('Payment success handling error:', error)
          toast({
            title: "Subscription Activation Failed",
            description: "Payment was successful but subscription activation failed. Please contact support.",
            variant: "destructive",
          })
          router.push('/dashboard/billing?success=false')
        } finally {
          setLoading(false)
        }
      },
      prefill: {
        name: "",
        email: "",
        contact: ""
      },
      theme: {
        color: "#3399cc"
      },
      modal: {
        ondismiss: function () {
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled by user.",
            variant: "destructive",
          })
          setLoading(false)
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', function (response: { error: { description: string } }) {
      toast({
        title: "Payment Failed",
        description: `Payment failed: ${response.error.description}`,
        variant: "destructive",
      })
      setLoading(false)
    })

    rzp.open()
  }

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      let data
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // If response is not JSON, treat it as a generic error
        await response.text()
        throw new Error("Server error. Please try again later.")
      }

      if (response.status === 503) {
        toast({
          title: "Payment System Not Ready",
          description: data.error || "Payment processing is not configured yet. Please contact support.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Handle Stripe response
      if (data.url) {
        window.location.href = data.url
        return
      }

      // Handle Razorpay response (new format)
      if (data.orderId && data.success) {
        // Open Razorpay payment interface - pass userId from the response
        handleRazorpayPayment(data, data.userId)
        return
      }

      // Handle legacy Razorpay subscription response
      if (data.subscriptionId) {
        toast({
          title: "Razorpay Integration",
          description: "Razorpay checkout flow needs to be implemented on the frontend.",
        })
        setLoading(false)
        return
      }

      // If we get here, unexpected response format
      toast({
        title: "Unexpected Response",
        description: "Received unexpected response format. Check console for details.",
        variant: "destructive",
      })
      setLoading(false)

    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={loading} className="w-full">
      {loading ? "Processing..." : children}
    </Button>
  )
}
