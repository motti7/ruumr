import React from "react";

const colorMap = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", icon: "text-blue-400" },
  green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", icon: "text-green-400" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-400", icon: "text-pink-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", icon: "text-orange-400" },
};

export default function KpiCard({ label, value, icon: Icon, color = "blue", trend }) {
  const c = colorMap[color];
  return (
    <div className={`bg-gray-900 border ${c.border} rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-white tabular-nums">
          {value.toLocaleString()}
        </p>
        {trend && (
          <p className="text-xs text-gray-600 mt-1">{trend}</p>
        )}
      </div>
    </div>
  );
}