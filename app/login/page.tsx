// app/login/page.tsx
"use client"; // This directive is essential for pages with user interaction

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");

  // State to manage the UI flow
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  // --- Step 1: Request OTP ---
  const handleGetOtp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mobileNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // If successful, show the OTP field
      setIsOtpSent(true);
      setMessage("OTP has been sent. Please check the console.");
      console.log("OTP for Testing:", data.otpForTesting);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Verify OTP and Login ---
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, otp, userId }), // Also send userId
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // If login is successful, redirect to the dashboard
      setMessage("Login successful! Redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          NaukriBandhu Login
        </h1>

        {/* --- Form to Get User ID and Mobile Number --- */}
        {!isOtpSent ? (
          <form onSubmit={handleGetOtp}>
            <div className="mb-4">
              <label
                htmlFor="userId"
                className="mb-2 block text-sm font-medium text-gray-600"
              >
                User ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., arjun1234"
                required
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="mobileNumber"
                className="mb-2 block text-sm font-medium text-gray-600"
              >
                Mobile Number
              </label>
              <input
                id="mobileNumber"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10-digit number"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 p-3 text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Get OTP"}
            </button>
          </form>
        ) : (
          /* --- Form to Enter OTP --- */
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <p className="text-center text-sm text-gray-600">
                Enter the OTP sent to your number.
              </p>
            </div>
            <div className="mb-6">
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-gray-600"
              >
                OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 text-center text-2xl tracking-widest text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-green-600 p-3 text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Login"}
            </button>
          </form>
        )}

        {/* --- Displaying Messages --- */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}
        {message && (
          <p className="mt-4 text-center text-sm text-green-600">{message}</p>
        )}
      </div>
    </main>
  );
}
