import React from 'react'

const UsersSkeleton = () => (
  <div className="flex h-[90vh] bg-[#F8F9FA] overflow-hidden rounded-2xl shadow-lg border">
    <div className="w-1/3 border-r bg-white flex flex-col">
      <div className="p-5 border-b bg-gray-50/50">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>

    <div className="flex-1 bg-[#F9FBFC] p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  </div>
);

export default UsersSkeleton