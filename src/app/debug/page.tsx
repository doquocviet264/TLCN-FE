/**
 * Debug page to test token and user info loading
 * Access at: /debug
 */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuthStore } from "#/stores/auth";
import { authApi } from "@/lib/auth/authApi";
import { getUserToken } from "@/lib/auth/tokenManager";
import { debugTokenAndUser } from "@/lib/auth/tokenDebug";
import { toast } from "react-hot-toast";

export default function DebugPage() {
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const accessToken = useAuthStore((s) => s.token.accessToken);
  const storageToken = getUserToken();

  useEffect(() => {
    debugTokenAndUser.logTokenLoad("DebugPage.mount");
  }, []);

  const handleFetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = accessToken || storageToken;
      if (!token) {
        setError("No token found. Please login first.");
        return;
      }

      debugTokenAndUser.logTokenLoad("DebugPage.fetchProfile[start]");
      const profile = await authApi.getProfile(token);
      debugTokenAndUser.logUserProfileLoad("DebugPage.fetchProfile[success]", profile);
      setUserProfile(profile);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to fetch profile";
      setError(message);
      debugTokenAndUser.logUserProfileLoad("DebugPage.fetchProfile[error]", {
        error: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStorage = () => {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const token = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    setTokenStatus({
      zustandStore: auth,
      accessToken: token ? `${token.substring(0, 50)}...` : null,
      refreshToken: refresh ? `${refresh.substring(0, 50)}...` : null,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });
  };

  const handleClearStorage = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setTokenStatus(null);
    setUserProfile(null);
    toast.success("Tokens cleared. Please reload the page.");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">🔍 Token & User Debug</h1>

        {/* Token Status */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">📦 Token Status</h2>
          <div className="space-y-2">
            <p>
              <strong>From Zustand Store:</strong>{" "}
              {accessToken ? `✅ ${accessToken.substring(0, 50)}...` : "❌ None"}
            </p>
            <p>
              <strong>From localStorage:</strong>{" "}
              {storageToken ? `✅ ${storageToken.substring(0, 50)}...` : "❌ None"}
            </p>
          </div>
          <div className="mt-4 space-x-2">
            <button
              onClick={handleCheckStorage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Check Storage
            </button>
            <button
              onClick={handleClearStorage}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Clear All Tokens
            </button>
          </div>
        </section>

        {/* Storage Details */}
        {tokenStatus && (
          <section className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">📋 Storage Details</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(tokenStatus, null, 2)}
            </pre>
          </section>
        )}

        {/* User Profile */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">👤 User Profile</h2>
          <button
            onClick={handleFetchProfile}
            disabled={loading || (!accessToken && !storageToken)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Fetching..." : "Fetch Profile"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {userProfile && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Full Name:</strong>
                  <p className="text-gray-600">{userProfile.fullName}</p>
                </div>
                <div>
                  <strong>Email:</strong>
                  <p className="text-gray-600">{userProfile.email}</p>
                </div>
                <div>
                  <strong>Phone:</strong>
                  <p className="text-gray-600">{userProfile.phone}</p>
                </div>
                <div>
                  <strong>Points:</strong>
                  <p className="text-gray-600">{userProfile.points}</p>
                </div>
                <div>
                  <strong>Status:</strong>
                  <p className="text-gray-600">{userProfile.memberStatus}</p>
                </div>
                <div>
                  <strong>ID:</strong>
                  <p className="text-gray-600">{userProfile.id}</p>
                </div>
              </div>
              <div className="mt-4">
                <strong>Avatar:</strong>
                {userProfile.avatar && (
                  <div className="mt-2">
                    <Image
                      src={userProfile.avatar}
                      alt="Avatar"
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/Image.svg";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Instructions */}
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-yellow-800 mb-2">💡 Instructions</h2>
          <ul className="text-yellow-700 space-y-1 list-disc list-inside">
            <li>Login first at /auth/login</li>
            <li>Open browser DevTools (F12) → Console tab</li>
            <li>Look for logs starting with 🔐, 👤, 📱, 🛒</li>
            <li>Run Check Storage to see all stored tokens</li>
            <li>Run Fetch Profile to test API integration</li>
            <li>Check Network tab to see API requests</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
