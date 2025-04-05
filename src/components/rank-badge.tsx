
import React from 'react';
import { cn } from '@/lib/utils';
import { getRankInfo, getRankIcon } from '@/lib/ranks';

interface RankBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
  className?: string;
}

export function RankBadge({ points, size = 'md', showPoints = false, className }: RankBadgeProps) {
  const rank = getRankInfo(points);
  
  const sizeClasses = {
    sm: 'text-xs py-1 px-2 gap-1',
    md: 'text-sm py-1.5 px-3 gap-1.5',
    lg: 'text-base py-2 px-4 gap-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn(
      'flex items-center rounded-full font-medium animate-pulse-badge',
      sizeClasses[size],
      rank.color,
      'bg-opacity-10 border border-current',
      className
    )}>
      <span className={cn('animate-float', iconSizes[size])}>
        {getRankIcon(rank.icon, cn(iconSizes[size]))}
      </span>
      <span>{rank.title}</span>
      {showPoints && <span className="ml-1">({points}pts)</span>}
    </div>
  );
}
