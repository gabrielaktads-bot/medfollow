import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard = ({ title, value, icon: Icon, description, trend, trendUp }: StatsCardProps) => {
  return (
    <div className="bg-card rounded-lg border p-5 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-accent p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="mt-2">
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend && (
          <p className={`text-xs mt-1 ${trendUp ? "text-medical-success" : "text-medical-danger"}`}>
            {trend}
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
