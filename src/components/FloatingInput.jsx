import React from "react";

const FloatingInput = ({
  label,
  type = "text",
  value,
  onChange,
  id,
  disabled,
  ...props
}) => {
  return (
    <div className="relative w-full">
      <input
        type={type}
        id={id}
        placeholder=" "
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="peer block px-3 py-4 w-full text-lg bg-transparent rounded-xl border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-[#2D5B60]"
        {...props}
      />

      <label
        htmlFor={id}
        className="absolute text-lg text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2
        peer-focus:px-2
        peer-focus:text-[#2D5B60]
        peer-placeholder-shown:scale-100
        peer-placeholder-shown:-translate-y-1/2
        peer-placeholder-shown:top-1/2
        peer-focus:top-2
        peer-focus:scale-75
        peer-focus:-translate-y-4
        left-2"
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingInput;