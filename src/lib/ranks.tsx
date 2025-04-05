
import React from 'react';
import { RankInfo } from '@/types';
import { Award, Crown, Fire, Shield, Star } from 'lucide-react';

export const RANKS: RankInfo[] = [
  { title: 'Celestial Champion', minPoints: 400, icon: 'Crown', color: 'text-yellow-500' },
  { title: 'Phoenix Prodigy', minPoints: 250, icon: 'Fire', color: 'text-red-500' },
  { title: 'Eternal Guardian', minPoints: 150, icon: 'Shield', color: 'text-blue-500' },
  { title: 'Cosmic Intellect', minPoints: 100, icon: 'Star', color: 'text-purple-500' },
  { title: 'Galactic Sage', minPoints: 75, icon: 'Award', color: 'text-green-500' },
  { title: 'Truth Hunter', minPoints: 50, icon: 'Award', color: 'text-teal-500' },
  { title: 'Wisdom Weaver', minPoints: 30, icon: 'Award', color: 'text-indigo-500' },
  { title: 'Insight Voyager', minPoints: 15, icon: 'Award', color: 'text-pink-500' },
  { title: 'Knowledge Keeper', minPoints: 5, icon: 'Award', color: 'text-orange-500' }
];

export const getRankInfo = (points: number): RankInfo => {
  for (const rank of RANKS) {
    if (points >= rank.minPoints) {
      return rank;
    }
  }
  
  return { title: 'Novice', minPoints: 0, icon: 'Award', color: 'text-gray-500' };
};

export const getRankIcon = (iconName: string, className: string = '') => {
  switch (iconName) {
    case 'Crown':
      return <Crown className={`${className}`} />;
    case 'Fire':
      return <Fire className={`${className}`} />;
    case 'Shield':
      return <Shield className={`${className}`} />;
    case 'Star':
      return <Star className={`${className}`} />;
    default:
      return <Award className={`${className}`} />;
  }
};
