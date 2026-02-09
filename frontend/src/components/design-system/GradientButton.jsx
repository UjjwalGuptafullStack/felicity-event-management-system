import { motion } from "motion/react";

export function GradientButton({
  children,
  icon: Icon,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  type = "button",
}) {
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/30",
    secondary:
      "bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-dark hover:to-secondary shadow-lg shadow-secondary/30",
    accent:
      "bg-gradient-to-r from-accent to-accent-light hover:from-accent-dark hover:to-accent shadow-lg shadow-accent/30",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        text-white rounded-xl font-medium transition-all duration-200
        flex items-center justify-center gap-2
      `}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </motion.button>
  );
}
