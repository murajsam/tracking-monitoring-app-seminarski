import React from "react";

// progress: percentage of file processing
// currentFile: current file being processed
// totalFiles: number of total files being processed
const LoadingSpinner = ({ progress, currentFile, totalFiles }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      {progress !== undefined &&
      currentFile !== undefined &&
      totalFiles !== undefined ? (
        <>
          <div className="relative">
            <div className="animate-spin rounded-full h-48 w-48 border-b-4 border-green-500 m-12"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="text-3xl font-bold text-green-500">
                {progress}%
              </span>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-700 mt-4">
            {`Processing file ${currentFile} of ${totalFiles}`}
          </p>
          <div className="w-1/2 h-2 bg-gray-200 rounded-full mt-4">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </>
      ) : (
        <>
          <div className="animate-spin rounded-full h-48 w-48 border-b-4 border-green-500 mb-4"></div>
          <p className="text-2xl font-semibold text-gray-700">
            Loading your data...
          </p>
        </>
      )}
    </div>
  );
};

export default LoadingSpinner;
