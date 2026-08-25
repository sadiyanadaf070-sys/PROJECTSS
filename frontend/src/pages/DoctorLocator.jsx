import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import { MapPin, Phone, Star, ShieldAlert, Check, Calendar, Activity, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DoctorLocator() {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bengaluru coords
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);

  // Booking states
  const [bookingDoc, setBookingDoc] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // 1. Fetch Geolocation Coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserCoords(coords);
          fetchDoctors(coords.lat, coords.lng);
        },
        (error) => {
          console.warn("Geolocation permission denied. Using fallback coordinates.");
          fetchDoctors(userCoords.lat, userCoords.lng);
        }
      );
    } else {
      fetchDoctors(userCoords.lat, userCoords.lng);
    }
  }, []);

  const fetchDoctors = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await axios.get('/doctors/nearby', { params: { lat, lng } });
      setDoctors(res.data.doctors);
      initializeMap(lat, lng, res.data.doctors);
    } catch (err) {
      console.error("Dermatologists fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (lat, lng, docList) => {
    // Wait for the DOM element to load
    setTimeout(() => {
      const container = document.getElementById('leaflet-map');
      if (!container) return;

      // Clean old instance if exists
      if (mapInstance.current) {
        mapInstance.current.setView([lat, lng], 13);
        // Clear markers
        if (markersGroup.current) {
          markersGroup.current.clearLayers();
        }
      } else {
        mapInstance.current = L.map('leaflet-map', { zoomControl: false }).setView([lat, lng], 13);
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
        
        // Add OpenStreetMap layers
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        markersGroup.current = L.layerGroup().addTo(mapInstance.current);
      }

      // Add user marker
      const userIcon = L.divIcon({
        className: 'user-marker-icon',
        html: `<div class="w-4 h-4 bg-primary-500 border-2 border-white rounded-full ring-4 ring-primary-500/20 animate-ping"></div>`,
        iconSize: [16, 16]
      });
      L.marker([lat, lng], { icon: userIcon }).addTo(markersGroup.current).bindPopup("Your Location").openPopup();

      // Add doctor markers
      docList.forEach((doc) => {
        const docIcon = L.divIcon({
          className: 'doc-marker-icon',
          html: `<div class="w-8 h-8 bg-secondary-500 border-2 border-white rounded-xl shadow-lg flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        L.marker([doc.lat, doc.lng], { icon: docIcon })
          .addTo(markersGroup.current)
          .bindPopup(`<b>${doc.name}</b><br/>${doc.clinic}<br/><a href="tel:${doc.phone}" style="font-size:10px;color:#14B8A6;font-weight:bold;">Call Clinic</a>`);
      });
    }, 100);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      const res = await axios.post('/doctors/book', {
        doctorId: bookingDoc.id,
        doctorName: bookingDoc.name,
        date: bookingDate,
        timeSlot: bookingSlot,
        notes: bookingNotes
      });
      
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingDoc(null);
        setBookingSuccess(false);
        setBookingDate('');
        setBookingSlot('');
        setBookingNotes('');
      }, 3000);

    } catch (err) {
      alert("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <MapPin className="w-8 h-8 text-primary-500" />
          <span>Specialist Locator</span>
        </h2>
        <p className="text-sm text-slate-400 font-semibold mt-1">
          Find certified clinics, check ratings, and schedule clinical consultations surrounding your target region.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Doctors list */}
        <div className="lg:col-span-5 space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Activity className="w-8 h-8 text-secondary-500 animate-spin" />
              <span className="text-xs text-slate-400 font-bold">Scanning surrounding registers...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No medical registers found matching coordinates.
            </div>
          ) : (
            doctors.map((doc) => (
              <div 
                key={doc.id}
                className="glass-panel p-5 border hover:border-secondary-500/50 transition-colors flex flex-col justify-between text-left space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{doc.name}</h4>
                    <div className="flex items-center space-x-1 text-xs text-yellow-500 font-bold">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      <span>{doc.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-secondary-500 font-semibold uppercase mt-0.5">{doc.specialty}</p>
                  <p className="text-xs text-slate-400 mt-2 font-bold">{doc.clinic}</p>
                  <p className="text-xs text-slate-400 leading-normal mt-1">{doc.address}</p>
                </div>

                <div className="flex items-center justify-between border-t pt-3 mt-1.5">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{doc.phone}</span>
                  </div>
                  <button
                    onClick={() => setBookingDoc(doc)}
                    className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-secondary-500/20 transition-all"
                  >
                    Book Consultation
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Map displays */}
        <div className="lg:col-span-7 relative min-h-[400px] rounded-3xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50">
          <div id="leaflet-map" className="absolute inset-0 w-full h-full z-10" />
        </div>

      </div>

      {/* Booking Dialog Modal */}
      {bookingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 border shadow-2xl relative text-left">
            
            {bookingSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-lg">Consultation Confirmed</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Your appointment slot with **{bookingDoc.name}** has been registered successfully. Check email details.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg">Schedule Consultation</h3>
                  <p className="text-xs text-slate-400 mt-1">Book slot at {bookingDoc.clinic}</p>
                </div>

                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold block mb-1">Select Date</label>
                      <input 
                        type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-secondary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Time Slot</label>
                      <select 
                        required value={bookingSlot} onChange={(e) => setBookingSlot(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-secondary-500 transition-colors cursor-pointer"
                      >
                        <option value="">Choose slot</option>
                        <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                        <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                        <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                        <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Symptoms/Notes</label>
                    <textarea 
                      value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Detail skin condition variations or lesion symptoms here..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs h-20 focus:outline-none focus:border-secondary-500 transition-colors"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button" onClick={() => setBookingDoc(null)}
                      className="flex-1 py-3 text-xs font-bold border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit" disabled={bookingLoading}
                      className="flex-1 py-3 text-xs font-bold text-white bg-secondary-500 hover:bg-secondary-600 rounded-xl shadow-lg shadow-secondary-500/25 transition-all flex items-center justify-center space-x-1.5"
                    >
                      {bookingLoading ? 'Registering...' : 'Confirm Consultation'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
