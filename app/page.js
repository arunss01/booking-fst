import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Calendar, Clock, MapPin, User, LogOut, PlusCircle, CheckCircle, Search, ArrowRight, AlertCircle, Filter, Lock, Eye, EyeOff, ChevronRight, Hash, Layers } from 'lucide-react';

// --- 1. DATABASE SIMULATION (MOCK DATA) ---

const REGISTERED_USERS = [
  { nim: "12345", password: "123", name: "Aruna (Sains Data)", kelas: "3A", major: "Sains Data" },
  { nim: "67890", password: "123", name: "Budi (Tekn. Pangan)", kelas: "1B", major: "Teknologi Pangan" },
  { nim: "11223", password: "123", name: "Citra (Lingkungan)", kelas: "5A", major: "Ilmu Lingkungan" }
];

const ROOMS_DB = [
  { id: 'A-201', name: 'A-201', floor: 2, capacity: 40, type: 'Classroom' },
  { id: 'A-202', name: 'A-202', floor: 2, capacity: 30, type: 'Classroom' },
  { id: 'A-203', name: 'A-203', floor: 2, capacity: 30, type: 'Classroom' },
  { id: 'A-204', name: 'A-204', floor: 2, capacity: 30, type: 'Classroom' },
  { id: 'A-205', name: 'A-205', floor: 2, capacity: 30, type: 'Classroom' },
  { id: 'A-301', name: 'A-301', floor: 3, capacity: 30, type: 'Classroom' },
  { id: 'A-302', name: 'A-302', floor: 3, capacity: 30, type: 'Classroom' },
  { id: 'A-303', name: 'A-303', floor: 3, capacity: 30, type: 'Classroom' },
  { id: 'Lab-401', name: 'Lab-401 (Sains Data)', floor: 4, capacity: 25, type: 'Laboratorium' },
  { id: 'Lab-402', name: 'Lab-402 (Komputasi)', floor: 4, capacity: 25, type: 'Laboratorium' },
  { id: 'Lab-403', name: 'Lab-403', floor: 4, capacity: 25, type: 'Laboratorium' },
  { id: 'Lab-404', name: 'Lab-404', floor: 4, capacity: 25, type: 'Laboratorium' },
];

const MASTER_SCHEDULE_DB = [
  // --- USER 1: ARUNA (3A - Sains Data) ---
  { id: 101, mataKuliah: "Metode Numerik", kelas: "3A", ruang: "A-202", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Fuad Luky Atmaja, M.Pd.", sks: 3, status: "active" },
  { id: 102, mataKuliah: "Visualisasi Data", kelas: "3A", ruang: "A-202", hari: "SENIN", jamMulai: "09:30", jamSelesai: "12:00", dosen: "Rizky Kusumawardani, M.Si.", sks: 3, status: "active" },
  { id: 103, mataKuliah: "Teori Peluang", kelas: "3A", ruang: "A-204", hari: "SELASA", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Zulfanita Dien R., M.Si.", sks: 3, status: "active" },
  { id: 104, mataKuliah: "Analisis Regresi", kelas: "3A", ruang: "A-204", hari: "SELASA", jamMulai: "09:30", jamSelesai: "12:00", dosen: "Zulfanita Dien R., M.Si.", sks: 3, status: "active" },
  { id: 105, mataKuliah: "Metodologi Studi Islam", kelas: "3A", ruang: "Lab-403", hari: "RABU", jamMulai: "10:20", jamSelesai: "12:00", dosen: "M. Nur Kholis, M.H.I.", sks: 2, status: "active" },
  { id: 106, mataKuliah: "Teknologi BioProses", kelas: "3A", ruang: "Lab-404", hari: "KAMIS", jamMulai: "13:00", jamSelesai: "15:50", dosen: "Sri Utami, M.Si.", sks: 3, status: "active" },
  { id: 107, mataKuliah: "Baku Mutu Lingkungan", kelas: "3A", ruang: "Lab-401", hari: "JUMAT", jamMulai: "16:20", jamSelesai: "18:00", dosen: "Widyanti Y., M.T.", sks: 2, status: "active" },

  // --- USER 2: BUDI (1B - Teknologi Pangan) ---
  { id: 201, mataKuliah: "Fisika Dasar", kelas: "1B", ruang: "A-203", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Yesi Ihdina, M.Farm.", sks: 2, status: "active" },
  { id: 202, mataKuliah: "Matematika", kelas: "1B", ruang: "A-205", hari: "SENIN", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Isnan Nabawi, M.Kom.", sks: 2, status: "active" },
  { id: 203, mataKuliah: "Kimia Dasar", kelas: "1B", ruang: "A-303", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Sri Utami, M.Si.", sks: 2, status: "active" },
  { id: 204, mataKuliah: "Pancasila", kelas: "1B", ruang: "A-304", hari: "SELASA", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Dr. H. Supriyanto", sks: 2, status: "active" },
  { id: 205, mataKuliah: "Islam & Budaya Jawa", kelas: "1B", ruang: "Lab-404", hari: "RABU", jamMulai: "14:40", jamSelesai: "16:20", dosen: "M. Ibnu Nafiudin", sks: 2, status: "active" },
  { id: 206, mataKuliah: "Peng. Ilmu Komputer", kelas: "1B", ruang: "Lab-402", hari: "KAMIS", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Wildan Nadiyal, M.Kom.", sks: 2, status: "active" },
  
  // --- USER 3: CITRA (5A - Ilmu Lingkungan) ---
  { id: 301, mataKuliah: "Konservasi Energi", kelas: "5A", ruang: "Lab-401", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Septin Puji A., Ph.D.", sks: 3, status: "active" },
  { id: 302, mataKuliah: "Pengelolaan SDA", kelas: "5A", ruang: "Lab-401", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Ronnawan J., M.Si.", sks: 2, status: "active" },
  { id: 303, mataKuliah: "Rekayasa Perangkat Lunak", kelas: "5A", ruang: "A-205", hari: "SELASA", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Tigus Juni B., M.Kom.", sks: 2, status: "active" },
  { id: 304, mataKuliah: "Toksikologi Lingkungan", kelas: "5A", ruang: "Lab-403", hari: "RABU", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Purwono, M.Si.", sks: 2, status: "active" },
  { id: 305, mataKuliah: "Literasi Digital", kelas: "5A", ruang: "Lab-402", hari: "JUMAT", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Wildan Nadiyal, M.Kom.", sks: 2, status: "active" }
];

// Helper Functions
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(/[:.]/).map(Number);
  return hours * 60 + minutes;
};

const generateBookingId = () => {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BKG-${date}-${random}`;
};

// --- 2. CONTEXT MANAGEMENT ---
const BookingContext = createContext();

const BookingProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [schedules, setSchedules] = useState(MASTER_SCHEDULE_DB);
  const [myBookings, setMyBookings] = useState([]);
  const [authError, setAuthError] = useState("");

  const login = (nimInput, passwordInput) => {
    const foundUser = REGISTERED_USERS.find(u => u.nim === nimInput && u.password === passwordInput);
    if (foundUser) {
      setUser(foundUser);
      setAuthError("");
      return true;
    } else {
      setAuthError("NIM atau Password salah.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPoints(0);
    setSchedules(MASTER_SCHEDULE_DB); 
    setMyBookings([]);
  };

  const cancelSchedule = (id) => {
    const target = schedules.find(s => s.id === id);
    if (target && target.status === 'active') {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
      setPoints(prev => prev + target.sks);
    }
  };

  const bookRoom = (room, date, startTimeStr, durationHours) => {
    if (points < durationHours) return { success: false, message: "Poin SKS tidak mencukupi." };

    setPoints(prev => prev - durationHours);
    const startMin = timeToMinutes(startTimeStr);
    const endMin = startMin + (durationHours * 60);
    const hours = Math.floor(endMin / 60);
    const minutes = endMin % 60;
    const endTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // NEW: GENERATE FULL BOOKING DETAILS
    const newBooking = {
      bookingId: generateBookingId(),
      roomId: room.id,
      roomName: room.name,
      floor: room.floor,
      date,
      time: `${startTimeStr} - ${endTimeStr}`,
      duration: durationHours,
      timestamp: Date.now(),
      // Info Pemesan
      userName: user.name,
      userMajor: user.major,
      userClass: user.kelas,
      status: "TERKONFIRMASI"
    };

    setMyBookings(prev => [...prev, newBooking]);
    return { success: true, message: "Booking berhasil!", bookingId: newBooking.bookingId };
  };

  const checkAvailability = (selectedDate, startTimeStr, durationHours) => {
    const reqStart = timeToMinutes(startTimeStr);
    const reqEnd = reqStart + (durationHours * 60);
    const dateObj = new Date(selectedDate);
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const dayName = days[dateObj.getDay()];

    return ROOMS_DB.map(room => {
      let isAvailable = true;
      let conflictReason = "";

      // Cek Akademik
      const classConflict = schedules.find(sch => {
        if (sch.status !== 'active') return false; 
        if (sch.ruang !== room.id && sch.ruang !== room.name) return false; 
        if (sch.hari !== dayName) return false; 

        const schStart = timeToMinutes(sch.jamMulai);
        const schEnd = timeToMinutes(sch.jamSelesai);
        return (reqStart < schEnd && reqEnd > schStart);
      });

      if (classConflict) {
        isAvailable = false;
        conflictReason = `Kuliah: ${classConflict.mataKuliah}`;
      }

      // Cek Booking Sendiri
      const myBookingConflict = myBookings.find(b => {
        if (b.roomName !== room.name) return false;
        if (b.date !== selectedDate) return false;
        const [bStartStr, bEndStr] = b.time.split(' - ');
        const bStart = timeToMinutes(bStartStr);
        const bEnd = timeToMinutes(bEndStr);
        return (reqStart < bEnd && reqEnd > bStart);
      });

      if (myBookingConflict) {
        isAvailable = false;
        conflictReason = "Sudah Anda booking";
      }

      return { ...room, isAvailable, conflictReason };
    });
  };

  return (
    <BookingContext.Provider value={{ 
      user, points, schedules, myBookings, authError, 
      login, logout, cancelSchedule, bookRoom, checkAvailability 
    }}>
      {children}
    </BookingContext.Provider>
  );
};

const useBooking = () => useContext(BookingContext);

// --- 3. COMPONENTS ---

// Login Page
const LoginPage = () => {
  const { login, authError } = useBooking();
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nim && password) login(nim, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 font-sans bg-[url('https://images.unsplash.com/photo-1497864149936-d1100c5fcf79?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-emerald-600 animate-fade-in-up">
        
        {/* HEADER DENGAN LOGO BARU */}
        <div className="text-center mb-8">
          <div className="flex justify-center mx-auto mb-6">
            {/* IMAGE DAFACE.PNG */}
            <img 
              src="/image_daface.png" 
              alt="Logo FST" 
              className="w-40 h-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistem Booking FST</h1>
          <p className="text-slate-500 text-sm mt-1">Universitas Islam Negeri Raden Mas Said</p>
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 animate-pulse">
            <AlertCircle size={16} /> {authError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">NIM</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input type="text" value={nim} onChange={(e) => setNim(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Masukkan NIM" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Masukkan Password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-200">Masuk Sistem</button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2 font-semibold">Akun Demo (Password: 123)</p>
          <div className="flex justify-center gap-2 text-xs font-mono text-slate-400">
            <span className="bg-slate-50 px-2 py-1 rounded border">12345 (3A)</span>
            <span className="bg-slate-50 px-2 py-1 rounded border">67890 (1B)</span>
            <span className="bg-slate-50 px-2 py-1 rounded border">11223 (5A)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard (Weekly Table View + Detailed History)
const DashboardPage = ({ onChangePage }) => {
  const { user, points, schedules, cancelSchedule, myBookings } = useBooking();
  const weekDays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const mySchedules = useMemo(() => schedules.filter(s => s.kelas === user.kelas).sort((a, b) => timeToMinutes(a.jamMulai) - timeToMinutes(b.jamMulai)), [schedules, user.kelas]);

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex justify-between items-center">
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-medium mb-1">Saldo Poin Booking</p>
            <div className="text-4xl font-bold tracking-tight">{points} <span className="text-lg font-normal opacity-80">SKS</span></div>
            <p className="text-xs text-emerald-200 mt-2">Batalkan kelas untuk menambah poin.</p>
          </div>
          <button onClick={() => onChangePage('booking')} disabled={points === 0} className={`relative z-10 px-5 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${points > 0 ? 'bg-white text-emerald-800 hover:bg-slate-50 hover:scale-105' : 'bg-black/20 text-emerald-200 cursor-not-allowed'}`}>
            <PlusCircle size={20} /> Booking Ruang
          </button>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col justify-center">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
               <User size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">{user.name}</h3>
               <p className="text-xs text-slate-500">{user.nim}</p>
             </div>
           </div>
           <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-sm">
             <span className="text-slate-500">Jurusan</span>
             <span className="font-semibold text-slate-700">{user.major}</span>
           </div>
           <div className="flex justify-between text-sm mt-1">
             <span className="text-slate-500">Kelas</span>
             <span className="font-semibold text-slate-700">{user.kelas}</span>
           </div>
        </div>
      </div>

      {/* Table Jadwal */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-emerald-600" size={24} /> Jadwal Kuliah Mingguan
          </h3>
          <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">Semester Gasal 2025/2026</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-bold w-24">Hari</th>
                  <th className="p-4 font-bold w-32">Jam</th>
                  <th className="p-4 font-bold">Mata Kuliah</th>
                  <th className="p-4 font-bold w-24">Ruang</th>
                  <th className="p-4 font-bold w-16 text-center">SKS</th>
                  <th className="p-4 font-bold w-32 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {weekDays.map(day => {
                  const daySchedules = mySchedules.filter(s => s.hari === day);
                  if (daySchedules.length === 0) {
                    return (
                      <tr key={day} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-700 bg-slate-50/30 border-r border-slate-100 align-top">{day}</td>
                        <td colSpan="5" className="p-4 text-slate-400 italic text-center bg-slate-50/10">Tidak ada jadwal</td>
                      </tr>
                    );
                  }
                  return daySchedules.map((sch, index) => (
                    <tr key={sch.id} className={`hover:bg-slate-50 transition-colors ${sch.status === 'cancelled' ? 'bg-slate-50' : ''}`}>
                      {index === 0 && <td rowSpan={daySchedules.length} className="p-4 font-bold text-slate-700 bg-slate-50/30 border-r border-slate-100 align-top">{day}</td>}
                      <td className={`p-4 font-medium ${sch.status === 'cancelled' ? 'text-slate-400' : 'text-slate-600'}`}>{sch.jamMulai} - {sch.jamSelesai}</td>
                      <td className="p-4">
                        <div className={sch.status === 'cancelled' ? 'opacity-50' : ''}>
                          <div className={`font-bold text-base ${sch.status === 'cancelled' ? 'line-through text-slate-500' : 'text-slate-800'}`}>{sch.mataKuliah}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{sch.dosen}</div>
                        </div>
                        {sch.status === 'cancelled' && <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-wide">Dibatalkan</span>}
                      </td>
                      <td className="p-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${sch.status === 'cancelled' ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>{sch.ruang}</span></td>
                      <td className="p-4 text-center font-medium text-slate-600">{sch.sks}</td>
                      <td className="p-4 text-center">
                        {sch.status === 'active' ? (
                          <button onClick={() => cancelSchedule(sch.id)} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">Cancel</button>
                        ) : (
                          <button disabled className="text-slate-300 cursor-not-allowed"><LogOut size={18} /></button>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NEW: DETAILED BOOKING HISTORY */}
      {myBookings.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" size={20} /> Tiket Booking Saya
          </h3>
           <div className="grid gap-4 md:grid-cols-2">
             {myBookings.map(b => (
               <div key={b.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col relative">
                 <div className="h-2 bg-emerald-500 w-full"></div>
                 <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Booking ID</p>
                        <p className="text-lg font-mono font-bold text-slate-800 flex items-center gap-1">
                          <Hash size={16} className="text-emerald-600"/> {b.bookingId}
                        </p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">{b.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b border-slate-100 py-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Ruangan</p>
                        <p className="font-bold text-slate-800">{b.roomName}</p>
                        <p className="text-xs text-slate-400">ID: {b.roomId} • Lt. {b.floor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Waktu Penggunaan</p>
                        <p className="font-bold text-slate-800">{b.date}</p>
                        <p className="text-xs text-slate-600">{b.time}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center text-sm">
                      <div>
                         <p className="text-xs text-slate-400">Atas Nama</p>
                         <p className="font-semibold text-slate-700">{b.userName}</p>
                         <p className="text-xs text-slate-500">{b.userMajor} - {b.userClass}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-slate-400">Biaya</p>
                         <p className="font-bold text-red-500">-{b.duration} Poin SKS</p>
                      </div>
                    </div>
                 </div>
                 {/* Cutout effect for ticket look */}
                 <div className="absolute top-1/2 left-0 w-4 h-8 bg-slate-50 rounded-r-full transform -translate-y-1/2 border-r border-slate-200"></div>
                 <div className="absolute top-1/2 right-0 w-4 h-8 bg-slate-50 rounded-l-full transform -translate-y-1/2 border-l border-slate-200"></div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

// Advanced Booking Flow (Floor Filter + Visibility)
const BookingFlow = ({ onChangePage }) => {
  const { points, checkAvailability, bookRoom } = useBooking();
  
  const [step, setStep] = useState(0); 
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  
  // State untuk Hasil Pencarian & Filter
  const [allRoomsStatus, setAllRoomsStatus] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(2); // Default Lantai 2
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newBookingId, setNewBookingId] = useState('');

  const handleCheckAvailability = (e) => {
    e.preventDefault();
    if (!date || !startTime) return alert("Mohon isi tanggal dan jam mulai.");
    const results = checkAvailability(date, startTime, duration);
    setAllRoomsStatus(results);
    setStep(1); 
  };

  const handleBookingExecution = (room) => {
    const result = bookRoom(room, date, startTime, duration);
    if (result.success) {
      setSelectedRoom(room); 
      setNewBookingId(result.bookingId); // Simpan ID untuk tampilan sukses
      setStep(2);
      setTimeout(() => onChangePage('dashboard'), 3000);
    } else {
      alert(result.message);
    }
  };

  // Filter ruangan berdasarkan lantai yang dipilih
  const visibleRooms = allRoomsStatus.filter(r => r.floor === selectedFloor);

  if (step === 0) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <button onClick={() => onChangePage('dashboard')} className="mb-6 text-slate-500 flex items-center gap-1 hover:text-emerald-600 text-sm font-medium">← Kembali ke Dashboard</button>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Cari Ketersediaan</h2>
            <p className="text-slate-500 text-sm mt-1">Tentukan waktu penggunaan terlebih dahulu.</p>
          </div>
          <form onSubmit={handleCheckAvailability} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Penggunaan</label>
              <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jam Mulai</label>
                <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Durasi</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                  <option value={1}>1 Jam (1 Poin)</option>
                  <option value={2}>2 Jam (2 Poin)</option>
                  <option value={3}>3 Jam (3 Poin)</option>
                  <option value={4}>4 Jam (4 Poin)</option>
                </select>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-800">
                <p className="font-bold">Saldo Anda: {points} Poin</p>
                <p className="opacity-80">Sistem akan menampilkan status semua ruangan pada jam tersebut.</p>
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"><Search size={20} /> Cek Status Ruangan</button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep(0)} className="text-slate-500 flex items-center gap-1 hover:text-emerald-600 text-sm font-medium">← Ubah Waktu</button>
          <div className="text-right">
             <p className="text-xs text-slate-400">Status Ruangan Pukul</p>
             <p className="font-bold text-sm text-slate-700">{date} • {startTime}</p>
          </div>
        </div>

        {/* NEW: FLOOR FILTER TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[2, 3, 4].map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                selectedFloor === floor 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers size={16} /> Lantai {floor}
            </button>
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-4">Daftar Ruangan Lantai {selectedFloor}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleRooms.map((room) => (
            <div 
              key={room.id}
              className={`relative p-5 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[140px] ${
                room.isAvailable 
                  ? 'bg-white border-slate-100 hover:border-emerald-500 cursor-pointer hover:shadow-md' 
                  : 'bg-slate-100 border-slate-200 opacity-80' // Tetap terlihat tapi beda style
              }`}
              onClick={() => room.isAvailable && handleBookingExecution(room)}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${room.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-300 text-slate-500'}`}>
                    <MapPin size={24} />
                  </div>
                  {room.isAvailable ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold border border-green-200">TERSEDIA</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold border border-red-200">SIBUK</span>
                  )}
                </div>
                
                <h3 className={`font-bold text-lg ${room.isAvailable ? 'text-slate-800' : 'text-slate-500'}`}>{room.name}</h3>
                <p className="text-sm text-slate-500">Kapasitas {room.capacity} Orang</p>
              </div>

              {!room.isAvailable && (
                <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {room.conflictReason}
                </div>
              )}
              
              {room.isAvailable && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle size={12} /> Klik untuk booking
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in text-center px-4">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-emerald-200 shadow-xl">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Booking Berhasil!</h2>
        <p className="text-slate-500 mb-4">Ruangan <strong>{selectedRoom?.name}</strong> telah diamankan.</p>
        
        <div className="bg-slate-100 px-6 py-3 rounded-lg font-mono font-bold text-slate-700 border border-slate-200 mb-6">
           ID: {newBookingId}
        </div>

        <div className="text-sm text-slate-400 animate-pulse">Mengalihkan ke dashboard...</div>
      </div>
    );
  }
};

export default function App() {
  return (
    <BookingProvider>
      <MainContent />
    </BookingProvider>
  );
}

function MainContent() {
  const { user, logout } = useBooking();
  const [currentPage, setCurrentPage] = useState('dashboard');
  if (!user) return <LoginPage />;
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-200 px-4 py-3 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-lg flex items-center justify-center shadow-emerald-200 shadow-md">
              <Calendar className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight hidden sm:block">FST Booking</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block leading-tight">
              <div className="text-sm font-bold text-slate-800">{user.name}</div>
              <div className="text-xs text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded-full mt-0.5">{user.major} • {user.kelas}</div>
            </div>
            <button onClick={logout} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-400 transition-colors" title="Logout"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-4 mt-4">
        {currentPage === 'dashboard' && <DashboardPage onChangePage={setCurrentPage} />}
        {currentPage === 'booking' && <BookingFlow onChangePage={setCurrentPage} />}
      </main>
    </div>
  );
}