import React from "react";

const InfoCard = ({
  icon, // icon to display (lucide icon)
  label, // label to display (carrier, status...)
  value, // label value to display (completed, date...)
}) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 text-gray-500 mb-1">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-sm font-medium">{value || "Not Specified"}</span>
  </div>
);

export default InfoCard;
