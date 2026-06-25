import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SearchBar from "./SearchBar";
import ActiveFilters from "./ActiveFilters";
import FilterPanel from "./FilterPanel";
import TrackingTable from "./TrackingTable";
import Pagination from "./Pagination";
import { filterTrackings } from "../../utils/filterTrackingUtils";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorDisplay from "../../components/ErrorDisplay";

const OverviewPage = () => {
  const [trackings, setTrackings] = useState([]); // array of tracking data
  const [filteredTrackings, setFilteredTrackings] = useState([]); // array of tracking data after applying filters
  const [showFilters, setShowFilters] = useState(false); // boolean to show/hide filter panel
  const [selectedFilters, setSelectedFilters] = useState({
    // object of selected filters
    carrier: "All", // carrier filter (All, DHL, Hellman, Logwin)
    status: "All", // status filter (All, other values are dynamic based on imported tracking data)
    shipper: "All", // shipper filter (All, other values are dynamic based on imported tracking data)
    weight: "All", // weight filter (All, 0-10 kg, 10-50 kg, 50-100 kg, 100+ kg)
    dateRange: "All", // date range filter (All, Last 7 days, Last 30 days, Last 90 days, Last 180 days, Last 365 days, Custom range)
    customDateRange: { start: null, end: null }, // custom date range filter (only visible when dateRange is set to Custom range, allows user to select start and end date)
    search: { term: "", field: "All" }, // search filter (allows user to search for specific term in specific field or all fields)
  });
  const [currentPage, setCurrentPage] = useState(1); // current page number
  const [isLoading, setIsLoading] = useState(true); // boolean to show/hide loading spinner

  const ITEMS_PER_PAGE = 15; // number of trackings per page

  // fetch tracking data from backend API on page load
  useEffect(() => {
    fetchTrackings();
  }, []);

  // apply filters and search when trackings or selectedFilters change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [trackings, selectedFilters]);

  // fetch tracking data from backend API
  const fetchTrackings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/trackings/all"
      );
      if (response.status === 200) {
        setTrackings(response.data);
        setFilteredTrackings(response.data);
      }
    } catch (error) {
      console.error("Error fetching trackings:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // applies list of filters to tracking data and updates current page to 1
  const applyFiltersAndSearch = () => {
    setShowFilters(false);
    let result = filterTrackings(trackings, selectedFilters); // result is array of filtered tracking data
    setFilteredTrackings(result);
    setCurrentPage(1);
  };

  // removes filter from object list of filters based on key and updates current page to 1
  const removeFilter = (key) => {
    setShowFilters(false);
    setSelectedFilters((prev) => {
      const updatedFilters = { ...prev };

      if (key === "dateRange") {
        updatedFilters.dateRange = "All";
        updatedFilters.customDateRange = { start: null, end: null };
      } else if (key === "search") {
        updatedFilters.search = { term: "", field: "All" };
      } else {
        updatedFilters[key] = "All";
      }

      return updatedFilters;
    });
  };

  // clears all filters and updates current page to 1
  const clearFilters = () => {
    setShowFilters(false);
    setSelectedFilters({
      carrier: "All",
      status: "All",
      shipper: "All",
      weight: "All",
      dateRange: "All",
      customDateRange: { start: null, end: null },
      search: { term: "", field: "All" },
    });
  };

  const totalPages = Math.ceil(filteredTrackings.length / ITEMS_PER_PAGE); // calculate total number of pages based on number of trackings and items per page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE; // calculate start index based on current page and items per page
  const endIndex = startIndex + ITEMS_PER_PAGE; // calculate end index based on start index and items per page
  const currentTrackings = filteredTrackings.slice(startIndex, endIndex); // slice the filtered trackings array to get the current page of trackings

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      <div className="bg-gray-100 px-4 sm:px-6">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-700 text-center mb-6 sm:mb-10">
          Tracking Overview
        </h1>

        {/* if isLoading is true, display the loading spinner, otherwise display the tracking table with filters and pagination */}
        {!isLoading && (
          <div className="flex flex-col items-center">
            <SearchBar
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
            />
            {showFilters && (
              <FilterPanel
                applyFilters={(filters) => setSelectedFilters(filters)}
                closePanel={() => setShowFilters(false)}
                selectedFilters={selectedFilters}
                trackings={trackings}
              />
            )}
            <ActiveFilters
              selectedFilters={selectedFilters}
              clearFilters={clearFilters}
              removeFilter={removeFilter}
            />
          </div>
        )}
      </div>
      <div className="flex-grow flex items-center justify-center">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="w-full px-4 sm:px-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {/* if there's no tracking data at all, ask the user to import some data, if there are no results for filters, ask the user to adjust filters or search, otherwise display filtered tracking table */}
              {trackings.length === 0 ? (
                <ErrorDisplay message="No data available. Please import some data." />
              ) : filteredTrackings.length === 0 ? (
                <ErrorDisplay message="No results found. Try adjusting your filters or search query." />
              ) : (
                <TrackingTable trackings={currentTrackings} />
              )}
            </div>
            {filteredTrackings.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalResults={filteredTrackings.length}
              />
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OverviewPage;
