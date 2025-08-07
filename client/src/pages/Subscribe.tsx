import React, { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

// This component will be activated when Stripe keys are provided
const stripePromise = typeof window !== 'undefined' && import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : Promise.resolve(null);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to the Community!",
        description: "Your membership is now active. Thank you for joining our biblical endeavor!",
      });
      setLocation('/bible');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
        <PaymentElement />
      </div>
      <Button
        type="submit"
        disabled={!stripe}
        className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white holy-button py-6"
      >
        <Crown className="h-5 w-5 mr-2" />
        Complete Your Membership ($12/month)
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if Stripe is configured
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      setError('Payment system is not configured. Please contact support.');
      setIsLoading(false);
      return;
    }

    // Create subscription intent
    apiRequest('POST', '/api/get-or-create-subscription', { 
      email: 'community@anointed.io',
      name: 'Community Member' 
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error.message);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((err) => {
        setError('Failed to initialize payment. Please try again.');
        console.error('Subscription error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-purple-950 dark:via-gray-900 dark:to-amber-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600 dark:text-gray-300">Preparing your sacred journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-purple-950 dark:via-gray-900 dark:to-amber-950 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <Crown className="h-16 w-16 text-amber-500 mx-auto opacity-50" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Service Unavailable
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error}
            </p>
            <Button
              onClick={() => setLocation('/bible')}
              variant="outline"
              className="holy-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Bible Study
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-purple-950 dark:via-gray-900 dark:to-amber-950">
      {/* Mystical Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-amber-100/30 dark:from-purple-800/20 dark:via-transparent dark:to-amber-800/20" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-200/20 dark:bg-amber-600/20 rounded-full blur-2xl animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Crown className="h-12 w-12 text-amber-500 animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-amber-600 bg-clip-text text-transparent">
                Join Our Sacred Community
              </h1>
              <Sparkles className="h-12 w-12 text-purple-500 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Have your voice heard as we connect the Bible together as a divine community
            </p>
            
            {/* Back Button */}
            <Button
              onClick={() => setLocation('/bible')}
              variant="ghost"
              className="mb-8 holy-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bible Study
            </Button>
          </div>

          {/* Payment Form */}
          {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Payment system is not yet configured. Please check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}