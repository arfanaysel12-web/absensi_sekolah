import type { AttendanceStatus } from "@/lib/students";

interface StudentRowProps {
  id: string;
  name: string;
  status: AttendanceStatus;
  onChange: (id: string, status: Exclude<AttendanceStatus, null>) => void;
  showFullOptions?: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const STATUS_CONFIG = {
  hadir: { label: "Hadir", bg: "bg-emerald-100", text: "text-emerald-700", activeBg: "bg-emerald-600", hover: "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" },
  tidak_hadir: { label: "Tidak", bg: "bg-rose-100", text: "text-rose-700", activeBg: "bg-rose-600", hover: "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700" },
  terlambat: { label: "Terlambat", bg: "bg-amber-100", text: "text-amber-700", activeBg: "bg-amber-600", hover: "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700" },
  izin: { label: "Izin", bg: "bg-blue-100", text: "text-blue-700", activeBg: "bg-blue-600", hover: "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" },
  sakit: { label: "Sakit", bg: "bg-purple-100", text: "text-purple-700", activeBg: "bg-purple-600", hover: "hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700" },
  alpha: { label: "Alpha", bg: "bg-red-100", text: "text-red-700", activeBg: "bg-red-600", hover: "hover:border-red-300 hover:bg-red-50 hover:text-red-700" },
} as const;

export default function StudentRow({ id, name, status, onChange, showFullOptions = false }: StudentRowProps) {
  const getStatusClass = (statusType: AttendanceStatus) => {
    if (!statusType) return "bg-indigo-100 text-indigo-700";
    const config = STATUS_CONFIG[statusType as keyof typeof STATUS_CONFIG];
    return config ? `${config.bg} ${config.text}` : "bg-indigo-100 text-indigo-700";
  };

  const currentStatusClass = getStatusClass(status);

  const statusOptions = showFullOptions 
    ? (["hadir", "tidak_hadir", "terlambat", "izin", "sakit", "alpha"] as const)
    : (["hadir", "tidak_hadir"] as const);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${currentStatusClass}`}
        >
          {initials(name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-800">{name}</p>
          <p className="text-xs text-zinc-400">No. {id}</p>
        </div>
      </div>

      <div className={`flex gap-2 ${showFullOptions ? "flex-wrap" : ""}`}>
        {statusOptions.map((statusType) => {
          const config = STATUS_CONFIG[statusType];
          const isActive = status === statusType;
          
          return (
            <button
              key={statusType}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(id, statusType)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors sm:flex-none ${
                isActive
                  ? `${config.activeBg} text-white shadow-sm`
                  : `border border-zinc-200 bg-zinc-50 text-zinc-600 ${config.hover}`
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}
