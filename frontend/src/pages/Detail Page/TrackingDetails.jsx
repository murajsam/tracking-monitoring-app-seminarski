import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  File,
  Barcode,
  ClipboardList,
  Package,
  Weight,
  Calendar,
  ChevronDown,
  MapPin,
  ArrowLeft,
  Plane,
  Building,
  FileText,
  Info,
} from "lucide-react";
import InfoCard from "./InfoCard";
import { formatDateTime } from "../../utils/formatDateTimeUtils";

// component to display tracking details (file name, carrier, status, additional info, etc...)
const TrackingDetails = ({ tracking }) => {
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false); // boolean to show additional info
  const navigate = useNavigate(); // navigate to overview page

  // method to get carrier icon based on carrier name
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
    <div className="max-w-4xl w-full mx-auto p-5">
      <button
        onClick={() => navigate("/overview")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-150"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Overview</span>
      </button>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* header section */}
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              {getCarrierIcon(tracking?.data?.Carrier)}
            </div>
            <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-md font-medium">
              {tracking?.data?.Status || "Status Unknown"}
            </span>
          </div>

          {/* file information */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              File Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard
                icon={<File className="w-4 h-4" />}
                label="File Name"
                value={tracking?.fileName}
              />
              <InfoCard
                icon={<Calendar className="w-4 h-4" />}
                label="Date Added"
                value={formatDateTime(tracking?.dateAdded)}
              />
            </div>
          </div>

          {/* main tracking information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Tracking Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard
                icon={<Barcode className="w-4 h-4" />}
                label="PO Number"
                value={tracking?.data?.["PO Number"]}
              />
              <InfoCard
                icon={<ClipboardList className="w-4 h-4" />}
                label="House AWB"
                value={tracking?.data?.["House AWB"]}
              />
              <InfoCard
                icon={<FileText className="w-4 h-4" />}
                label="Shipper Ref. No"
                value={tracking?.data?.["Shipper Ref. No"]}
              />
              <InfoCard
                icon={<Package className="w-4 h-4" />}
                label="Packages"
                value={tracking?.data?.Packages}
              />
              <InfoCard
                icon={<Weight className="w-4 h-4" />}
                label="Weight"
                value={
                  tracking?.data?.Weight ? `${tracking.data.Weight} kg` : null
                }
              />
              <InfoCard
                icon={<Package className="w-4 h-4" />}
                label="Volume"
                value={
                  tracking?.data?.Volume ? `${tracking.data.Volume} m³` : null
                }
              />
            </div>
          </div>

          {/* parties information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Parties Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard
                icon={<Building className="w-4 h-4" />}
                label="Shipper"
                value={tracking?.data?.Shipper}
              />
              <InfoCard
                icon={<MapPin className="w-4 h-4" />}
                label="Shipper Country"
                value={tracking?.data?.["Shipper Country"]}
              />
              <InfoCard
                icon={<Building className="w-4 h-4" />}
                label="Receiver"
                value={tracking?.data?.Receiver}
              />
              <InfoCard
                icon={<MapPin className="w-4 h-4" />}
                label="Receiver Country"
                value={tracking?.data?.["Receiver Country"]}
              />
            </div>
          </div>

          {/* transport information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Transport Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard
                icon={<Plane className="w-4 h-4" />}
                label="Flight No"
                value={tracking?.data?.["Flight No"]}
              />
              <InfoCard
                icon={<Info className="w-4 h-4" />}
                label="Inco Term"
                value={tracking?.data?.["Inco Term"]}
              />
              <InfoCard
                icon={<Calendar className="w-4 h-4" />}
                label="Pick-up Date"
                value={formatDateTime(tracking?.data?.["Pick-up Date"])}
              />
              <InfoCard
                icon={<Calendar className="w-4 h-4" />}
                label="Latest Checkpoint"
                value={formatDateTime(tracking?.data?.["Latest Checkpoint"])}
              />
            </div>
          </div>

          {/* important dates */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Important Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InfoCard
                icon={<Calendar className="w-4 h-4" />}
                label="ETD"
                value={formatDateTime(tracking?.data?.ETD)}
              />
              <InfoCard
                icon={<Calendar className="w-4 h-4" />}
                label="ETA"
                value={formatDateTime(tracking?.data?.ETA)}
              />
              <InfoCard
                icon={<Calendar className="w-4 h-4" />}
                label="ATD"
                value={formatDateTime(tracking?.data?.ATD)}
              />
              <InfoCard
                icon={<Calendar className="w-4 h-4" />}
                label="ATA"
                value={formatDateTime(tracking?.data?.ATA)}
              />
            </div>
          </div>

          {/* additional info section */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <span className="text-lg font-medium text-gray-800">
                Additional Information
              </span>
              <ChevronDown
                className={`w-5 h-5 transform transition-transform duration-200 ${
                  showAdditionalInfo ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAdditionalInfo && tracking?.data?.["Additional Info"] && (
              <div className="p-4 space-y-4">
                {Object.entries(tracking.data["Additional Info"]).map(
                  ([key, value]) => {
                    // check if value is in ISO format: "YYYY-MM-DDTHH:mm:ss.sssZ" (if value is date in database, because all dates are that type)
                    const isIsoDate =
                      typeof value === "string" &&
                      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
                        value
                      );
                    const formattedValue = isIsoDate
                      ? formatDateTime(value) // if value is in ISO format, format it
                      : value?.toString() || "Not Specified"; // if value is not in ISO format, display it as a string

                    return (
                      <div key={key} className="flex flex-col">
                        <span className="text-sm text-gray-500">{key}</span>
                        <span className="text-sm font-medium">
                          {formattedValue}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingDetails;
