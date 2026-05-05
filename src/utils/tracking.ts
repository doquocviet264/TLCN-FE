/**
 * Recommendation Tracking Utility
 *
 * Tracks user interactions with tour recommendations for:
 * - Online learning (DeepFM model improvement)
 * - Analytics (CTR, conversion rate)
 * - A/B testing (DeepFM vs Hybrid)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TRACKING_ENDPOINT = `${API_BASE}/api/recommendations/track`;

// Session ID for grouping interactions
let sessionId: string | null = null;

const getSessionId = (): string => {
  if (sessionId) return sessionId;

  // Try to get from sessionStorage
  if (typeof window !== 'undefined') {
    sessionId = sessionStorage.getItem('rec_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('rec_session_id', sessionId);
    }
  } else {
    sessionId = `sess_${Date.now()}`;
  }

  return sessionId;
};

const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export type InteractionType = 'view' | 'click' | 'bookmark' | 'share' | 'booking' | 'review';
export type SourceType = 'homepage' | 'similar' | 'post_booking' | 'search' | 'direct';
export type ModelType = 'deepfm' | 'hybrid' | 'popularity';

export interface TrackingData {
  userId?: string | null;
  tourId: string;
  type: InteractionType;
  value?: number;
  source?: SourceType;
  model?: ModelType | null;
  position?: number;
  duration?: number;
}

/**
 * Track a user interaction with a tour
 *
 * @example
 * // Track a click on homepage recommendation
 * trackInteraction({
 *   userId: user?.id,
 *   tourId: '123',
 *   type: 'click',
 *   source: 'homepage',
 *   model: 'deepfm',
 *   position: 0
 * });
 */
export const trackInteraction = async (data: TrackingData): Promise<void> => {
  try {
    const payload = {
      userId: data.userId || null,
      tourId: data.tourId,
      type: data.type,
      value: data.value ?? 1.0,
      source: data.source || 'direct',
      model: data.model || null,
      position: data.position,
      sessionId: getSessionId(),
      deviceType: getDeviceType(),
      duration: data.duration
    };

    // Use sendBeacon for non-blocking tracking (better for page navigations)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(TRACKING_ENDPOINT, blob);
    } else {
      // Fallback to fetch
      fetch(TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
        keepalive: true
      }).catch(() => {
        // Silently fail - tracking should not break the app
      });
    }
  } catch (e) {
    // Silently fail
    console.debug('Tracking failed:', e);
  }
};

/**
 * Track when user clicks on a tour card
 */
export const trackClick = (
  tourId: string,
  options: {
    userId?: string | null;
    source?: SourceType;
    model?: ModelType | null;
    position?: number;
  } = {}
): void => {
  trackInteraction({
    tourId,
    type: 'click',
    ...options
  });
};

/**
 * Track when tour cards are displayed (impression)
 */
export const trackImpressions = (
  tourIds: string[],
  options: {
    userId?: string | null;
    source?: SourceType;
    model?: ModelType | null;
  } = {}
): void => {
  tourIds.forEach((tourId, index) => {
    trackInteraction({
      tourId,
      type: 'view',
      position: index,
      ...options
    });
  });
};

/**
 * Track when user bookmarks a tour
 */
export const trackBookmark = (
  tourId: string,
  userId: string,
  source?: SourceType
): void => {
  trackInteraction({
    userId,
    tourId,
    type: 'bookmark',
    source
  });
};

/**
 * Track when user shares a tour
 */
export const trackShare = (
  tourId: string,
  options: {
    userId?: string | null;
    source?: SourceType;
  } = {}
): void => {
  trackInteraction({
    tourId,
    type: 'share',
    ...options
  });
};

/**
 * Track booking completion (called from booking success page)
 */
export const trackBooking = (
  tourId: string,
  userId: string,
  source?: SourceType,
  model?: ModelType | null
): void => {
  trackInteraction({
    userId,
    tourId,
    type: 'booking',
    source,
    model
  });
};

/**
 * Track review submission
 */
export const trackReview = (
  tourId: string,
  userId: string,
  rating: number
): void => {
  trackInteraction({
    userId,
    tourId,
    type: 'review',
    value: rating
  });
};

/**
 * Track time spent viewing tour detail page
 * Call this when user leaves the page
 */
export const trackViewDuration = (
  tourId: string,
  durationSeconds: number,
  options: {
    userId?: string | null;
    source?: SourceType;
  } = {}
): void => {
  if (durationSeconds < 2) return; // Ignore very short views

  trackInteraction({
    tourId,
    type: 'view',
    duration: Math.round(durationSeconds),
    ...options
  });
};

/**
 * Hook-style tracker for tour detail page view duration
 * Returns cleanup function to call on unmount
 */
export const startViewTracking = (
  tourId: string,
  options: {
    userId?: string | null;
    source?: SourceType;
  } = {}
): (() => void) => {
  const startTime = Date.now();

  return () => {
    const duration = (Date.now() - startTime) / 1000;
    trackViewDuration(tourId, duration, options);
  };
};
