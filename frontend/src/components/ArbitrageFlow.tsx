import { ArrowRight, TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";

interface ArbitrageFlowProps {
  buyExchange: string;
  buyPrice?: number;
  sellExchange: string;
  sellPrice?: number;
  profitPercent: number;
  estimatedProfit?: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}

export default function ArbitrageFlow({ 
  buyExchange, 
  buyPrice,
  sellExchange, 
  sellPrice,
  profitPercent, 
  estimatedProfit,
  size = "md",
  showBadge = false
}: ArbitrageFlowProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const profitColor = profitPercent > 5 
    ? "text-emerald-600" 
    : profitPercent > 3 
    ? "text-emerald-500" 
    : "text-emerald-400";

  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]}`}>
      {/* Buy Exchange */}
      <div className="flex flex-col items-end">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-medium">
          {buyExchange}
        </Badge>
        {buyPrice !== undefined && (
          <span className="text-xs text-slate-500 mt-1">${buyPrice.toFixed(2)}</span>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />

      {/* Sell Exchange */}
      <div className="flex flex-col items-start">
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-medium">
          {sellExchange}
        </Badge>
        {sellPrice !== undefined && (
          <span className="text-xs text-slate-500 mt-1">${sellPrice.toFixed(2)}</span>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className={`h-5 w-5 ${profitColor} flex-shrink-0`} />

      {/* Profit */}
      <div className="flex flex-col items-start">
        <div className={`flex items-center gap-1 font-semibold ${profitColor}`}>
          <TrendingUp className="h-4 w-4" />
          <span className="text-lg">{profitPercent.toFixed(2)}%</span>
        </div>
        {estimatedProfit && (
          <span className="text-xs text-slate-500 mt-1">{estimatedProfit}</span>
        )}
      </div>

      {/* Best Opportunity Badge */}
      {showBadge && (
        <Badge className="bg-amber-500 text-white ml-2">
          Best
        </Badge>
      )}
    </div>
  );
}
