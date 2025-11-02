// components/Header.tsx
"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
  userName: string | undefined;
  weeklyBookings: number;
}

export default function Header({ userName, weeklyBookings }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      router.push("/login"); // Redirect to login page on successful logout
    } else {
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <header className="mb-8 rounded-lg bg-white p-6 shadow">
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {userName || "Laborer"}!
          </h1>
          <p className="mt-1 text-gray-600">Your weekly job dashboard.</p>
        </div>
        <div className="mt-4 flex w-full items-center justify-between sm:mt-0 sm:w-auto sm:space-x-6">
          <div className="text-left sm:text-right">
            <p className="font-semibold text-gray-700">
              Slots Booked this Week:
            </p>
            <p
              className={`text-2xl font-bold ${
                weeklyBookings >= 14 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {weeklyBookings} / 14
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
