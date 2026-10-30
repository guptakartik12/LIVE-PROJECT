import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ShieldCheck, Zap, Clock, MapPin, Mail, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-slate-300 pt-16 pb-12 border-t border-primary-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white shadow-sm">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Park<span className="text-secondary-light">Ease</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Find, book, and park effortlessly. Real-time slot availability, instant digital QR passes, automated barrier gate simulation, and intelligent indoor navigation.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" /> SSL Protected
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-warning" /> 22 kW EV Fast Bays
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-secondary-light" /> 24/7 Monitored
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/find-parking" className="hover:text-white transition-colors">Find Parking</Link></li>
              <li><Link to="/membership" className="hover:text-white transition-colors">Membership Perks</Link></li>
              <li><Link to="/gate-simulation" className="hover:text-white transition-colors">Gate Barrier Demo</Link></li>
              <li><Link to="/my-bookings" className="hover:text-white transition-colors">My Reservations</Link></li>
            </ul>
          </div>

          {/* Solutions & Facilities */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Garages</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-slate-400">City Center Mall (Basement Car)</li>
              <li className="text-slate-400">Central Metro Concourse (Bike)</li>
              <li className="text-slate-400">Airport Express Hub (Fast EV)</li>
              <li className="text-slate-400">Riverside Corporate Plaza</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary-light" />
                <span>support@parkease.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary-light" />
                <span>+91 11 2345 6789</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-secondary-light mt-0.5" />
                <span>Sector 18, Central City Boulevard</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-light flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} ParkEase Inc. All rights reserved. Transforming urban mobility.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Simulator Status: Connected</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
