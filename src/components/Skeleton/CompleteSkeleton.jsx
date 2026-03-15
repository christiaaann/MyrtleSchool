import React from 'react';

const CompleteSkeleton = () => {
  return (
    <div className="min-h-screen p-4 animate-pulse">
      <div className="max-w-6xl flex mx-auto gap-8">
        {/* Left column */}
        <div className="w-full space-y-6">
          {/* Title */}
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>

          {/* Profile Picture + Progress */}
          <div className="flex gap-5 items-center">
            <div className="w-24 h-24 rounded-full bg-gray-300"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>

          {/* Form Sections */}
          <div className="space-y-4">
            {/* Personal Info */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Contact & Occupation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>

            {/* Spouse Info */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>

            {/* Save Button */}
            <div className="h-12 bg-gray-300 rounded-full w-full mt-4"></div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[20rem] hidden tablet:block">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteSkeleton;