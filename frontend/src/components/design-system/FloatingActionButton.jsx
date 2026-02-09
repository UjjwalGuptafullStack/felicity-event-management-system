import { motion } from "motion/react";

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "accent",
  position = "bottom-right",
}) {
  const variantClasses = {
    primary: "bg-primary hover:bg-primary-dark text-primary-foreground shadow-primary/30",
    secondary: "bg-secondary hover:bg-secondary-dark text-secondary-foreground shadow-secondary/30",
    accent: "bg-accent hover:bg-accent-dark text-accent-foreground shadow-accent/30",
  };

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)" }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed ${positionClasses[position]} ${variantClasses[variant]} px-6 py-4 rounded-full shadow-lg flex items-center gap-3 z-50 transition-colors`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}
