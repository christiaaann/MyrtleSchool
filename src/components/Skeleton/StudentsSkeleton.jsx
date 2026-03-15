import React from 'react'

const StudentsSkeleton = () => {
  return (
    <div className='bg-gray-50 p-6 shadow-sm rounded-lg min-h-screen animate-pulse'>
      
      {/* Header */}
      <div className='flex flex-col md:flex-row justify-between items-center mb-6 gap-4'>
        <div className='h-6 w-52 bg-gray-200 rounded'></div>
        <div className='h-10 w-80 bg-gray-200 rounded'></div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto bg-white rounded-lg shadow'>
        <table className='w-full text-left border-collapse'>
          <thead className='bg-gray-100 text-neutral-600 text-[11px] uppercase font-bold'>
            <tr>
              {["Student Info","Level / Grade","Documents","Payment","Status","Actions"].map((h,i) => (
                <th key={i} className='px-4 py-4 border-b'>
                  <div className='h-4 bg-gray-200 rounded w-20 md:w-full'></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className='border-b'>
                {[...Array(6)].map((_, j) => (
                  <td key={j} className='px-4 py-4'>
                    <div className='h-4 bg-gray-200 rounded w-20 md:w-full'></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Skeleton */}
      <div className='mt-6'>
        <div className='h-64 bg-gray-200 rounded-lg'></div>
      </div>

    </div>
  )
}

export default StudentsSkeleton