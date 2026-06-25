import React from "react";

const Footer = () => {
  return (
    <footer className="bg-green-500 text-white py-4 h-24 flex flex-col items-center justify-center text-center mt-auto">
      <p className="text-md">
        Developed by <span className="font-bold">Murajsam</span>
      </p>
      <a
        href="https://github.com/murajsam/Tracking-Monitoring-App"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-slate-600 text-md"
      >
        GitHub Project
      </a>
    </footer>
  );
};

export default Footer;
