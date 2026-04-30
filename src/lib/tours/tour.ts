import axiosInstance from "@/lib/axiosInstance";


/** Kiểu tour danh sách */
export type Tour = {
  _id: string | number;
  title: string;
  image?: string;
  cover?: string;
  destinationSlug?: string;
  priceAdult?: number | string;
  priceChild?: number | string;
  salePrice?: number | string;
  discountPercent?: number;
  discountAmount?: number;
  quantity?: number | string;
  time?: string;             // "3 ngày 2 đêm"
  startDate?: string;
  endDate?: string;
  destination?: string;
  status?: "active" | "hidden" | "paused" | "deleted";
};

/** Kiểu chi tiết tour */
export type TourDetail = Tour & {
  tourId?: string | number;
  description?: string;
  images?: string[];

  rating?: number;
  reviewsCount?: number;
  reviews?: Array<{
    stars?: number;
    comment?: string;
    createdAt?: string;
    userName?: string;
  }>;

  itinerary?: Array<{
    day: number;
    title: string;
    content: string;
    image?: string;
  }>;
  timeline?: Array<{
    timeLineId?: string | number;
    title: string;
    description: string;
    image?: string;
  }>;
};

export type ToursResponse = {
  data: Tour[];
  total: number;
  page: number;
  limit: number;
};

/** Query linh hoạt: chấp nhận nhiều key mà backend có thể dùng */
export type ToursQuery = Partial<{
  q: string;                // keyword có dấu
  keyword: string;          // alias
  search: string;           // alias
  s: string;                // alias
  destination: string;      // thường là slug
  destinationSlug: string;  // alias
  slug: string;             // alias
  from: string;             // YYYY-MM-DD (start date)
  startDate: string;        // alias
  budgetMin: number;
  budgetMax: number;
  minPrice: number;         // alias
  maxPrice: number;         // alias
  priceMin: number;         // alias
  priceMax: number;         // alias
}>;

/** Chuẩn hoá query gửi lên để backend nào cũng “ăn” */
const buildParams = (page = 1, limit = 9, query?: ToursQuery) => {
  const q = query ?? {};
  const params: Record<string, any> = { page, limit };

  // keyword
  const keyword =
    q.q ?? q.keyword ?? q.search ?? q.s ?? undefined;
  if (keyword) {
    params.q = keyword;
    params.keyword = keyword;
    params.search = keyword;
  }

  // destination slug
  const dest =
    q.destination ?? q.destinationSlug ?? q.slug ?? undefined;
  if (dest) {
    params.destination = dest;
    params.destinationSlug = dest;
    params.slug = dest;
  }

  // date
  const from = q.from ?? q.startDate ?? undefined;
  if (from) {
    params.from = from;
    params.startDate = from;
  }

  // price/budget
  const min = q.budgetMin ?? q.minPrice ?? q.priceMin ?? undefined;
  const max = q.budgetMax ?? q.maxPrice ?? q.priceMax ?? undefined;
  if (typeof min === "number") {
    params.budgetMin = min;
    params.minPrice = min;
    params.priceMin = min;
  }
  if (typeof max === "number") {
    params.budgetMax = max;
    params.maxPrice = max;
    params.priceMax = max;
  }

  return params;
};

export const getTours = async (
  page = 1,
  limit = 9,
  query?: ToursQuery
): Promise<ToursResponse> => {
  const res = await axiosInstance.get<ToursResponse>("/tours", {
    params: buildParams(page, limit, query),
  });
  return res.data;
};
export const searchTours = async (
  page = 1,
  limit = 9,
  query?: ToursQuery
): Promise<ToursResponse> => {
  const params: Record<string, any> = { page, limit };

  if (query?.search) {
    // BE sử dụng 'q' cho keyword
    params.q = query.search;
  }
  if (query?.q) {
    params.q = query.q;
  }
  if (query?.from) {
    params.from = query.from;
  }
  if (query?.destination) {
    params.destination = query.destination;
  }
  if (typeof query?.minPrice === "number") {
    params.budgetMin = query.minPrice;
  }
  if (typeof query?.budgetMin === "number") {
    params.budgetMin = query.budgetMin;
  }
  if (typeof query?.maxPrice === "number") {
    params.budgetMax = query.maxPrice;
  }
  if (typeof query?.budgetMax === "number") {
    params.budgetMax = query.budgetMax;
  }

  const res = await axiosInstance.get<ToursResponse>("/tours/search", {
    params,
  });
  return res.data;
};

export const getTourById = async (id: string | number): Promise<TourDetail> => {
  const res = await axiosInstance.get<TourDetail>(`/tours/${id}`);
  return res.data;
};

export const getTourDepartures = async (id: string | number): Promise<any> => {
  const res = await axiosInstance.get(`/tours/${id}/departures`);
  return res.data;
};

export const getDepartureById = async (id: string | number): Promise<any> => {
  const res = await axiosInstance.get(`/tours/departures/${id}`);
  return res.data;
};
