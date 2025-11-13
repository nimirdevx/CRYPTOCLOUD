import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <header className="mb-12">
        <h1 className="text-6xl font-extrabold text-white mb-4">
          Welcome to <span className="text-indigo-400">CryptoCloud</span>
        </h1>
        <p className="text-2xl text-gray-300 max-w-2xl">
          Your private, secure, zero-knowledge file storage. We can't see your
          files, and neither can anyone else.
        </p>
      </header>

      <div className="flex gap-6">
        <Link
          href="/auth/register"
          className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
        >
          Get Started for Free
        </Link>
        <Link
          href="/auth/login"
          className="px-8 py-3 text-lg font-semibold text-gray-900 bg-gray-200 rounded-lg shadow-lg hover:bg-white transition-transform transform hover:scale-105"
        >
          Sign In
        </Link>
      </div>

      <footer className="absolute bottom-10 text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} CryptoCloud. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
