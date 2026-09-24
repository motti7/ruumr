import React from "react";
import Reveal from "./Reveal";

export default function SectionHeader({ title, subtitle }) {
  return (
    <Reveal>
      <div className="mb-4">
        <div className="w-8 h-1.5 rounded-full bg-[--theme-orange] mb-2" />
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </Reveal>
  );
}