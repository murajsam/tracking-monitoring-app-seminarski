import React from "react";
import { X } from "lucide-react";

const ActiveFilters = ({
  selectedFilters, // object of selected filters (carrier, status, shipper, weight, dateRange, customDateRange)
  clearFilters, // function to clear all filters
  removeFilter, // function to remove a specific filter
}) => {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {/* display active filters based on selectedFilters */}
      {Object.entries(selectedFilters)
        .filter(([key, value]) => {
          if (key === "customDateRange") {
            // display only if custom range is selected and at least one date is not empty
            return (
              selectedFilters.dateRange === "Custom range" &&
              (value.start || value.end)
            );
          }
          if (key === "search") {
            return value.term !== ""; // display if there is a search term
          }
          if (key === "dateRange") {
            // do not display dateRange if custom range is selected and both dates are empty
            return (
              value !== "All" &&
              !(
                value === "Custom range" &&
                !selectedFilters.customDateRange.start &&
                !selectedFilters.customDateRange.end
              )
            );
          }
          return value !== "All"; // display all other active filters
        })
        .map(([key, value]) => {
          if (key === "customDateRange") {
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 py-1 bg-green-50 text-green-700 rounded-full text-sm"
              >
                Custom Range: {value.start || "Not set"} -{" "}
                {value.end || "Not set"}
                <X
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => removeFilter("dateRange")}
                />
              </span>
            );
          }
          if (key === "search") {
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 py-1 bg-green-50 text-green-700 rounded-full text-sm"
              >
                Search: {value.term} ({value.field})
                <X
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => removeFilter("search")}
                />
              </span>
            );
          }
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1 py-1 bg-green-50 text-green-700 rounded-full text-sm"
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
              <X
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  removeFilter(
                    key === "customDateRange" || key === "dateRange"
                      ? "dateRange"
                      : key
                  )
                }
              />
            </span>
          );
        })}

      {/* display clear all filters button if there are active filters */}
      {Object.entries(selectedFilters).some(([key, value]) => {
        if (key === "customDateRange") {
          // check if both dates are empty
          return value?.start || value?.end;
        }
        if (key === "search") {
          return value.term !== ""; // check if there is a search term
        }
        if (key === "dateRange") {
          // do not display dateRange if custom range is selected and both dates are empty
          return (
            value !== "All" &&
            !(
              value === "Custom range" &&
              !selectedFilters.customDateRange.start &&
              !selectedFilters.customDateRange.end
            )
          );
        }
        return value !== "All"; // display all other active filters
      }) && (
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
};

export default ActiveFilters;
