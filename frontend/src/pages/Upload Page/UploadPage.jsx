import React from "react";
import Navbar from "../../components/Navbar";
import UploadFile from "./UploadFile";
import Footer from "../../components/Footer";

const UploadPage = () => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between">
      {/* navbar (links to Overview and Upload pages) */}
      <Navbar />
      {/* upload page content (file upload and validation with steps) */}
      <div className="w-full">
        <h1 className="text-5xl font-bold text-gray-700 text-center mb-5">
          Upload Your Tracking Data
        </h1>
        <UploadFile />
      </div>
      {/* footer (link to GitHub project) */}
      <Footer />
    </div>
  );
};

export default UploadPage;
