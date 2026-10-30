import React from 'react';
import { Sparkles, Check, Zap, Car, MapPin, ArrowRight } from 'lucide-react';

export const RecommendationCard = ({
  recommendation,
  onSelectSlot
}) => {
  if (!recommendation || !recommendation.slot) return null;
  const { slot, score, recommendationReasons } = recommendation;

  return (
    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white rounded-2xl border-2 border-secondary/40 p-5 shadow-card hover:shadow-elevated transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 bg-secondary text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm tracking-wide">
              <Sparkles className="w-3 h-3" /> BEST MATCH ({score}% SCORE)
            </span>
            <span className="text-xs font-semibold text-primary">
              Recommended Bay: <b className="text-secondary text-sm">{slot.slotId}</b> ({slot.floorName})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-secondary" /> {slot.landmark}
            </span>
            <span className="font-semibold text-primary">
              ₹{slot.pricePerHour}/hr
            </span>
            {slot.hasEVCharging && (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> {slot.chargingPower || 'EV Fast Charger'}
              </span>
            )}
          </div>

          <div className="space-y-1 pt-1">
            {recommendationReasons?.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-surface-muted">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSelectSlot(slot)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all flex-shrink-0"
        >
          <span>Choose Recommended Bay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
