import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage, // current page number
  totalPages, // total number of pages
  setCurrentPage, // function to update current page number
  startIndex, // index of the first tracking in the current page
  endIndex, // index of the last tracking in the current page
  totalResults, // total number of filtered trackings
}) => {
  const maxVisiblePages = 5; // maximum number of visible pages for pagination

  // calculate the page numbers to display in the pagination
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  // function to handle click on a page number (navigate to the page)
  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-200 px-4 md:px-6 py-4 m-4 md:m-10">
      <div className="text-sm text-gray-700 text-center md:text-left">
        Showing <span className="font-medium">{startIndex}</span> to{" "}
        <span className="font-medium">{endIndex}</span> of{" "}
        <span className="font-medium">{totalResults}</span> results
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center px-3 md:px-4 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
            currentPage === 1
              ? "text-gray-300 border-gray-200 cursor-not-allowed"
              : "text-gray-500 hover:bg-gray-50 border-gray-300"
          }`}
        >
          <ChevronLeft className="h-4 w-4 mr-1 md:mr-2" />
          <span className="hidden md:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1 md:gap-2">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`min-w-[32px] md:min-w-[40px] h-8 md:h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                currentPage === page
                  ? "bg-green-500 text-white border border-green-500"
                  : "text-gray-500 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center px-3 md:px-4 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
            currentPage === totalPages
              ? "text-gray-300 border-gray-200 cursor-not-allowed"
              : "text-gray-500 hover:bg-gray-50 border-gray-300"
          }`}
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="h-4 w-4 ml-1 md:ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
