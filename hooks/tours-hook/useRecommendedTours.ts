import { useQuery } from "@tanstack/react-query";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchRecommended(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/recommendations/homepage`, {
    credentials: "include", // gửi cookie auth
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function useRecommendedTours() {
  return useQuery({
    queryKey: ["recommendations", "homepage"],
    queryFn: fetchRecommended,
    staleTime: 5 * 60 * 1000, // cache 5 phút
    initialData: [], // không flash undefined
  });
}
