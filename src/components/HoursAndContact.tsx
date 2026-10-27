import React, { useState } from 'react';
import { Clock, MapPin, Phone, Mail, CheckCircle2, Send, Calendar } from 'lucide-react';

export const HoursAndContact: React.FC = () => {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formGuests, setFormGuests] = useState('2');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormDate('');
    }, 4500);
  };

  return (
    <section id="contact-section" className="py-20 sm:py-28 bg-stone-100/60 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Hours & Contact Information */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                Visit & Dine With Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-900 mt-2">
                Hours & Restaurant Location
              </h2>
              <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
                We welcome walk-ins and reservations alike. Join us in our warm, candlelit dining room or savor our creations at home via fast delivery.
              </p>
            </div>

            {/* Operating Hours Table */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Weekly Dining Hours</span>
              </h3>

              <div className="divide-y divide-stone-150 text-xs sm:text-sm">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Monday – Thursday</span>
                  <span className="text-stone-600 font-mono">11:00 AM – 10:00 PM</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Friday – Saturday</span>
                  <span className="text-amber-800 font-semibold font-mono">11:00 AM – 11:30 PM (Late Night Bar)</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Sunday Brunch & Dinner</span>
                  <span className="text-stone-600 font-mono">10:30 AM – 9:30 PM</span>
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-stone-900">Address</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  482 Columbus Avenue, Little Italy,<br />San Francisco, CA 94133
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
                  <Phone className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-stone-900">Reservations & Desk</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Phone: (415) 890-4820<br />
                  Email: reservations@savoria-bistro.com
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Table Reservation Request Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                In-House Dining
              </span>
              <h3 className="font-display font-bold text-2xl text-stone-900 mt-2">
                Reserve an Intimate Table
              </h3>
              <p className="text-stone-500 text-xs sm:text-sm mt-1">
                Booking for a celebratory evening or business lunch? Send your table request below.
              </p>
            </div>

            {formSubmitted ? (
              <div className="py-12 text-center space-y-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-display font-bold text-lg text-emerald-950">
                  Reservation Request Received
                </h4>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  Thank you, {formName}! Our maître d' will confirm your reservation table via SMS / Email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReservation} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Julian Hayes"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-stone-700 block mb-1">Preferred Date & Time</label>
                    <input
                      type="text"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      placeholder="e.g. Tomorrow at 7:30 PM"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Party Size</label>
                    <select
                      value={formGuests}
                      onChange={(e) => setFormGuests(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="6">6 Guests</option>
                      <option value="8+">8+ Large Party</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="julian@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Request Table Reservation</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
