import { supabase } from './supabaseClient';

const PRICE_ID = 'price_1S3Pz1DPQkBO3I7WPFPiOYie';

export const billing = {
  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckout() {
    try {
      const { data, error } = await supabase().functions.invoke('billing_create_checkout', {
        body: { price_id: PRICE_ID }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }
      
      return { url: data?.url };
    } catch (error) {
      console.error('Billing checkout error:', error);
      throw error;
    }
  },

  /**
   * Create a Stripe billing portal session for subscription management
   */
  async createPortal() {
    try {
      const { data, error } = await supabase().functions.invoke('billing_portal', {
        body: {}
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create billing portal session');
      }
      
      return { url: data?.url };
    } catch (error) {
      console.error('Billing portal error:', error);
      throw error;
    }
  },

  /**
   * Redirect to Stripe checkout
   */
  async startCheckout() {
    const { url } = await this.createCheckout();
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL returned');
    }
  },

  /**
   * Redirect to billing portal
   */
  async openPortal() {
    const { url } = await this.createPortal();
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No portal URL returned');
    }
  }
};