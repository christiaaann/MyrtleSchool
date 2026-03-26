import React from 'react'

const PaymentStep = ({
  fees,
  payments,
  setPayments,
  selectedFee,
  setSelectedFee,
  paymentMethod,
  setPaymentMethod,
  paymentProof,
  setPaymentProof,
  errors
}) => {
  return (
    <section className="space-y-6 animate-in fade-in duration-500">
    {step === 3 && (
  <section className="space-y-6 animate-in fade-in duration-500">
    {/* Header */}
    <div className='flex gap-2 items-center mb-4'>
      <div className='w-1.5 h-6 bg-green-950 rounded-full'></div>
      <h3 className='font-bold uppercase tracking-widest text-sm text-neutral-700 dark:text-neutral-400'>
        Payment Details
      </h3>
    </div>

    {/* Summary Cards - Dito agad makikita ang totals */}
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-white border rounded-xl shadow-sm border-l-4 border-l-red-500">
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Remaining Balance</p>
        <p className="text-xl font-black text-neutral-800">
          ₱ {Object.entries(fees).reduce((acc, [key, value]) => acc + (key === "registration" ? 0 : (value - (payments[key] || 0))), 0)}
        </p>
      </div>
      <div className="p-4 bg-green-50 border border-green-100 rounded-xl shadow-sm border-l-4 border-l-green-600">
        <p className="text-[10px] text-green-700 uppercase font-black tracking-wider">Total to Pay Now</p>
        <p className="text-xl font-black text-green-900">
          ₱ {Object.entries(fees).reduce((acc, [key, value]) => acc + (key === "registration" ? value : (payments[key] || 0)), 0)}
        </p>
      </div>
    </div>

    {/* Fees Management Area */}
    <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-2xl p-5 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-sm text-neutral-600 flex items-center gap-2">
          <Banknote size={18} /> Selected Fees
        </h4>
        
        {/* Dropdown para magdagdag ng ibang babayaran */}
        <select 
          className="bg-white border-2 border-green-800 px-3 py-2 rounded-lg text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          onChange={(e) => {
            const key = e.target.value;
            if (key) setPayments(prev => ({ ...prev, [key]: 100 })); // Default initial payment 100
            e.target.value = ""; 
          }}
        >
          <option value="">+ ADD OTHER FEE</option>
          {Object.entries(fees).map(([key, value]) => (
            key !== "registration" && payments[key] === undefined && (
              <option key={key} value={key} className="capitalize">{key}</option>
            )
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {Object.entries(fees).map(([key, value]) => {
          // Ipakita lang ang Registration OR yung mga pinili sa dropdown
          if (key !== "registration" && payments[key] === undefined) return null;

          const isReg = key === "registration";
          const paid = isReg ? value : (payments[key] || 0);
          const balance = isReg ? 0 : value - paid;

          // FIXED AMOUNTS ONLY (100, 200, 500, etc.)
          const increments = [100, 200, 300, 400, 500, 1000, 1500, 2000, 3000, 5000];
          const validOptions = increments.filter(opt => opt < value);

          return (
            <div key={key} className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 shadow-sm relative group">
              <div className="flex-1">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${isReg ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {isReg ? 'Mandatory' : 'Installment Available'}
                </span>
                <p className="font-black capitalize text-lg text-neutral-800 mt-1">{key}</p>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Total Fee: ₱{value}</p>
              </div>

              {/* FIXED SELECT DROPDOWN */}
              <div className="flex flex-col gap-1 w-full md:w-52">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payment Amount</label>
                {isReg ? (
                   <div className="px-4 py-2 bg-gray-100 border rounded-lg font-black text-gray-600">₱ {value}</div>
                ) : (
                  <select
                    value={payments[key]}
                    onChange={(e) => setPayments(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border-2 border-green-700 text-sm font-black focus:ring-0 outline-none cursor-pointer hover:bg-green-50"
                  >
                    {validOptions.map(opt => (
                      <option key={opt} value={opt}>₱ {opt.toLocaleString()}</option>
                    ))}
                    <option value={value}>FULL PAYMENT (₱ {value.toLocaleString()})</option>
                  </select>
                )}
              </div>

              {/* Status/Balance Display */}
              <div className="text-right border-l pl-4 hidden md:block min-w-[120px]">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Balance</p>
                <p className={`text-lg font-black ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  ₱{balance.toLocaleString()}
                </p>
              </div>

              {/* Delete Button for Optional Fees */}
              {!isReg && (
                <button 
                  onClick={() => {
                    const next = { ...payments };
                    delete next[key];
                    setPayments(next);
                  }}
                  className="absolute -top-2 -right-2 bg-red-50 text-red-400 hover:text-red-600 p-1.5 rounded-full border border-red-100 shadow-sm transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Payment Method & GCash Upload */}
    <div className='grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-100'>
      <div className='flex flex-col gap-3'>
        <label className='text-sm font-black flex items-center gap-2 text-neutral-700 uppercase tracking-tighter'>
          <CreditCard size={18} className="text-green-800" /> Payment Method <span className='text-red-600'>*</span>
        </label>
        <FloatingSelect
          label="Select Mode"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={["Cash", "GCash"]}
        />
        {errors.paymentMethod && <p className="text-red-600 text-[10px] font-bold uppercase">{errors.paymentMethod}</p>}
      </div>

 {paymentMethod === "GCash" && (
  <div className='flex flex-col gap-3 animate-in zoom-in-95 duration-300'>
    <label className='text-sm font-black text-neutral-700 uppercase tracking-tighter'>
      Upload Payment Receipt <span className='text-red-600'>*</span>
    </label>

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setPaymentProof(e.target.files[0])}
      className="border border-gray-300 dark:border-neutral-700 rounded-md p-2 cursor-pointer bg-white dark:bg-neutral-900"
    />

    {errors.paymentProof && (
      <p className="text-red-600 text-[10px] font-bold uppercase">
        {errors.paymentProof}
      </p>
    )}
  </div>
)}
    </div>
  </section>
)}
    </section>
  );
};

export default PaymentStep;