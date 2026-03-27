import React from "react";
import { Banknote, Trash2, CreditCard } from "lucide-react";
import gcash from "../../assets/gcash.png"
import qrcode from "../../assets/qrcode.png";

const Payment = ({
  fees,
  payments,
  setPayments,
  paymentMethod,
  setPaymentMethod,
  paymentProof,
  setPaymentProof,
  errors
}) => {
  return (
    <section className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className='flex gap-2 items-center mb-4'>
        <div className='w-1.5 h-6 bg-green-950 rounded-full'></div>
        <h3 className='font-bold uppercase tracking-widest text-sm text-neutral-700 dark:text-neutral-400'>
          Payment Details
        </h3>
      </div>

      {/* FEES MANAGEMENT AREA */}
      <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-2xl p-5 border border-gray-200">
        
      {/* select amount */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-sm text-neutral-600 flex items-center gap-2">
          <Banknote size={18} /> Selected Fees
        </h4>
        <select
          className="bg-white border-2 border-green-800 px-3 py-2 rounded-lg text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          onChange={(e) => {
            const key = e.target.value;
            if (key && payments[key] === undefined) {
              // Initialize without default value
              setPayments(prev => ({ ...prev, [key]: 0 }));
            }
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

        {/* Fees List */}
        <div className="space-y-4">
          {Object.entries(fees).map(([key, value]) => {
            if (key !== "registration" && payments[key] === undefined) return null;

            const isReg = key === "registration";
            const paid = isReg ? value : (payments[key] || 0);
            const balance = isReg ? 0 : value - paid;

            // FIXED PAYMENT OPTIONS
            const increments = [100, 200, 300, 400, 500, 1000, 1500, 2000, 3000, 5000];
            const validOptions = increments.filter(opt => opt < value);

            return (
              <div key={key} className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                
                {/* Fee Info */}
                <div className="flex-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${isReg ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isReg ? 'Mandatory' : 'Installment Available'}
                  </span>
                  <p className="font-black capitalize text-lg text-neutral-800 mt-1">{key}</p>
                  <p className="text-xs text-gray-400 font-medium tracking-tight">Total Fee: ₱{value}</p>
                </div>

                {/* Payment Dropdown */}
                <div className="flex flex-col gap-1 w-full md:w-52">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payment Amount</label>
                  {isReg ? (
                    <div className="px-4 py-2 bg-gray-100 border rounded-lg font-black text-gray-600">₱ {value}</div>
                  ) : (
                  <select
                  value={payments[key] || ""}
                  onChange={(e) => setPayments(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-green-700 text-sm font-black focus:ring-0 outline-none cursor-pointer hover:bg-green-50"
                >
                  <option value="" disabled>Select amount</option>
                  {validOptions.map(opt => (
                    <option key={opt} value={opt}>₱ {opt.toLocaleString()}</option>
                  ))}
                  <option value={value}>FULL PAYMENT (₱ {value.toLocaleString()})</option>
                </select>
                  )}
                </div>

                {/* Balance */}
                <div className="text-right border-l pl-4 hidden md:block min-w-[120px]">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Balance</p>
                  <p className={`text-lg font-black ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    ₱{balance.toLocaleString()}
                  </p>
                </div>

                {/* Delete Optional Fee */}
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


  <div className="mt-10">
  {/* Breakdown */}
  {Object.entries(fees).map(([key, value], index) => {
    const paid = key === "registration" ? value : payments[key] || 0; 
    if (paid === 0) return null; 
    return (
      <React.Fragment key={key}>
        <div className="flex justify-between px-4 py-2">
          <p className="text-neutral-500">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
          <p className="text-black font-semibold text-lg">₱ {paid}</p>
        </div>
        {/* Add hr after each item except the last one */}
        {index < Object.entries(fees).length - 1 && <hr className="border-t border-gray-300 mx-4" />}
      </React.Fragment>
    );
  })}

  {/* Total */}
 
  <div className="flex justify-end px-4 pt-2">
    <p className="text-lg font-semibold">
      Total: ₱{Object.entries(fees).reduce((acc, [key, value]) => {
        const paid = key === "registration" ? value : payments[key] || 0;
        return acc + paid;
      }, 0)}
    </p>
  </div>
</div>
      </div>

      {/* PAYMENT METHOD & GCash UPLOAD */}
      <div className='grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-100'>
        
        {/* Payment Method Buttons */}
        <div className='flex flex-col gap-3'>
          <label className='text-sm font-black flex items-center gap-2 text-neutral-700 uppercase tracking-tighter'>
            <CreditCard size={18} className="text-green-800" /> Payment Method <span className='text-red-600'>*</span>
          </label>
          <div className="flex justify-center gap-2">
            {["Cash", "GCash"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-3 px-4 rounded-xl border-2 w-full flex items-center justify-center gap-3 font-bold transition-all duration-200 uppercase tracking-tight text-xs
                  ${paymentMethod === method 
                    ? "border-green-800 bg-green-50 text-green-800 shadow-sm" 
                    : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                  }`}
              >
                {method === "GCash" ? <img src={gcash} alt="GCash" className="h-5 object-contain" /> : <span className="h-5 flex items-center">💵</span>}
                {method !== "GCash" && <span>{method}</span>}
              </button>
            ))}
          </div>
          {errors.paymentMethod && <p className="text-red-600 text-[10px] font-bold uppercase">{errors.paymentMethod}</p>}
        </div>

        {/* Conditional Upload for GCash */}
        <div className="min-h-[100px] col-span-full">
          {paymentMethod === "GCash" && (
            <div className='flex flex-col gap-5 animate-in fade-in slide-in-from-top-4 duration-500 bg-blue-50/50 p-4 rounded-2xl border border-blue-100'>
              
              {/* STEP 1: SCAN QR */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    <label className='text-xs font-black text-neutral-700 uppercase tracking-tighter'>
                      Scan to Pay via GCash
                    </label>
                  </div>
                  <a
                    href={qrcode}
                    download="GCash-QR-Payment.png"
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-white px-2 py-1 rounded-md border border-blue-200 shadow-sm"
                  >
                    SAVE QR
                  </a>
                </div>
                <div className="flex justify-center bg-white p-3 rounded-xl border border-blue-200 w-fit mx-auto shadow-sm">
                  <img src={qrcode} alt="GCash QR Code" className="w-52 object-cover" />
                </div>
                <div className="flex gap-1 justify-center">
                 <p className="text-lg font-semibold">Total to Pay:</p>
                 <p className="text-green-800 font-semibold text-lg"> ₱{Object.entries(fees).reduce((acc, [key, value]) => {
                 const paid = key === "registration" ? value : payments[key] || 0;
                 return acc + paid;
                 }, 0)}</p>
                 </div>
                <p className="text-[10px] text-center text-blue-800 font-medium italic">
                  Tip: Download the QR to your gallery for easier scanning
                </p>
              </div>

              <hr className="border-blue-200" />

              {/* STEP 2: UPLOAD RECEIPT */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                  <label className='text-xs font-black text-neutral-700 uppercase tracking-tighter'>
                    Upload Payment Receipt <span className='text-red-600'>*</span>
                  </label>
                </div>
                <div className="relative border-2 border-dashed border-blue-300 rounded-xl p-6 bg-white hover:bg-blue-50 transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProof(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="text-center pointer-events-none">
                    <div className="mb-2 flex justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-tight">
                      {paymentProof ? paymentProof.name : "Tap to upload your proof of payment"}
                    </p>
                  </div>
                </div>
                {errors.paymentProof && <p className="text-red-600 text-[10px] font-bold uppercase mt-1">{errors.paymentProof}</p>}
              </div>

            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default Payment;