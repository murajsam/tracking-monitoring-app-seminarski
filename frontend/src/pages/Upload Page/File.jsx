import React, { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { ChevronDown } from "lucide-react";

const File = ({
  name, // file name (with extension)
  status, // file status (Validated, Failed, N/A)
  carrier, // carrier name (DHL, Hellman, Logwin, Unknown)
  totalRows, // total number of rows to import to database from the file
  duplicatedRows, // number of duplicated rows in the file
  importedRows, // number of rows imported to the database
  successRate, // success rate of the import
  onRemove, // function to remove the file from the array
  showRemove, // boolean to show the remove button
  error, // error message if there is an error
  step, // current step of the upload process
}) => {
  const [showDetails, setShowDetails] = useState(false); // boolean to show additional details (imported rows, duplicated rows)

  // define color based on status (green for validated, red for failed and gray for N/A)
  const getStatusColor = () => {
    if (status === "Validated") return "text-green-500";
    if (status === "Failed") return "text-red-500";
    return "text-gray-500";
  };

  return (
    <div className="bg-gray-100 border p-4 flex flex-col items-center justify-center relative rounded-lg shadow-md">
      {/* remove button */}
      {showRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
          title="Remove File"
        >
          ✕
        </button>
      )}

      {/* excel icon */}
      <div className="flex flex-col items-center mb-4">
        <img
          src="https://www.freeiconspng.com/uploads/excel-icon-12.png"
          alt="Excel Icon"
          className="h-20 w-20"
        />
      </div>

      {/* file info */}
      <div className="text-center w-full">
        <p className="text-gray-700 font-semibold text-lg truncate">{name}</p>

        {/* carrier */}
        {carrier && (
          <p className="text-md mt-1 text-gray-600">
            Carrier:
            <span className="font-semibold ml-1">{carrier}</span>
          </p>
        )}

        {/* status */}
        <p className="text-md mt-1 text-gray-500">
          Status:
          <span className={`font-semibold ml-1 ${getStatusColor()}`}>
            {status}
          </span>
        </p>

        {/* information for steps 2 and above */}
        {step >= 3 && (
          <>
            {/* error message if exists */}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* success rate circle */}
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-lg text-gray-600">Success Rate</p>
              <div className="w-24 h-24">
                <CircularProgressbar
                  value={successRate}
                  text={`${successRate}%`}
                  styles={
                    totalRows === 0
                      ? buildStyles({
                          pathColor: "#4b5563",
                          textColor: "#4b5563",
                          trailColor: "#4b5563",
                        })
                      : buildStyles({
                          pathColor: "#22c55e",
                          textColor: "#374151",
                          trailColor: "#ef4444",
                        })
                  }
                />
              </div>
            </div>

            {/* toggle to show/hide additional details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4 text-sm font-bold text-gray-500 hover:text-gray-600 focus:outline-none flex flex-row justify-center items-center mx-auto"
            >
              Additional Information
              <ChevronDown
                className={`w-5 h-5 transform transition-transform duration-200 ${
                  showDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* additional details */}
            {showDetails && totalRows !== undefined && (
              <div className="mt-4 space-y-2">
                {/* imported rows */}
                <div>
                  <p className="text-sm text-gray-600">Imported Rows</p>
                  <div className="bg-gray-600 rounded-full h-3 w-full mt-1">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{
                        width: `${
                          (importedRows / (totalRows === 0 ? 1 : totalRows)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {importedRows} rows
                  </p>
                </div>

                {/* duplicated rows */}
                <div>
                  <p className="text-sm text-gray-600">Duplicated Rows</p>
                  <div className="bg-gray-600 rounded-full h-3 w-full mt-1">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{
                        width: `${
                          (duplicatedRows / (totalRows === 0 ? 1 : totalRows)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {duplicatedRows} rows
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default File;
