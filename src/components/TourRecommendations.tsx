'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useUser from '@/hooks/useUser';
import { trackClick, trackImpressions, SourceType, ModelType } from '@/utils/tracking';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Tour {
  _id: string;
  title: string;
  destination: string;
  destinationSlug?: string;
  priceAdult: number;
  priceChild?: number;
  time?: string;
  images: string[];
}

interface ApiResponse {
  data: Tour[];
  model?: ModelType;
}

interface Props {
  type: 'homepage' | 'similar' | 'post-booking';
  tourId?: string;
  heading?: string;
  limit?: number;
}

export default function TourRecommendations({ type, tourId, heading, limit = 4 }: Props) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<ModelType | null>(null);
  const { user } = useUser();

  // Map component type to tracking source
  const getSource = (): SourceType => {
    switch (type) {
      case 'homepage': return 'homepage';
      case 'similar': return 'similar';
      case 'post-booking': return 'post_booking';
      default: return 'direct';
    }
  };

  useEffect(() => {
    const fetchRec = async () => {
      try {
        let url = '';
        if (type === 'homepage') {
          // Include userId for personalization
          const userId = user?.id || '';
          url = `${API_BASE}/api/recommendations/homepage?limit=${limit}${userId ? `&userId=${userId}` : ''}`;
        }
        if (type === 'similar' && tourId) {
          url = `${API_BASE}/api/recommendations/similar/${tourId}?limit=${limit}`;
        }
        if (type === 'post-booking' && tourId) {
          const userId = user?.id || '';
          url = `${API_BASE}/api/recommendations/post-booking/${tourId}?limit=${limit}${userId ? `&userId=${userId}` : ''}`;
        }

        if (!url) {
          setLoading(false);
          return;
        }

        const res = await fetch(url, { credentials: 'include' });
        const json: ApiResponse = await res.json();

        setTours(json.data ?? []);
        setModel(json.model || null);

        // Track impressions when recommendations are displayed
        if (json.data && json.data.length > 0) {
          trackImpressions(
            json.data.map(t => t._id),
            {
              userId: user?.id,
              source: getSource(),
              model: json.model || null
            }
          );
        }
      } catch (err) {
        console.error('Recommendation fetch error:', err);
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRec();
  }, [type, tourId, limit, user?.id]);

  // Handle tour click with tracking
  const handleTourClick = useCallback((clickedTourId: string, position: number) => {
    trackClick(clickedTourId, {
      userId: user?.id,
      source: getSource(),
      model,
      position
    });
  }, [user?.id, model, type]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-slate-200">
              <div className="h-40 bg-slate-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tours.length === 0) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const getSlug = (tour: Tour) => {
    if (tour.destinationSlug) return tour.destinationSlug;
    return (tour.destination || tour.title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {heading ?? 'Tour gợi ý cho bạn'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tours.map((tour, index) => (
          <Link
            key={tour._id}
            href={`/user/destination/${getSlug(tour)}/${tour._id}`}
            onClick={() => handleTourClick(tour._id, index)}
            className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative h-40 overflow-hidden bg-slate-100">
              {tour.images?.[0] ? (
                <Image
                  src={tour.images[0]}
                  alt={tour.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Duration badge */}
              {tour.time && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[11px] font-semibold text-white">
                  {tour.time}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-orange-600 transition-colors min-h-[40px]">
                {tour.title}
              </h3>

              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{tour.destination}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-base font-bold text-orange-600">
                  {formatPrice(tour.priceAdult)}
                  <span className="text-xs font-normal text-slate-500 ml-1">/người</span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
