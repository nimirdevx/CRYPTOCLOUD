"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { logout, jwt } = useAuth();
  const router = useRouter();

  // You can now use 'jwt' to make authenticated API calls

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-white">My Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-5 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">
          File Upload & List
        </h2>
        <p className="text-gray-300">
          (Coming soon... This is where your file upload component and file list
          will go.)
        </p>
      </div>
    </div>
  );
}
