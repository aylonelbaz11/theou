"use client";

type Status = "normal" | "defective" | "treated";

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { label: string; className: string }> = {
  normal: {
    label: "Normal",
    className: "bg-green-100 text-green-700",
  },
  defective: {
    label: "Defective",
    className: "bg-red-100 text-red-700",
  },
  treated: {
    label: "Treated",
    className: "bg-blue-100 text-blue-700",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = config[status] ?? config.normal;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
