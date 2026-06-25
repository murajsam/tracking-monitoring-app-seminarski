import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import TrackingDetails from "./TrackingDetails";
import axios from "axios";
import LoadingSpinner from "../../components/LoadingSpinner";

const DetailPage = () => {
  const { id } = useParams(); // get id of the tracking from URL
  const [tracking, setTracking] = useState(null); // tracking object
  const [isLoading, setIsLoading] = useState(true); // boolean to track if the tracking is loading

  // useEffect to fetch tracking data on page load
  useEffect(() => {
    fetchTracking();
  }, []);

  // method to fetch tracking data from api (id is passed as a parameter)
  const fetchTracking = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/trackings/${id}`
      );
      if (response.status === 200) {
        setTracking(response.data);
      }
    } catch (error) {
      console.error("Error fetching tracking:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between">
      <Navbar />
      <div className="w-full flex flex-col justify-center items-center">
        <h1 className="text-5xl font-bold text-gray-700 text-center mb-5">
          Tracking Details
        </h1>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <TrackingDetails tracking={tracking} />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default DetailPage;
