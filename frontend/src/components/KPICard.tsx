import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

export default function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600"
}: KPICardProps) {
  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-semibold text-slate-900">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
