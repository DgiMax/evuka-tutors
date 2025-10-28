import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input(props: InputProps) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 text-gray-900 border border-gray-300 focus:border-[#2694C6] focus:ring-0 outline-none"
      style={{
        borderRadius: "2px",
      }}
    />
  );
}