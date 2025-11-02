// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

type Job = {
  jobId: string;
  employer: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  wageMin: number;
  wageMax: number;
  wageBonus: number;
  slotsRequired: number;
  bookedBy: string[];
};

interface User {
  userId: string;
  firstName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<Job[]>([]); // Will hold all jobs from the API
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]); // Will hold jobs to show in the UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookingJobId, setBookingJobId] = useState<string | null>(null);
  const [weeklySlots, setWeeklySlots] = useState(0);
  const [weeklyBookings, setWeeklyBookings] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceSearchError, setVoiceSearchError] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");

  // Inside the DashboardPage component
  const handleVoiceSearch = () => {
    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSearchError(
        "Sorry, your browser doesn't support speech recognition."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // Set language to Indian English
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setVoiceSearchError("");
    };

    recognition.onresult = (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      // After getting the result, send it to the backend
      sendTranscriptToGemini(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      setVoiceSearchError(`Error during recognition: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const sendTranscriptToGemini = async (text: string) => {
    if (!text) return;
    setVoiceResponse("Processing your request..."); // Give feedback
    setVoiceSearchError("");
    try {
      const response = await fetch("/api/gemini/process-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const criteria = await response.json();
      if (!response.ok) throw new Error(criteria.error || "API call failed");

      applyFilter(criteria); // Call our new filter function
    } catch (err: any) {
      setVoiceSearchError(err.message);
      setVoiceResponse("");
    }
  };

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const applyFilter = (criteria: { location?: string; date?: string }) => {
    let filtered = [...allJobs];
    let responseParts = [];

    if (criteria.location) {
      filtered = filtered.filter(
        (job) => job.location.toLowerCase() === criteria.location?.toLowerCase()
      );
      responseParts.push(`in ${criteria.location}`);
    }

    if (criteria.date) {
      filtered = filtered.filter((job) => job.date === criteria.date);
      const friendlyDate = new Date(criteria.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });
      responseParts.push(`for ${friendlyDate}`);
    }

    setDisplayedJobs(filtered);

    // Formulate a response
    if (responseParts.length > 0) {
      const responseText = `Okay, showing jobs ${responseParts.join(" ")}.`;
      setVoiceResponse(responseText);
      speak(responseText);
    } else {
      const responseText =
        "I couldn't find specific criteria. Showing all jobs.";
      setVoiceResponse(responseText);
      speak(responseText);
    }
  };

  const clearFilter = () => {
    setDisplayedJobs(allJobs);
    setTranscript("");
    setVoiceResponse("");
    setVoiceSearchError("");
  };

  // Add this new function inside the DashboardPage component
  const calculateWeeklyBookings = (jobs: Job[], userId: string) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    let count = 0;
    for (const job of jobs) {
      const jobDate = new Date(job.date);
      if (job.bookedBy.includes(userId) && jobDate >= startOfWeek) {
        count++;
      }
    }
    setWeeklyBookings(count);
  };

  // Function to fetch job data
  const fetchJobs = async (): Promise<Job[] | undefined> => {
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view jobs");
        }
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setAllJobs(data);
      setDisplayedJobs(data);
      return data; // Return the fetched data
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes("log in")) {
        router.push("/login");
      }
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch user info
  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          throw new Error("Please log in to continue");
        }
        throw new Error("Failed to fetch user info");
      }
      const userData = await response.json();
      setCurrentUser(userData);
    } catch (e: any) {
      console.error("Failed to get user info:", e);
      setError(e.message);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchUserInfo();
      const jobsData = await fetchJobs();
      if (jobsData && currentUser) {
        calculateWeeklyBookings(jobsData, currentUser.userId);
      }
    };
    initializeDashboard();
  }, []);

  const handleBookJob = async (jobId: string) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setBookingJobId(jobId);
    setError("");

    try {
      const response = await fetch("/api/jobs/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          throw new Error("Please log in to book jobs");
        }
        throw new Error(data.error || "Failed to book job");
      }

      // Update weekly slots count
      setWeeklySlots((prev) => prev + 1);

      // Show success message and refresh jobs
      setSuccessMessage(`Booking confirmed! Your Booking ID is: ${jobId}`);
      await fetchJobs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBookingJobId(null);
    }
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (error && allJobs.length === 0)
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Error: {error}
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Header
          userName={currentUser?.firstName}
          weeklyBookings={weeklyBookings}
        />

        {/* Inside the return(), right after the <Header ... /> component */}
        {successMessage && (
          <div className="mb-6 rounded-md border-l-4 border-green-500 bg-green-100 p-4 text-green-800">
            <p className="font-bold">Success!</p>
            <p>{successMessage}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Inside the return() of DashboardPage, above the "Available Jobs" h2 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold text-gray-700">
            Find Jobs with your Voice
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Click the button and say something like: "I am looking for a job in
            Yelahanka tomorrow".
          </p>
          <button
            onClick={handleVoiceSearch}
            disabled={isListening}
            className="flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {/* Basic microphone SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 2a1 1 0 11-2 0V4a1 1 0 112 0v2zm-4 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm-2 1a5 5 0 004.545 4.974A5.013 5.013 0 0015 11V8h-1v3a4 4 0 01-8 0V8H5v3z"
                clipRule="evenodd"
              />
            </svg>
            {isListening ? "Listening..." : "Speak to Find Job"}
          </button>
          {/* New UI for response and clearing filter */}
          {transcript && (
            <div className="mt-4 rounded-md bg-gray-100 p-3">
              <p className="text-sm text-gray-600">
                You said:{" "}
                <span className="font-semibold italic text-gray-800">
                  "{transcript}"
                </span>
              </p>
              {voiceResponse && (
                <p className="mt-1 text-sm font-medium text-purple-700">
                  {voiceResponse}
                </p>
              )}
              {voiceSearchError && (
                <p className="mt-1 text-sm text-red-600">{voiceSearchError}</p>
              )}

              {/* Show clear button only if a filter has been applied */}
              {displayedJobs.length !== allJobs.length && (
                <button
                  onClick={clearFilter}
                  className="mt-2 rounded-md bg-gray-600 px-3 py-1 text-xs text-white transition hover:bg-gray-700"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>

        <h2 className="mb-4 text-2xl font-semibold text-gray-700">
          Available Jobs
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedJobs.map((job) => {
            const slotsLeft = job.slotsRequired - job.bookedBy.length;
            const isAlreadyBooked = currentUser
              ? job.bookedBy.includes(currentUser.userId)
              : false;
            const isBooking = bookingJobId === job.jobId;

            return (
              <div
                key={job.jobId}
                className={`rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                  isAlreadyBooked ? "border-green-400" : "border-gray-200"
                }`}
              >
                {/* ... (rest of the card content is the same) ... */}
                <h3 className="text-xl font-bold text-gray-900">
                  {job.employer}
                </h3>
                <p className="text-md mb-2 text-gray-600">{job.location}</p>

                <div className="my-4 space-y-2 border-y py-3">
                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {new Date(job.date).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-semibold">Time:</span> {job.startTime}{" "}
                    - {job.endTime}
                  </p>
                  <p className="font-bold text-green-600">
                    Wage: ₹{job.wageMin}-₹{job.wageMax} + ₹{job.wageBonus}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Slots Left: {slotsLeft}
                  </p>
                  <button
                    onClick={() => handleBookJob(job.jobId)}
                    disabled={
                      isBooking ||
                      slotsLeft === 0 ||
                      isAlreadyBooked ||
                      weeklyBookings >= 14
                    }
                    className={`rounded-md px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:bg-gray-400 
                      ${
                        isBooking
                          ? "bg-yellow-500"
                          : isAlreadyBooked
                          ? "bg-green-600"
                          : weeklyBookings >= 14
                          ? "bg-yellow-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    {isBooking
                      ? "Booking..."
                      : isAlreadyBooked
                      ? "Booked ✓"
                      : weeklyBookings >= 14
                      ? "Weekly Limit Reached"
                      : `Book Slot (${slotsLeft} left)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
