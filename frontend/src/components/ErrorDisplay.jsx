import React from "react";
import { X } from "lucide-react";

// message: error message to display
const ErrorDisplay = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-96">
      <X className="text-red-600 w-36 h-36" />
      <h2 className="text-2xl font-bold text-red-600 mt-4">{message}</h2>
    </div>
  );
};

export default ErrorDisplay;
