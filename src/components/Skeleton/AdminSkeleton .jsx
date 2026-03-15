import React from 'react'

const AdminSkeleton = () => {
  return (
    <div className="flex h-screen p-3 bg-gray-200 animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="w-52 bg-white relative rounded-l-lg flex flex-col p-4 gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-300"></div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
          <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
        </div>
        <div className="flex-1 space-y-2 mt-4">
          <div className="h-4 w-full bg-gray-300 rounded"></div>
          <div className="h-4 w-full bg-gray-300 rounded"></div>
          <div className="h-4 w-full bg-gray-300 rounded"></div>
        </div>
        <div className="h-8 w-full bg-gray-300 rounded mt-auto"></div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="h-14 bg-white rounded shadow"></div>
        <div className="flex-1 bg-white rounded shadow"></div>
      </div>
    </div>
  );
};

export default AdminSkeleton 