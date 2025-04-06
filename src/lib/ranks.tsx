
import { BadgePlus, Trophy, Medal, Star, Award, Crown } from "lucide-react";

// Rank definitions with their thresholds and icons
export const ranks = [
  {
    name: "Novice",
    threshold: 0,
    Icon: BadgePlus
  },
  {
    name: "Bronze Contributor",
    threshold: 50,
    Icon: Medal
  },
  {
    name: "Silver Contributor",
    threshold: 100,
    Icon: Star
  },
  {
    name: "Gold Contributor",
    threshold: 200,
    Icon: Trophy
  },
  {
    name: "Platinum Contributor",
    threshold: 350,
    Icon: Award
  },
  {
    name: "Diamond Contributor",
    threshold: 500,
    Icon: Crown
  }
];

// Function to determine a user's rank based on their points
export const getUserRank = (points: number = 0) => {
  // Find the highest rank the user qualifies for
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (points >= ranks[i].threshold) {
      return ranks[i];
    }
  }
  // Default to the lowest rank if no match
  return ranks[0];
};

// Calculate points needed for the next rank
export const getPointsToNextRank = (points: number = 0) => {
  const currentRank = getUserRank(points);
  const currentRankIndex = ranks.findIndex(rank => rank.name === currentRank.name);
  
  // If user is at the highest rank, return 0
  if (currentRankIndex === ranks.length - 1) {
    return {
      nextRank: null,
      pointsNeeded: 0
    };
  }
  
  const nextRank = ranks[currentRankIndex + 1];
  const pointsNeeded = nextRank.threshold - points;
  
  return {
    nextRank,
    pointsNeeded
  };
};
