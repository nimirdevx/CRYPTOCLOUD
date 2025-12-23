import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                CryptoCloud
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm lg:text-base"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm lg:text-base"
              >
                How it Works
              </a>
              <a
                href="#security"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm lg:text-base"
              >
                Security
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/auth/login"
                className="px-3 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base font-semibold btn-purple rounded-lg sm:rounded-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - See reference image 1 & 2 */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-purple-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left animate-slideInLeft">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Cloud storage that puts{" "}
                <span className="gradient-text-purple">privacy first</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Zero-knowledge cloud storage with client-side encryption. Your
                files are encrypted in your browser before upload - we never see
                your data.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6 sm:mb-8">
                <Link
                  href="/auth/register"
                  className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold btn-purple rounded-xl inline-flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                  Open Cloud
                </Link>
                <Link
                  href="/auth/login"
                  className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold btn-outline rounded-xl inline-flex items-center justify-center gap-2"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 justify-center lg:justify-start">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Get 5 GB of free storage</span>
              </div>
            </div>

            {/* Illustration - See reference image 3 */}
            <div className="relative animate-slideInRight">
              <div className="relative bg-linear-to-br from-purple-100 to-purple-50 rounded-3xl p-6 sm:p-12 shadow-2xl">
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      My Files
                    </h3>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 gradient-purple rounded-lg flex items-center justify-center">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 sm:h-3 bg-gray-300 rounded w-3/4 mb-1 sm:mb-2"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-green-900">
                        Security status
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-green-600">
                        Encrypted
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-16 h-16 sm:w-24 sm:h-24 gradient-purple rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                  <svg
                    className="w-8 h-8 sm:w-12 sm:h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - See reference image 4 */}
      <section id="features" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 animate-fadeIn">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Manage files privately with{" "}
              <span className="gradient-text-purple">confidence</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              CryptoCloud keeps your data secure with client-side encryption and
              zero-knowledge architecture. We use AES-256-GCM combined with
              RSA-OAEP to ensure your files are encrypted before they ever leave
              your device.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            <div className="text-center p-6 sm:p-8 card-hover bg-white rounded-2xl sm:rounded-3xl border border-gray-100 animate-slideUp">
              <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 sm:mb-8 bg-linear-to-br from-purple-100 to-purple-50 rounded-3xl flex items-center justify-center">
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Encrypted cloud storage
              </h3>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Upload files to the cloud and sync across devices and platforms.
                All encryption happens in your browser using AES-256-GCM. The
                server only stores encrypted blobs and never sees your data.
              </p>
            </div>

            <div
              className="text-center p-6 sm:p-8 card-hover bg-white rounded-2xl sm:rounded-3xl border border-gray-100 animate-slideUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 sm:mb-8 bg-linear-to-br from-blue-100 to-blue-50 rounded-3xl flex items-center justify-center">
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Private file sharing
              </h3>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Share encrypted files securely via email or link. Files are
                shared using public key cryptography, ensuring end-to-end
                encryption even when sharing with others.
              </p>
            </div>

            <div
              className="text-center p-6 sm:p-8 card-hover bg-white rounded-2xl sm:rounded-3xl border border-gray-100 animate-slideUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 sm:mb-8 bg-linear-to-br from-red-100 to-red-50 rounded-3xl flex items-center justify-center">
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                No leaks or stolen files
              </h3>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Your files are protected with zero-knowledge encryption. We
                cannot access your data even if we wanted to. Your master key
                never leaves your device, ensuring complete privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Reference image 4 */}
      <section id="how-it-works" className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              How it <span className="gradient-text-purple">works</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with CryptoCloud in three simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-12 sm:space-y-20">
            {/* Step 1 */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 gradient-purple rounded-2xl text-white text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                  1
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Create your account
                </h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
                  Sign up for free and get 5 GB of secure storage space. No
                  credit card required. Your master password is generated on
                  your device and never sent to our servers.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    "Zero-knowledge architecture",
                    "Instant setup in seconds",
                    "No personal data collected",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-base sm:text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl shadow-xl">
                  <div className="aspect-square bg-linear-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-20 h-20 sm:w-16 sm:h-16 lg:w-40 lg:h-40 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl shadow-xl">
                  <div className="aspect-square bg-linear-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-20 h-20 sm:w-16 sm:h-16 lg:w-40 lg:h-40 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 gradient-purple rounded-2xl text-white text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                  2
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Upload your files
                </h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
                  Drag and drop files or folders to upload. Your files are
                  encrypted locally on your device before being uploaded to our
                  secure cloud servers.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    "End-to-end encryption",
                    "Support for all file types",
                    "Automatic sync across devices",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-base sm:text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 gradient-purple rounded-2xl text-white text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                  3
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Access anywhere, anytime
                </h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
                  Access your files from any device, anywhere in the world.
                  Share files securely with friends, family, or colleagues .
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    "Cross-platform access",
                    "Secure file sharing",
                    "Download original files anytime",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-base sm:text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl shadow-xl">
                  <div className="aspect-square bg-linear-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-20 h-20 sm:w-16 sm:h-26 lg:w-40 lg:h-40 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Security Section - Reference image 1 */}
      <section id="security" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Enterprise-grade{" "}
              <span className="gradient-text-purple">security</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              CryptoCloud uses a hybrid encryption model combining AES-256-GCM
              and RSA-OAEP. All encryption happens client-side in your browser,
              ensuring true zero-knowledge security.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {[
              {
                title: "AES-256-GCM Encryption",
                description:
                  "Military-grade authenticated encryption providing both confidentiality and data integrity for your files.",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              },
              {
                title: "RSA-OAEP Encryption",
                description:
                  "Secure asymmetric encryption for key exchange and file sharing with optimal padding protection.",
                icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
              },
              {
                title: "Client-Side Encryption",
                description:
                  "All encryption happens in your browser using Web Crypto API before data ever leaves your device.",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              },
              {
                title: "Zero-Knowledge Architecture",
                description:
                  "Your encryption keys never leave your device. We can't access your files even if we wanted to.",
                icon: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
              },
              {
                title: "PBKDF2 Key Derivation",
                description:
                  "Password-based key derivation with high iteration count, protecting against brute-force attacks.",
                icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
              },
              {
                title: "Two-Factor Authentication",
                description:
                  "TOTP-based 2FA with backup codes for enhanced account security and additional protection.",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 sm:p-8 bg-gray-50 rounded-2xl card-hover"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-purple rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={feature.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="bg-linear-to-br from-purple-600 to-purple-700 rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white shadow-2xl">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
              Ready to secure your files?
            </h3>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of users who trust CryptoCloud to keep their data
              safe and private.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Get Started Free
              </Link>
              <Link
                href="/auth/login"
                className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-purple rounded-xl flex items-center justify-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>

                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  CryptoCloud
                </span>
              </div>

              <p className="text-sm sm:text-base text-gray-600 max-w-xs">
                Secure, private, zero-knowledge cloud storage for everyone.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm sm:text-base text-gray-600">
              &copy; {new Date().getFullYear()} CryptoCloud. All rights
              reserved.
            </p>
            <div className="flex items-center gap-4">
              {["256-bit AES", "Zero-Knowledge", "Open Source"].map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600"
                >
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
