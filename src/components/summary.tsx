import { CheckCircle2, XCircle, Clock, Users, AlertTriangle, FileText, Heart } from "lucide-react";

interface SummaryProps {
  hadir: number;
  tidakHadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpha: number;
  belumAbsen: number;
  total: number;
  showFullStats?: boolean;
}

const basicCards = [
  {
    label: "Hadir",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700",
    ring: "ring-emerald-200",
  },
  {
    label: "Tidak Hadir",
    icon: XCircle,
    color: "bg-rose-50 text-rose-700",
    ring: "ring-rose-200",
  },
  {
    label: "Belum Absen",
    icon: Clock,
    color: "bg-zinc-100 text-zinc-700",
    ring: "ring-zinc-200",
  },
  {
    label: "Total Siswa",
    icon: Users,
    color: "bg-indigo-50 text-indigo-700",
    ring: "ring-indigo-200",
  },
] as const;

const fullCards = [
  {
    label: "Hadir",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700",
    ring: "ring-emerald-200",
  },
  {
    label: "Terlambat",
    icon: AlertTriangle,
    color: "bg-amber-50 text-amber-700",
    ring: "ring-amber-200",
  },
  {
    label: "Izin",
    icon: FileText,
    color: "bg-blue-50 text-blue-700",
    ring: "ring-blue-200",
  },
  {
    label: "Sakit",
    icon: Heart,
    color: "bg-purple-50 text-purple-700",
    ring: "ring-purple-200",
  },
  {
    label: "Alpha",
    icon: XCircle,
    color: "bg-red-50 text-red-700",
    ring: "ring-red-200",
  },
  {
    label: "Belum Absen",
    icon: Clock,
    color: "bg-zinc-100 text-zinc-700",
    ring: "ring-zinc-200",
  },
  {
    label: "Total Siswa",
    icon: Users,
    color: "bg-indigo-50 text-indigo-700",
    ring: "ring-indigo-200",
  },
] as const;

export default function Summary({ 
  hadir, 
  tidakHadir, 
  terlambat = 0, 
  izin = 0, 
  sakit = 0, 
  alpha = 0, 
  belumAbsen, 
  total,
  showFullStats = false 
}: SummaryProps) {
  const cards = showFullStats ? fullCards : basicCards;
  const values = showFullStats 
    ? [hadir, terlambat, izin, sakit, alpha, belumAbsen, total]
    : [hadir, tidakHadir, belumAbsen, total];

  return (
    <section
      aria-label="Ringkasan kehadiran"
      className={`grid gap-3 ${showFullStats ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"} sm:gap-4`}
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-2xl p-4 ring-1 ${card.color} ${card.ring}`}
          >
            <Icon className="h-5 w-5 opacity-70" />
            <p className="mt-3 text-3xl font-bold tabular-nums">{values[index]}</p>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
          </div>
        );
      })}
    </section>
  );
}
