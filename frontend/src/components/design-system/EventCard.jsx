import { motion } from "motion/react";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { cn } from "../../utils/cn";

export function EventCard({
  title,
  date,
  time,
  location,
  category,
  attendees,
  image,
  onClick,
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(27, 127, 95, 0.18)" }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-card rounded-xl overflow-hidden cursor-pointer border border-border group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium shadow-lg">
            {category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="mb-3 line-clamp-2">{title}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <span>{location}</span>
          </div>
          {attendees !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>{attendees} registered</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
