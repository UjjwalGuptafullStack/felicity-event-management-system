import { motion } from "motion/react";

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = "neutral",
  gradient = "primary",
}) {
  const gradientClasses = {
    primary: "from-primary/10 to-primary-light/5",
    secondary: "from-secondary/10 to-secondary-light/5",
    accent: "from-accent/10 to-accent-light/5",
  };

  const iconBgClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(27, 127, 95, 0.15)" }}
      className={`bg-gradient-to-br ${gradientClasses[gradient]} rounded-xl p-6 border border-border min-h-[120px]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <div className="text-3xl font-bold text-foreground mb-2 leading-tight">{value}</div>
          {change && (
            <p
              className={`text-xs ${
                changeType === "positive"
                  ? "text-success"
                  : changeType === "negative"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBgClasses[gradient]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
