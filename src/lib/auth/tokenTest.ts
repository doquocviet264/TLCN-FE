/**
 * Utility script to test token and user data storage
 * Run this in browser console to verify storage is working
 */

export const testTokenStorage = {
  // Test 1: Check localStorage contents
  checkStorage: () => {
    console.group("📦 localStorage Contents");
    
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    
    console.log("Auth Store:", auth);
    console.log("Access Token exists:", !!accessToken);
    console.log("Access Token length:", accessToken?.length);
    console.log("Refresh Token exists:", !!refreshToken);
    console.log("Refresh Token length:", refreshToken?.length);
    
    console.groupEnd();
    return {
      authStore: auth,
      accessToken: accessToken ? `${accessToken.substring(0, 30)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.substring(0, 30)}...` : null,
    };
  },

  // Test 2: Decode JWT and check user ID
  decodeJWT: () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("❌ No access token found");
      return null;
    }
    
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.error("❌ Invalid JWT format");
        return null;
      }
      
      const decoded = JSON.parse(atob(parts[1]));
      console.group("🔓 JWT Decoded");
      console.log("Payload:", decoded);
      console.log("User ID:", decoded.id || decoded.sub || decoded.userId);
      console.log("Expires:", new Date(decoded.exp * 1000).toLocaleString());
      console.groupEnd();
      
      return decoded;
    } catch (e) {
      console.error("❌ Failed to decode JWT:", e);
      return null;
    }
  },

  // Test 3: Check Zustand store state
  checkZustandStore: async () => {
    try {
      const { useAuthStore } = await import("#/stores/auth");
      const state = useAuthStore.getState();
      
      console.group("🏪 Zustand Auth Store");
      console.log("Token:", state.token);
      console.log("User ID:", state.userId);
      console.log("Full State:", state);
      console.groupEnd();
      
      return state;
    } catch (e) {
      console.error("❌ Failed to access Zustand store:", e);
      return null;
    }
  },

  // Test 4: Simulate header profile fetch
  simulateHeaderFetch: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("❌ No token available");
      return;
    }
    
    try {
      console.log("📡 Fetching profile with token...");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.group("👤 Profile Response");
      console.log("Response:", data);
      console.log("User Name:", data?.user?.fullName || data?.fullName);
      console.log("User Email:", data?.user?.email || data?.email);
      console.log("User Points:", data?.user?.points || data?.points);
      console.groupEnd();
      
      return data;
    } catch (e) {
      console.error("❌ Failed to fetch profile:", e);
      return null;
    }
  },

  // Test 5: Clear all tokens
  clearAllData: () => {
    console.warn("🗑️  Clearing all tokens...");
    localStorage.removeItem("auth");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    console.log("✅ All tokens cleared");
  },

  // Test 6: Run all tests
  runAllTests: async function() {
    console.clear();
    console.log("🧪 Running all token & storage tests...\n");

    testTokenStorage.checkStorage();
    console.log("\n---\n");

    testTokenStorage.decodeJWT();
    console.log("\n---\n");

    await testTokenStorage.checkZustandStore();
    console.log("\n---\n");

    await testTokenStorage.simulateHeaderFetch();
    console.log("\n✅ All tests completed");
  },
};

// Auto-run tests on import (optional)
if (typeof window !== "undefined") {
  (window as any).testTokenStorage = testTokenStorage;
  console.log("💡 Token testing utilities loaded. Run testTokenStorage.runAllTests()");
}

export default testTokenStorage;
