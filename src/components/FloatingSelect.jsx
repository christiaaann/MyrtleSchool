import React from "react";


const FloatingSelect = ({
  label,
  value,
  onChange,
  id,
  options = [],
  disabled,
}) => {
  return (
    <div className="relative w-full">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="peer block dark:text-neutral-400 px-3 py-3 w-full text-lg bg-transparent rounded-xl border dark:border-neutral-800 border-gray-300 focus:outline-none focus:border-[#2D5B60]"
      >
        <option value="" disabled hidden></option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <label
        htmlFor={id}
        className={`absolute left-2 px-2 dark:text-neutral-400 bg-white dark:bg-black text-gray-500 text-lg duration-300
        ${
          value
            ? "top-2 scale-75 -translate-y-4 text-[#2D5B60]"
            : "top-1/2 -translate-y-1/2 scale-100"
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingSelect;