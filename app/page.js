"use client";
import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Calendar, MapPin, User, LogOut, PlusCircle, CheckCircle, Search, AlertCircle, Lock, Eye, EyeOff, Hash, Layers, Timer, ShieldAlert } from 'lucide-react';
// Import Server Actions
import { loginUser, getInitialData, cancelScheduleAction, cancelBookingAction, checkRoomAvailabilityAction, bookRoomAction } from './actions';

// --- CONTEXT MANAGEMENT ---
const BookingContext = createContext();

const BookingProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi Login ke Database
  const login = async (nimInput, passwordInput) => {
    setIsLoading(true);
    const result = await loginUser(nimInput, passwordInput);
    
    if (result.success) {
      setUser(result.user);
      setAuthError("");
      // Setelah login sukses, tarik data User (Poin, Jadwal, Booking)
      await refreshUserData(result.user.id, result.user.kelas, result.user.major);
    } else {
      setAuthError(result.message);
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setPoints(0);
    setSchedules([]);
    setMyBookings([]);
  };

  // Fungsi Refresh Data (Dipanggil setelah login atau ada perubahan)
  const refreshUserData = async (id, kelas, major) => {
    const data = await getInitialData(id, kelas, major);
    if (data.success) {
      setPoints(data.points);
      setSchedules(data.schedules);
      setMyBookings(data.myBookings);
    }
  };

  const cancelSchedule = async (id, sks) => {
    const result = await cancelScheduleAction(user.id, id, sks);
    if (result.success) {
      // Refresh data lokal agar UI update
      await refreshUserData(user.id, user.kelas, user.major);
      return { success: true, message: "Jadwal berhasil dibatalkan. Poin ditambahkan." };
    }
    return { success: false, message: result.message };
  };

  const cancelBooking = async (bookingId, duration) => {
      const result = await cancelBookingAction(user.id, bookingId, duration);
      if (result.success) {
          await refreshUserData(user.id, user.kelas, user.major);
          return { success: true, message: "Booking dibatalkan. Poin dikembalikan." };
      }
      return { success: false, message: result.message };
  };

  const checkAvailability = async (date, startTime, duration) => {
      const result = await checkRoomAvailabilityAction(date, startTime, duration);
      if (result.success) {
          return result.data;
      }
      return [];
  };

  const executeBooking = async (room, date, startTime, duration) => {
      if (points < duration) return { success: false, message: "Poin SKS tidak mencukupi." };

      const bookingData = {
          userId: user.id,
          roomId: room.id,
          roomName: room.name,
          floor: room.floor,
          date,
          startTime,
          duration,
          userName: user.name,
          userMajor: user.major,
          userClass: user.kelas
      };

      const result = await bookRoomAction(bookingData);
      if (result.success) {
          await refreshUserData(user.id, user.kelas, user.major);
          return { success: true, bookingId: result.bookingId };
      }
      return { success: false, message: result.message };
  };

  return (
    <BookingContext.Provider value={{ 
      user, points, schedules, myBookings, authError, isLoading,
      login, logout, cancelSchedule, cancelBooking, checkAvailability, executeBooking 
    }}>
      {children}
    </BookingContext.Provider>
  );
};

const useBooking = () => useContext(BookingContext);

// --- COMPONENTS ---

// Generic Modal
const Modal = ({ isOpen, title, children, onConfirm, onCancel, confirmText = "Ya, Lanjutkan", type = "danger" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
                <div className={`p-4 flex items-center gap-3 ${type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {type === 'danger' ? <ShieldAlert size={24} /> : <CheckCircle size={24} />}
                    <h3 className="font-bold text-lg">{title}</h3>
                </div>
                <div className="p-6">{children}</div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Login Page
const LoginPage = () => {
  const { login, authError, isLoading } = useBooking();
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
        
        <div className="text-center mb-8">
          <div className="flex justify-center mx-auto mb-6">
            <img src="/LOGO UIN RMS SURAKARTA.png" alt="Logo FST" className="w-40 h-auto object-contain drop-shadow-md hover:scale-105 transition-transform"/>
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
            <label className="block text-sm font-bold text-slate-700 mb-1">NIM / Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input type="text" value={nim} onChange={(e) => setNim(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold bg-slate-50 focus:bg-white transition-colors" placeholder="Masukkan NIM" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold bg-slate-50 focus:bg-white transition-colors" placeholder="Masukkan Password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed">
              {isLoading ? 'Memuat...' : 'Masuk Sistem'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2 font-semibold">Akun Demo (Pass: 123)</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs font-mono text-slate-400">
            <span className="bg-slate-50 px-2 py-1 rounded border">12345 (Aruna)</span>
            <span className="bg-slate-50 px-2 py-1 rounded border">67890 (Budi)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Student
const DashboardPage = ({ onChangePage }) => {
  const { user, points, schedules, cancelSchedule, myBookings, cancelBooking } = useBooking();
  const weekDays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

  // Modal State
  const [modalData, setModalData] = useState({ isOpen: false, type: 'cancel_schedule', data: null });

  const handleCancelRequest = (schedule) => {
     setModalData({ isOpen: true, type: 'cancel_schedule', data: schedule });
  };

  const handleBookingCancelRequest = (booking) => {
     setModalData({ isOpen: true, type: 'cancel_booking', data: booking });
  }

  const confirmAction = async () => {
      if (modalData.type === 'cancel_schedule') {
          const res = await cancelSchedule(modalData.data.id, modalData.data.sks);
          if (!res.success) alert(res.message);
      } else if (modalData.type === 'cancel_booking') {
          const res = await cancelBooking(modalData.data.bookingId, modalData.data.duration);
          if (!res.success) alert(res.message);
      }
      setModalData({ isOpen: false, type: '', data: null });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Modal Konfirmasi */}
      <Modal 
         isOpen={modalData.isOpen} 
         title={modalData.type === 'cancel_schedule' ? "Batalkan Jadwal Kuliah?" : "Batalkan Booking Ruang?"}
         onCancel={() => setModalData({ ...modalData, isOpen: false })}
         onConfirm={confirmAction}
         confirmText={modalData.type === 'cancel_schedule' ? "Ya, Konversi ke Poin" : "Ya, Batalkan"}
      >
          {modalData.type === 'cancel_schedule' && (
              <p className="text-slate-600">
                  Anda akan membatalkan mata kuliah <strong>{modalData.data?.mataKuliah}</strong>. 
                  SKS sebesar <strong>{modalData.data?.sks}</strong> akan dikonversi menjadi poin booking. 
                  <br/><span className="text-xs text-red-500 font-bold mt-2 block">*Aksi ini tidak dapat dibatalkan.</span>
              </p>
          )}
          {modalData.type === 'cancel_booking' && (
               <p className="text-slate-600">
               Anda akan membatalkan booking ruangan <strong>{modalData.data?.roomName}</strong>.
               Poin akan dikembalikan ke saldo Anda.
           </p>
          )}
      </Modal>

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
                  const daySchedules = schedules.filter(s => s.hari === day);
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
                      <td className="p-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${sch.status === 'cancelled' ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>{sch.room?.id || sch.roomId}</span></td>
                      <td className="p-4 text-center font-medium text-slate-600">{sch.sks}</td>
                      <td className="p-4 text-center">
                        {sch.status === 'active' ? (
                          <button onClick={() => handleCancelRequest(sch)} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">Cancel</button>
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

      {/* DETAILED BOOKING HISTORY */}
      {myBookings.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" size={20} /> Tiket Booking Saya
          </h3>
           <div className="grid gap-4 md:grid-cols-2">
             {myBookings.map(b => (
               <div key={b.bookingId} className={`bg-white rounded-xl shadow-md border overflow-hidden flex flex-col relative ${b.status === 'DIBATALKAN' ? 'border-red-200 opacity-75' : 'border-slate-200'}`}>
                 <div className={`h-2 w-full ${b.status === 'DIBATALKAN' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                 <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Booking ID</p>
                        <p className="text-lg font-mono font-bold text-slate-800 flex items-center gap-1">
                          <Hash size={16} className="text-emerald-600"/> {b.bookingId}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${b.status === 'DIBATALKAN' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{b.status}</span>
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
                        <p className="text-xs text-slate-600">{b.startTime} - {b.endTime}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                         {b.status === 'TERKONFIRMASI' ? (
                             <button onClick={() => handleBookingCancelRequest(b)} className="text-red-500 text-xs font-bold hover:underline">Batalkan Booking</button>
                         ) : (
                             <span className="text-red-400 text-xs italic">Booking telah dibatalkan</span>
                         )}
                         <div className="text-right">
                             <p className="text-xs text-slate-400">Biaya</p>
                             <p className={`font-bold ${b.status === 'DIBATALKAN' ? 'text-slate-500 line-through' : 'text-red-500'}`}>-{b.duration} Poin SKS</p>
                         </div>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

// Booking Flow
const BookingFlow = ({ onChangePage }) => {
  const { points, checkAvailability, executeBooking } = useBooking();
  
  const [step, setStep] = useState(0); 
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [timeLeft, setTimeLeft] = useState(120); 
  
  const [allRoomsStatus, setAllRoomsStatus] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(2); 
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newBookingId, setNewBookingId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
      let interval;
      if (step === 1) {
          setTimeLeft(120); 
          interval = setInterval(() => {
              setTimeLeft((prev) => {
                  if (prev <= 1) {
                      clearInterval(interval);
                      alert("Waktu booking habis!");
                      setStep(0);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [step]);

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!date || !startTime) return alert("Mohon isi tanggal dan jam mulai.");
    const results = await checkAvailability(date, startTime, duration);
    setAllRoomsStatus(results);
    setStep(1); 
  };

  const requestBooking = (room) => {
      setSelectedRoom(room);
      setShowConfirmModal(true);
  };

  const handleExecuteBooking = async () => {
    const result = await executeBooking(selectedRoom, date, startTime, duration);
    setShowConfirmModal(false);
    
    if (result.success) {
      setNewBookingId(result.bookingId);
      setStep(2);
      setTimeout(() => onChangePage('dashboard'), 3000);
    } else {
      alert(result.message);
    }
  };

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
      <div className="animate-fade-in relative">
        <div className="sticky top-20 z-40 bg-slate-900 text-white p-3 rounded-full shadow-xl flex items-center gap-3 w-fit mx-auto mb-6 animate-pulse border-2 border-emerald-400">
             <Timer className="text-emerald-400" size={20} />
             <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
             <span className="text-xs text-slate-400">Sisa Waktu</span>
        </div>

        <Modal 
            isOpen={showConfirmModal}
            title="Konfirmasi Booking Ruang"
            onCancel={() => setShowConfirmModal(false)}
            onConfirm={handleExecuteBooking}
            confirmText="Ya, Booking Sekarang"
            type="success"
        >
            <p className="text-slate-600 mb-2">Anda yakin ingin membooking ruangan ini?</p>
            <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-200">
                <div className="flex justify-between mb-1">
                    <span>Ruang:</span>
                    <span className="font-bold">{selectedRoom?.name}</span>
                </div>
                <div className="flex justify-between mb-1">
                    <span>Tanggal:</span>
                    <span className="font-bold">{date}</span>
                </div>
                <div className="flex justify-between mb-1">
                    <span>Jam:</span>
                    <span className="font-bold">{startTime} (Durasi {duration} Jam)</span>
                </div>
                 <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 text-emerald-600">
                    <span>Biaya:</span>
                    <span className="font-bold">-{duration} Poin</span>
                </div>
            </div>
        </Modal>

        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep(0)} className="text-slate-500 flex items-center gap-1 hover:text-emerald-600 text-sm font-medium">← Ubah Waktu</button>
          <div className="text-right">
             <p className="text-xs text-slate-400">Status Ruangan Pukul</p>
             <p className="font-bold text-sm text-slate-700">{date} • {startTime}</p>
          </div>
        </div>

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
                  : 'bg-slate-100 border-slate-200 opacity-80' 
              }`}
              onClick={() => room.isAvailable && requestBooking(room)}
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