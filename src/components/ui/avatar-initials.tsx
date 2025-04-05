
import { cn } from "@/lib/utils";

interface AvatarInitialsProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarInitials({ name, size = 'md', className }: AvatarInitialsProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  return (
    <div
      className={cn(
        "avatar-circle",
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
