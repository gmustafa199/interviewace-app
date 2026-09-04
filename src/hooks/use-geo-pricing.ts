'use client';

import { useEffect, useState } from 'react';

/**
 * Detects the user's country via /api/geo and returns the right pricing tier.
 * Defaults to "global" pricing while loading or if the API fails.
 *
 * Usage:
 *   const { pricing, isIndia, isLoading } = useGeoPricing();
 *   if (isLoading) return null;
 *   return <span>{pricing.monthlyLabel}/mo</span>;
 */

export type Pricing = {
  currency: 'USD' | 'INR';
  symbol: string;
  monthly: number;
  yearly: number;
  monthlyLabel: string;
  yearlyLabel: string;
  freeInterviewsPerMonth: number;
};

type GeoState = {
  pricing: Pricing;
  isIndia: boolean;
  country: string | null;
  isLoading: boolean;
};

const DEFAULT_GLOBAL_PRICING: Pricing = {
  currency: 'USD',
  symbol: '$',
  monthly: 19,
  yearly: 190,
  monthlyLabel: '$19',
  yearlyLabel: '$190',
  freeInterviewsPerMonth: 3,
};

const DEFAULT_INDIA_PRICING: Pricing = {
  currency: 'INR',
  symbol: '₹',
  monthly: 299,
  yearly: 1999,
  monthlyLabel: '₹299',
  yearlyLabel: '₹1,999',
  freeInterviewsPerMonth: 3,
};

export function useGeoPricing(): GeoState {
  const [state, setState] = useState<GeoState>({
    pricing: DEFAULT_GLOBAL_PRICING,
    isIndia: false,
    country: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;
    fetch('/api/geo')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const isIndia = Boolean(data.isIndia);
        setState({
          pricing: isIndia ? DEFAULT_INDIA_PRICING : DEFAULT_GLOBAL_PRICING,
          isIndia,
          country: data.country || null,
          isLoading: false,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setState({
          pricing: DEFAULT_GLOBAL_PRICING,
          isIndia: false,
          country: null,
          isLoading: false,
        });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
