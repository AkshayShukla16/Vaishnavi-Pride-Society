import React, { useState } from 'react';
import { AmenityBooking, AmenityType, UserRole, Flat, AdminUser } from '../types/society';
import { getLocalISOString } from '../utils/dateFormatter';
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  Dumbbell, 
  Sparkles, 
  Users, 
  Crown,
  Lock,
  Phone,
  User,
  Home,
  Info,
  ShieldAlert,
  Search,
  ChevronRight
} from 'lucide-react';

interface AmenityBookingProps {
  bookings: AmenityBooking[];
  onAddBooking: (booking: Omit<AmenityBooking, 'id' | 'insertedAt' | 'hasCompleted' | 'status'>) => void;
  onCancelBooking: (bookingId: string, reason?: string) => void;
  currentFlat: Flat;
  currentRole: UserRole;
  currentAdmin: AdminUser | null;
}

const AMENITIES_LIST: AmenityType[] = [
  'Club House',
  'Gym',
  'Rooftop Open Space',
  'Meeting point Space',
  'All Space',
];

const AMENITY_ICONS: Record<AmenityType, React.ElementType> = {
  'Club House': Building2,
  'Gym': Dumbbell,
  'Rooftop Open Space': Sparkles,
  'Meeting point Space': Users,
  'All Space': Crown,
};

const AMENITY_DESCRIPTIONS: Record<AmenityType, string> = {
  'Club House': 'Air-conditioned luxury community hall for banquets, birthday parties & large social events.',
  'Gym': 'State-of-the-art fitness center equipped with cardio, free weights & strength training gear.',
  'Rooftop Open Space': 'Open-air terrace lounge with panoramic views for evening gatherings & private parties.',
  'Meeting point Space': 'Quiet executive conference lounge designed for official society meetings & workshops.',
  'All Space': 'Grand All-Inclusive Package: Exclusive access to all 4 society venues simultaneously.',
};

const AMENITY_BADGE_COLORS: Record<AmenityType, { bg: string; text: string; border: string }> = {
  'Club House': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  'Gym': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Rooftop Open Space': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Meeting point Space': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'All Space': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
};

export const AmenityBookingComponent: React.FC<AmenityBookingProps> = ({
  bookings,
  onAddBooking,
  onCancelBooking,
  currentFlat,
  currentRole,
  currentAdmin,
}) => {
  const isAdminOrSuperAdmin = currentRole === 'Management' || currentAdmin !== null;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isFrozenFacility, setIsFrozenFacility] = useState(false);
  const [facilityType, setFacilityType] = useState<AmenityType>('Club House');
  const [flatNumber, setFlatNumber] = useState('');
  const [personName, setPersonName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bookingDate, setBookingDate] = useState(getLocalISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [purpose, setPurpose] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Toast Alert State for UI Popup
  const [toastAlert, setToastAlert] = useState<{ title: string; message: string; type: 'success' | 'danger' } | null>(null);

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<AmenityBooking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Helper to check if a booking has expired / completed
  const isBookingCompleted = (b: AmenityBooking): boolean => {
    if (b.hasCompleted === 'Yes') return true;
    try {
      const now = new Date();
      const [h, m] = b.endTime.split(':').map(Number);
      const endDateTime = new Date(b.bookingDate);
      endDateTime.setHours(h || 0, m || 0, 0, 0);
      return now.getTime() > endDateTime.getTime();
    } catch {
      return false;
    }
  };

  // Helper to check if cancelled booking is older than 24 hours
  const isCancelledExpired24h = (b: AmenityBooking): boolean => {
    if (b.status !== 'Cancelled' || !b.cancelledAt) return false;
    try {
      const cancelledTime = new Date(b.cancelledAt).getTime();
      const nowTime = new Date().getTime();
      return (nowTime - cancelledTime) > (24 * 60 * 60 * 1000);
    } catch {
      return false;
    }
  };

  // Filter visible bookings for UI (hide completed and cancelled > 24h)
  const visibleBookings = bookings.filter(b => {
    if (isBookingCompleted(b)) return false;
    if (b.status === 'Cancelled' && isCancelledExpired24h(b)) return false;
    return true;
  });

  // Open booking modal without template freeze
  const handleOpenGeneralModal = () => {
    setIsFrozenFacility(false);
    setFacilityType('Club House');
    setFlatNumber('');
    setPersonName('');
    setMobileNumber('');
    setBookingDate(getLocalISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('14:00');
    setPurpose('');
    setValidationError(null);
    setShowModal(true);
  };

  // Open booking modal with frozen facility template
  const handleOpenTemplateModal = (amenity: AmenityType) => {
    setIsFrozenFacility(true);
    setFacilityType(amenity);
    setFlatNumber('');
    setPersonName('');
    setMobileNumber('');
    setBookingDate(getLocalISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('14:00');
    setPurpose('');
    setValidationError(null);
    setShowModal(true);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleaned);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Mandatory Field Validations
    if (!flatNumber.trim()) {
      setValidationError('⚠️ Flat Number is mandatory.');
      return;
    }
    if (!personName.trim()) {
      setValidationError('⚠️ Person Name is mandatory.');
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      setValidationError('⚠️ Mobile Number must be exactly 10 numeric digits.');
      return;
    }

    // Future Date & Time Validation
    const now = new Date();
    const todayStr = getLocalISOString().split('T')[0];
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (bookingDate < todayStr) {
      setValidationError('⚠️ Invalid Booking Date! Backdated slot selection is strictly prohibited. Please choose a future date & time!');
      return;
    }

    if (bookingDate === todayStr && startTime <= currentHHMM) {
      setValidationError(`⚠️ Invalid Booking Time! The start time (${startTime}) has already passed today (${currentHHMM}). Please choose a future time slot!`);
      return;
    }

    if (startTime >= endTime) {
      setValidationError('⚠️ End Time must be strictly after Start Time.');
      return;
    }

    // Duplicate Time Slot Conflict Check
    const conflict = bookings.find(b => {
      if (b.status === 'Cancelled') return false;
      if (isBookingCompleted(b)) return false;
      if (b.bookingDate !== bookingDate) return false;

      const currentType = b.facilityType || b.amenityName;

      // Overlap check if facilities match or if either is 'All Space'
      const isFacilityConflict = 
        currentType === facilityType || 
        facilityType === 'All Space' || 
        currentType === 'All Space';

      if (!isFacilityConflict) return false;

      // Time overlap condition: (newStart < existingEnd) && (newEnd > existingStart)
      return (startTime < b.endTime) && (endTime > b.startTime);
    });

    if (conflict) {
      const conflictType = conflict.facilityType || conflict.amenityName;
      setValidationError(`⚠️ Slot Overlap Conflict! "${conflictType}" is already booked on ${bookingDate} (${conflict.startTime} - ${conflict.endTime}) by Flat #${conflict.flatNumber} (${conflict.personName}). Duplicate slot cannot be reserved.`);
      return;
    }

    // Submit Booking
    onAddBooking({
      flatId: currentFlat.id,
      flatNumber: flatNumber.trim(),
      personName: personName.trim(),
      mobileNumber: mobileNumber.trim(),
      facilityType,
      amenityName: facilityType,
      bookingDate,
      startTime,
      endTime,
      purpose: purpose.trim() || 'General Gathering',
    });

    // Show UI Notification Toast Banner for 7 seconds
    setToastAlert({
      title: `🎉 Amenity Reserved: ${facilityType}`,
      message: `Booked by ${personName.trim()} (Flat #${flatNumber.trim()}) for ${bookingDate} (${startTime} - ${endTime}). Broadcast sent via OneSignal!`,
      type: 'success',
    });

    setTimeout(() => {
      setToastAlert(null);
    }, 7000);

    setShowModal(false);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalBooking) return;
    onCancelBooking(cancelModalBooking.id, cancellationReason.trim() || 'Cancelled by Management');
    
    // Show UI Notification Toast Banner for Cancellation
    setToastAlert({
      title: `❌ Booking Cancelled: ${cancelModalBooking.facilityType}`,
      message: `Reservation for Flat #${cancelModalBooking.flatNumber} on ${cancelModalBooking.bookingDate} has been cancelled. Visible for 24h on schedule.`,
      type: 'danger',
    });

    setTimeout(() => {
      setToastAlert(null);
    }, 7000);

    setCancelModalBooking(null);
    setCancellationReason('');
  };

  return (
    <div className="space-y-6 relative">
      {/* Real-Time Floating UI Toast Alert Notification (Displays for 7 seconds) */}
      {toastAlert && (
        <div className={`fixed top-16 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-md w-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-md text-white flex items-start gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toastAlert.type === 'danger'
            ? 'bg-rose-950/95 border-rose-500/60 shadow-rose-500/20'
            : 'bg-slate-900/95 border-sky-500/60 shadow-sky-500/20'
        }`}>
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            toastAlert.type === 'danger'
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
          }`}>
            <Sparkles className="w-5 h-5 animate-pulse shrink-0" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className={`font-bold text-xs sm:text-sm truncate ${toastAlert.type === 'danger' ? 'text-rose-300' : 'text-sky-300'}`}>
                {toastAlert.title}
              </h4>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 animate-pulse ${
                toastAlert.type === 'danger'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              }`}>
                Live Alert
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed break-words">{toastAlert.message}</p>
          </div>

          <button 
            onClick={() => setToastAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 glass-panel relative overflow-hidden transition-all duration-300 hover:border-sky-500/30">
        <div className="flex items-start sm:items-center gap-3 z-10">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/10 shrink-0">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex flex-wrap items-center gap-2">
              Amenity Booking & Reservation Engine
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                Real-Time Overlap Check
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a facility template below or click <strong className="text-sky-300">Book Amenity Slot</strong> to reserve any amenity with live push notification broadcasts.
            </p>
          </div>
        </div>

        {currentRole !== 'Auditor' && (
          <button
            onClick={handleOpenGeneralModal}
            className="z-10 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transform hover:-translate-y-0.5 transition-all duration-200 shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Book Amenity Slot
          </button>
        )}
      </div>

      {/* 5 Card Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {AMENITIES_LIST.map((amenity) => {
          const Icon = AMENITY_ICONS[amenity];
          const badgeStyle = AMENITY_BADGE_COLORS[amenity];

          // Count active upcoming bookings for this amenity
          const activeBookings = visibleBookings.filter(b => {
            const currentType = b.facilityType || b.amenityName;
            return (currentType === amenity || currentType === 'All Space') && b.status === 'Confirmed';
          });

          return (
            <div 
              key={amenity}
              className="glass-panel p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`p-2.5 rounded-xl border shrink-0 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 shrink-0" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-800 shrink-0">
                    {activeBookings.length} Active
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm mt-3 group-hover:text-sky-300 transition-colors">{amenity}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-3">
                  {AMENITY_DESCRIPTIONS[amenity]}
                </p>

                {/* Show details inside Card for active bookings */}
                {activeBookings.length > 0 && (
                  <div className="mt-3 p-2 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1 text-[10px] overflow-hidden">
                    <span className="font-bold text-sky-400 block text-[9px] uppercase tracking-wider">Next Reservation:</span>
                    <div className="text-slate-300 truncate">
                      👤 <strong className="text-white">{activeBookings[0].personName}</strong> (Flat #{activeBookings[0].flatNumber})
                    </div>
                    <div className="text-slate-400 truncate">
                      📞 {activeBookings[0].mobileNumber}
                    </div>
                    <div className="text-sky-300 font-semibold truncate">
                      📅 {activeBookings[0].bookingDate} ({activeBookings[0].startTime}-{activeBookings[0].endTime})
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleOpenTemplateModal(amenity)}
                className="w-full py-2 bg-slate-900 hover:bg-sky-600 text-sky-300 hover:text-white border border-slate-800 hover:border-sky-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md group-hover:shadow-sky-600/20 shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Reserve Slot
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmed & Active Schedule List */}
      <div className="glass-panel p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400 shrink-0" />
            Confirmed Society Amenity Schedule
          </h3>
          <span className="text-xs text-slate-400">
            Showing active bookings & recently cancelled slots (visible for 24h)
          </span>
        </div>

        {visibleBookings.length === 0 ? (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-slate-600 animate-bounce shrink-0" />
            <p className="text-xs">No active amenity bookings right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {visibleBookings.map((booking) => {
              const currentType = booking.facilityType || booking.amenityName || 'Club House';
              const Icon = AMENITY_ICONS[currentType] || Calendar;
              const badgeStyle = AMENITY_BADGE_COLORS[currentType] || AMENITY_BADGE_COLORS['Club House'];
              const isCancelled = booking.status === 'Cancelled';

              return (
                <div 
                  key={booking.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all duration-300 ${
                    isCancelled 
                      ? 'bg-rose-950/20 border-rose-500/30' 
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-sky-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border truncate ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{currentType}</span>
                      </span>

                      {isCancelled ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 animate-pulse">
                          CANCELLED (24h)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                          CONFIRMED
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 gap-2">
                        <span className="text-slate-400 flex items-center gap-1 shrink-0">
                          <Home className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Flat Number:
                        </span>
                        <strong className="text-white text-sm truncate">#{booking.flatNumber}</strong>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 gap-2">
                        <span className="text-slate-400 flex items-center gap-1 shrink-0">
                          <User className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Booked By:
                        </span>
                        <strong className="text-slate-200 truncate">{booking.personName}</strong>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 gap-2">
                        <span className="text-slate-400 flex items-center gap-1 shrink-0">
                          <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Mobile Number:
                        </span>
                        <strong className="text-sky-300 truncate">{booking.mobileNumber}</strong>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-1">
                        <span className="text-slate-400 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Date & Time:
                        </span>
                        <strong className="text-sky-400 font-semibold text-right truncate">
                          {booking.bookingDate} ({booking.startTime} - {booking.endTime})
                        </strong>
                      </div>

                      {booking.purpose && (
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/40 break-words">
                          Purpose: "{booking.purpose}"
                        </p>
                      )}

                      {isCancelled && booking.cancellationReason && (
                        <div className="p-2 bg-rose-950/60 rounded-lg border border-rose-500/30 text-[11px] text-rose-300 break-words">
                          ❌ Reason: {booking.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Only Admin / Super Admin has authority to cancel */}
                  {isAdminOrSuperAdmin && !isCancelled && (
                    <button
                      onClick={() => setCancelModalBooking(booking)}
                      className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      Cancel Booking (Admin Authority)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl border-sky-500/30 shadow-2xl shadow-sky-500/10">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 pr-2">
                <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
                <span className="truncate">{isFrozenFacility ? `Reserve Slot: ${facilityType}` : 'Book Society Amenity Slot'}</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 flex items-start gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="break-words">{validationError}</div>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Facility Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Select Facility</span>
                  {isFrozenFacility && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" /> Locked to template
                    </span>
                  )}
                </label>

                {isFrozenFacility ? (
                  <div className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold flex items-center justify-between">
                    <span>{facilityType}</span>
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  </div>
                ) : (
                  <select
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value as AmenityType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                  >
                    {AMENITIES_LIST.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Flat Number & Person Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Flat Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1402"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Person Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arsh Shukla"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Mobile Number & Booking Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (10 Digits) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Booking Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={getLocalISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Event Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event / Booking Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday Celebration / Family Get-Together"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-sky-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Society Reservation Engine Rules:
                </p>
                <p>• Duplicate time slot overlap on the same date is strictly blocked.</p>
                <p>• Selecting "All Space" reserves all society venues simultaneously.</p>
                <p>• Instant push notifications broadcast to all residents upon confirmation.</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
                >
                  Confirm & Broadcast Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal for Admin / SuperAdmin */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="glass-panel w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl border-rose-500/40">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Cancel Amenity Booking (Admin Action)</span>
              </h3>
              <button onClick={() => setCancelModalBooking(null)} className="text-slate-400 hover:text-white p-1 shrink-0">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel the booking for <strong className="text-white">{cancelModalBooking.facilityType}</strong> (Flat #{cancelModalBooking.flatNumber}) on {cancelModalBooking.bookingDate}?
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Cancellation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maintenance emergency / Overlapping event"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-2.5 bg-rose-950/40 rounded-xl border border-rose-500/30 text-[11px] text-rose-300">
                Notice: Cancelled booking will remain visible on UI with "CANCELLED" badge for 24 hours, then automatically disappear.
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
