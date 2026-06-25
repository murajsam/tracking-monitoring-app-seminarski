import React, { useState } from "react";
import { Upload, ArrowRight } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between py-4 px-6 shadow-lg bg-white mb-10 text-xl">
      {/* logo */}
      <div className="flex items-center space-x-4">
        <a href="/" className="flex items-center">
          <img src="/images/logo.png" alt="Avnet Logo" className="h-8 w-auto" />
        </a>
      </div>

      {/* hamburger button */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-700 hover:text-black focus:outline-none absolute right-5 top-5"
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* menu */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } sm:flex flex-col sm:flex-row sm:w-auto mt-4 sm:mt-0 space-y-4 sm:space-y-0 sm:space-x-6 sm:mr-0 mr-6`}
      >
        <a
          href="/"
          className="text-gray-700 hover:text-green-500 flex items-center gap-1 justify-center"
        >
          Upload
          <Upload className="w-5 h-5" />
        </a>
        <a
          href="/overview"
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center gap-1 justify-center"
        >
          Overview <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
