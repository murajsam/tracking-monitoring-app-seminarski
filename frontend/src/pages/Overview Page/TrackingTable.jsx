import React from "react";
import {
  Globe,
  File,
  Clock,
  ClipboardList,
  Barcode,
  Package,
  Weight,
  Calendar,
  Eye,
} from "lucide-react";
import { formatDateTime } from "../../utils/formatDateTimeUtils";

const TrackingTable = ({
  trackings, // array of tracking data
}) => {
  // function to get the carrier icon based on the carrier name
  const getCarrierIcon = (carrier) => {
    switch (carrier?.toLowerCase()) {
      case "hellman":
        return (
          <div className="flex items-center gap-2">
            <img
              src="/images/hellman.png"
              alt="Hellman Logo"
              className="w-6 h-6"
            />
            <span>Hellman</span>
          </div>
        );
      case "dhl":
        return (
          <div className="flex items-center gap-2">
            <img src="/images/dhl.png" alt="DHL Logo" className="w-6 h-6" />
            <span>DHL</span>
          </div>
        );
      case "logwin":
        return (
          <div className="flex items-center gap-2">
            <img
              src="/images/logwin.png"
              alt="Logwin Logo"
              className="w-6 h-6"
            />
            <span>Logwin</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Not Specified</span>
          </div>
        );
    }
  };

  return (
    <>
      {/* display the table with tracking data on desktop devices */}
      <div className="hidden 2xl:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    Carrier
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <File className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    File
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    Status
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <Barcode className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    PO Number
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <ClipboardList className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    House AWB
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <Package className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    Shipper
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <Weight className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    Weight
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    ETD
                  </span>
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-2 justify-center">
                  <Eye className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">
                    Actions
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-center">
            {trackings.map((tracking) => (
              <tr
                key={tracking._id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  {getCarrierIcon(tracking.data.Carrier)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {tracking.fileName || "Not Specified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {tracking.data.Status || "Not Specified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {tracking.data["PO Number"] || "Not Specified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {tracking.data["House AWB"] || "Not Specified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {tracking.data.Shipper || "Not Specified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {tracking.data.Weight
                    ? tracking.data.Weight + " kg"
                    : "Not Specified"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {tracking.data.ETD
                    ? formatDateTime(tracking.data.ETD)
                    : "Not Specified"}
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`/details/${tracking._id}`}
                    target="_self"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-600 hover:text-green-800 rounded-md hover:bg-green-50 transition-colors duration-150"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View Details</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* display the table with tracking data on mobile devices */}
      <div className="2xl:hidden space-y-4 p-5">
        {trackings.map((tracking) => (
          <div
            key={tracking._id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getCarrierIcon(tracking.data.Carrier)}
                </div>
                <a
                  href={`/details/${tracking._id}`}
                  target="_self"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-600 hover:text-green-800 rounded-md hover:bg-green-50 transition-colors duration-150"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">View Details</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <File className="w-4 h-4" />
                    <span className="text-xs">File</span>
                  </div>
                  <span className="text-sm">
                    {tracking.fileName || "Not Specified"}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Status</span>
                  </div>
                  <span className="text-sm">
                    {tracking.data.Status || "Not Specified"}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Barcode className="w-4 h-4" />
                    <span className="text-xs">PO Number</span>
                  </div>
                  <span className="text-sm">
                    {tracking.data["PO Number"] || "Not Specified"}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-xs">House AWB</span>
                  </div>
                  <span className="text-sm">
                    {tracking.data["House AWB"] || "Not Specified"}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-xs">Shipper</span>
                  </div>
                  <span className="text-sm">
                    {tracking.data.Shipper || "Not Specified"}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Weight className="w-4 h-4" />
                    <span className="text-xs">Weight</span>
                  </div>
                  <span className="text-sm">
                    {tracking.data.Weight || "Not Specified"}
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">ETD</span>
                  </div>
                  <span className="text-sm">
                    {tracking.data.ETD
                      ? formatDateTime(tracking.data.ETD)
                      : "Not Specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TrackingTable;
