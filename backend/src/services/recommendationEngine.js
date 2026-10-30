/**
 * Recommendation Engine for ParkEase Smart Parking
 * Transparent multi-factor scoring algorithm designed to prioritize:
 * 1. Vehicle category compatibility
 * 2. Real-time availability during the requested window
 * 3. Proximity to elevators, pedestrian lobbies & exits
 * 4. EV fast-charging needs for Electric Vehicles
 * 5. Cost-efficiency and user membership perks
 */

const getRecommendedSlots = (availableSlots, preferences = {}) => {
  const {
    vehicleType = 'Car',
    requiresEVCharging = false,
    preferNearElevator = true,
    maxBudget = null
  } = preferences;

  if (!availableSlots || availableSlots.length === 0) {
    return [];
  }

  // Filter out any maintenance or mismatched primary vehicle types
  let candidates = availableSlots.filter(s => {
    if (s.isUnderMaintenance) return false;
    if (vehicleType && s.vehicleType !== vehicleType) return false;
    if (requiresEVCharging && !s.hasEVCharging) return false;
    if (maxBudget && s.pricePerHour > maxBudget) return false;
    return true;
  });

  // If no exact match (e.g. EV needed in non-EV floor), relax EV constraint but keep vehicle type
  if (candidates.length === 0 && requiresEVCharging) {
    candidates = availableSlots.filter(s => !s.isUnderMaintenance && s.vehicleType === vehicleType);
  }

  // Calculate score for each candidate slot (higher score = better recommendation)
  const scoredSlots = candidates.map(slot => {
    let score = 100;
    const reasons = [];

    // Factor 1: Proximity / Distance Score (1 closest, 5 farthest)
    const proximityWeight = 30;
    const proximityScore = (6 - (slot.distanceScore || 3)) * (proximityWeight / 5);
    score += proximityScore;
    if (slot.distanceScore <= 2) {
      reasons.push('Prime spot close to pedestrian elevator & exit lobby');
    }

    // Factor 2: EV charging suitability
    if (slot.hasEVCharging) {
      if (vehicleType === 'EV' || requiresEVCharging) {
        score += 40;
        reasons.push(`Equipped with ${slot.chargingPower || 'Fast EV'} Charging`);
      } else {
        score += 5; // general bonus for green infrastructure
      }
    }

    // Factor 3: Landmark convenience
    if (slot.landmark && slot.landmark.toLowerCase().includes('elevator')) {
      score += 25;
      if (!reasons.some(r => r.includes('elevator'))) {
        reasons.push('Direct elevator access');
      }
    } else if (slot.landmark && slot.landmark.toLowerCase().includes('gate')) {
      score += 15;
      reasons.push('Fast gate ingress / egress lane');
    }

    // Factor 4: Lower slot numbers generally closer to driveway ramp
    if (slot.slotNumber <= 12) {
      score += 10;
      reasons.push('Direct main aisle parking bay');
    }

    return {
      slot,
      score: Math.round(score),
      recommendationReasons: reasons.length > 0 ? reasons : ['Optimal bay for your vehicle profile']
    };
  });

  // Sort descending by score
  scoredSlots.sort((a, b) => b.score - a.score);

  return scoredSlots;
};

module.exports = {
  getRecommendedSlots
};
