"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Calendar, MapPin, User, LogOut, PlusCircle, CheckCircle, Search, AlertCircle, Lock, Eye, EyeOff, Hash, Layers, Timer, ShieldAlert, Clock, X, LayoutGrid, ArrowRight } from 'lucide-react';
import { loginUser, getInitialData, cancelScheduleAction, cancelBookingAction, checkRoomAvailabilityAction, bookRoomAction } from './actions';

// --- CONTEXT ---
const BookingContext = createContext();

const BookingProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardDate, setDashboardDate] = useState(new Date().toISOString().split('T')[0]);

  const login = async (nimInput, passwordInput) => {
    setIsLoading(true);
    const result = await loginUser(nimInput, passwordInput);
    if (result.success) {
      setUser(result.user);
      setAuthError("");
      await refreshUserData(result.user.id, result.user.kelas, result.user.major, dashboardDate);
    } else {
      setAuthError(result.message);
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null); setPoints(0); setSchedules([]); setMyBookings([]);
  };

  const refreshUserData = async (id, kelas, major, dateStr) => {
    const data = await getInitialData(id, kelas, major, dateStr);
    if (data.success) {
      setPoints(data.points);
      setSchedules(data.schedules || []);
      setMyBookings(data.myBookings || []);
    }
  };

  useEffect(() => {
    if (user) refreshUserData(user.id, user.kelas, user.major, dashboardDate);
  }, [dashboardDate]);

  const cancelSchedule = async (id, sks) => {
    const result = await cancelScheduleAction(user.id, id, sks, dashboardDate);
    if (result.success) {
      await refreshUserData(user.id, user.kelas, user.major, dashboardDate);
      return { success: true, message: "Jadwal berhasil dibatalkan." };
    }
    return { success: false, message: result.message };
  };

  const cancelBooking = async (bookingId, duration) => {
      const result = await cancelBookingAction(user.id, bookingId, duration);
      if (result.success) {
          await refreshUserData(user.id, user.kelas, user.major, dashboardDate);
          return { success: true, message: "Booking dibatalkan." };
      }
      return { success: false, message: result.message };
  };

  const checkAvailability = async (date, startTime, duration) => {
      const result = await checkRoomAvailabilityAction(date, startTime, duration);
      if (result.success) return result.data;
      return [];
  };

  const executeBooking = async (room, date, startTime, duration) => {
      if (points < duration) return { success: false, message: "Poin SKS tidak mencukupi." };
      const bookingData = {
          userId: user.id, roomId: room.id, roomName: room.name, floor: room.floor,
          date, startTime, duration, userName: user.name, userMajor: user.major, userClass: user.kelas
      };
      const result = await bookRoomAction(bookingData);
      if (result.success) {
          await refreshUserData(user.id, user.kelas, user.major, dashboardDate);
          return { success: true, bookingId: result.bookingId || "ID-ERROR" };
      }
      return { success: false, message: result.message };
  };

  return (
    <BookingContext.Provider value={{ 
      user, points, schedules, myBookings, authError, isLoading, dashboardDate, setDashboardDate,
      login, logout, cancelSchedule, cancelBooking, checkAvailability, executeBooking 
    }}>
      {children}
    </BookingContext.Provider>
  );
};

const useBooking = () => useContext(BookingContext);

// --- UI COMPONENTS ---

const Modal = ({ isOpen, title, children, onConfirm, onCancel, confirmText = "Lanjutkan", type = "danger", showCancel = true }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 ring-1 ring-black/5">
                <div className={`p-5 flex items-center gap-3 ${type === 'danger' ? 'bg-red-50 text-red-700' : type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-800'}`}>
                    {type === 'danger' ? <ShieldAlert size={24} /> : type === 'success' ? <CheckCircle size={24} /> : <LayoutGrid size={24}/>}
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onCancel} className="ml-auto text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6">{children}</div>
                <div className="p-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    {showCancel && <button onClick={onCancel} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Batal</button>}
                    {onConfirm && <button onClick={onConfirm} className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                        {confirmText}
                    </button>}
                </div>
            </div>
        </div>
    );
};

// --- PAGES ---

const LoginPage = () => {
  const { login, authError, isLoading } = useBooking();
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative overflow-hidden">
      {/* Background Image WA0007 */}
      <div className="absolute inset-0 z-0">
        <img src="/IMG-20251127-WA0007.jpg" alt="Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
            <div className="text-center mb-8">
            <div className="flex justify-center mx-auto mb-4 bg-white p-3 rounded-2xl w-fit shadow-lg">
                <img src="/LOGO UIN RMS SURAKARTA.png" alt="Logo" className="w-16 h-auto object-contain"/>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Reservefy</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Sistem Manajemen Ruang FST</p>
            </div>

            {authError && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-pulse font-medium"><AlertCircle size={16} /> {authError}</div>}
            
            <form onSubmit={(e) => { e.preventDefault(); if(nim && password) login(nim, password); }} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">NIM / Username</label>
                <div className="relative">
                    <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input type="text" value={nim} onChange={(e) => setNim(e.target.value)} className="w-full pl-12 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" placeholder="Masukkan NIM" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" placeholder="••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4">
                {isLoading ? 'Memproses...' : 'Masuk ke Reservefy'}
            </button>
            </form>
            
            <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Powered by MAFFH Team</p>
            </div>
        </div>
      </div>
    </div>
  );
};

// FITUR BARU: MODAL CEK KETERSEDIAAN (QUICK CHECK)
const QuickCheckModal = ({ isOpen, onClose, onCheck }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(1);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        if(!date || !time) return;
        setLoading(true);
        const data = await onCheck(date, time, duration);
        setResults(data);
        setLoading(false);
    };

    // Reset saat modal ditutup
    useEffect(() => { if(!isOpen) { setResults(null); setDate(''); setTime(''); } }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Search size={20}/> Cek Ruang Kosong</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white"><X size={24}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleCheck} className="flex gap-3 mb-6 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700" />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Jam</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700" />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Durasi</label>
                            <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700">
                                <option value={1}>1 Jam</option><option value={2}>2 Jam</option><option value={3}>3 Jam</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="bg-slate-900 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50">
                            {loading ? '...' : 'Cari'}
                        </button>
                    </form>

                    {results && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {results.map(room => (
                                <div key={room.id} className={`p-4 rounded-xl border-l-4 ${room.isAvailable ? 'border-emerald-500 bg-emerald-50/50' : 'border-red-500 bg-red-50/50'} flex justify-between items-start`}>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{room.name}</h4>
                                        <p className="text-xs text-slate-500">Lantai {room.floor} • Kapasitas {room.capacity}</p>
                                    </div>
                                    {room.isAvailable ? (
                                        <span className="text-emerald-700 text-xs font-extrabold bg-emerald-100 px-2 py-1 rounded">KOSONG</span>
                                    ) : (
                                        <div className="text-right">
                                            <span className="text-red-700 text-xs font-extrabold bg-red-100 px-2 py-1 rounded">TERISI</span>
                                            <p className="text-[10px] text-red-600 mt-1 max-w-[100px] leading-tight">{room.conflictReason}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardPage = ({ onChangePage }) => {
  const { user, points, schedules, cancelSchedule, myBookings, cancelBooking, dashboardDate, setDashboardDate, checkAvailability } = useBooking();
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  
  const getDayName = (dateStr) => {
      const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
      return days[new Date(dateStr).getDay()];
  };

  const currentDayName = getDayName(dashboardDate);
  const todaysSchedules = (schedules || []).filter(s => s.hari === currentDayName);

  const isSchedulePast = (timeStr) => {
      const now = new Date();
      const selectedDate = new Date(dashboardDate);
      if (selectedDate.setHours(0,0,0,0) < now.setHours(0,0,0,0)) return true;
      if (selectedDate.setHours(0,0,0,0) > now.setHours(0,0,0,0)) return false;
      const [h, m] = timeStr.split(':').map(Number);
      const scheduleTime = new Date();
      scheduleTime.setHours(h, m, 0, 0);
      return scheduleTime < new Date();
  };

  const [modalData, setModalData] = useState({ isOpen: false, type: 'cancel_schedule', data: null });

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <Modal 
         isOpen={modalData.isOpen} 
         title={modalData.type === 'cancel_schedule' ? "Konfirmasi Pembatalan" : "Batalkan Booking"}
         onCancel={() => setModalData({ ...modalData, isOpen: false })}
         onConfirm={async () => {
             if (!modalData.data) return;
             if (modalData.type === 'cancel_schedule') await cancelSchedule(modalData.data.id, modalData.data.sks);
             else await cancelBooking(modalData.data.bookingId, modalData.data.duration);
             setModalData({ isOpen: false, type: '', data: null });
         }}
         confirmText="Ya, Batalkan"
      >
          <p className="text-slate-600 leading-relaxed">
              Anda akan membatalkan <strong>{modalData.data?.mataKuliah || modalData.data?.roomName}</strong>. 
              <br/>Tindakan ini akan mengembalikan/menambah Poin SKS Anda. Pastikan Anda sudah mengecek ketersediaan ruang pengganti.
          </p>
      </Modal>

      <QuickCheckModal isOpen={showQuickCheck} onClose={() => setShowQuickCheck(false)} onCheck={checkAvailability} />

      {/* HERO SECTION dengan Foto WA0013 */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl h-48 sm:h-56 group">
          <img src="/IMG-20251127-WA0013.jpg" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Hero"/>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <div className="text-emerald-300 font-bold text-sm tracking-wider mb-1 uppercase">Saldo Poin Anda</div>
              <div className="text-5xl font-extrabold text-white tracking-tight mb-4">{points} <span className="text-2xl font-medium text-emerald-200">SKS</span></div>
              
              <div className="flex gap-3">
                  <button onClick={() => onChangePage('booking')} disabled={points === 0} className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-50 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                      <PlusCircle size={18}/> Booking Ruang
                  </button>
                  {/* TOMBOL BARU: CEK RUANG KOSONG */}
                  <button onClick={() => setShowQuickCheck(true)} className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-5 py-2.5 rounded-xl font-bold hover:bg-white/30 flex items-center gap-2 transition-all">
                      <Search size={18}/> Cek Ketersediaan
                  </button>
              </div>
          </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
          <h3 className="font-extrabold text-2xl text-slate-800 flex items-center gap-2">Jadwal Kuliah</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-2 shadow-sm">
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wide">Filter Tanggal</div>
              <input type="date" value={dashboardDate} onChange={(e) => setDashboardDate(e.target.value)} className="text-sm font-bold text-slate-800 bg-transparent outline-none pr-2 cursor-pointer"/>
          </div>
      </div>

      {/* TABEL JADWAL PREMIUM */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-extrabold text-slate-700 text-lg">{currentDayName}</span>
              <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{dashboardDate}</span>
          </div>
          
          {todaysSchedules.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                  <Calendar size={48} className="mb-4 opacity-20"/>
                  <p className="font-medium">Tidak ada jadwal kuliah di hari ini.</p>
              </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                <thead>
                    {/* Header Gelap Elegan */}
                    <tr className="bg-slate-800 text-white uppercase text-xs tracking-wider">
                    <th className="p-5 font-bold rounded-tl-lg">Waktu</th>
                    <th className="p-5 font-bold">Mata Kuliah</th>
                    <th className="p-5 font-bold">Ruang</th>
                    <th className="p-5 font-bold text-center rounded-tr-lg">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {todaysSchedules.map((sch, idx) => {
                    const isPast = isSchedulePast(sch.jamMulai);
                    const isCancelled = sch.status === 'cancelled';
                    return (
                        <tr key={sch.id} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 ${isCancelled ? 'bg-red-50/80' : ''}`}>
                            <td className="p-5 font-mono font-bold text-slate-500 whitespace-nowrap">{sch.jamMulai} - {sch.jamSelesai}</td>
                            <td className="p-5">
                                <div className={`font-bold text-base ${isCancelled ? 'opacity-50 line-through text-slate-500' : 'text-slate-800'}`}>{sch.mataKuliah}</div>
                                <div className="text-xs text-slate-500 mt-1 font-medium">{sch.dosen}</div>
                                {isCancelled && <span className="inline-block mt-2 text-red-600 text-[10px] font-extrabold bg-red-100 px-2 py-0.5 rounded tracking-wide">DIBATALKAN</span>}
                                {isPast && !isCancelled && <span className="inline-block mt-2 text-slate-400 text-[10px] font-extrabold bg-slate-200 px-2 py-0.5 rounded tracking-wide">SELESAI</span>}
                            </td>
                            <td className="p-5">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isCancelled ? 'bg-white text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                    {sch.room?.name || sch.roomId}
                                </span>
                            </td>
                            <td className="p-5 text-center">
                            {isCancelled ? (
                                <button disabled className="text-slate-300 cursor-not-allowed"><LogOut size={20} /></button>
                            ) : isPast ? (
                                <Lock size={20} className="text-slate-200 mx-auto"/>
                            ) : (
                                <button onClick={() => setModalData({ isOpen: true, type: 'cancel_schedule', data: sch })} className="group bg-white border-2 border-red-100 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto">
                                    Cancel
                                </button>
                            )}
                            </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
          )}
      </div>

      {myBookings && myBookings.length > 0 && (
        <div className="mt-10">
           <h3 className="font-extrabold text-2xl text-slate-800 mb-6 flex items-center gap-2">Riwayat Booking</h3>
           <div className="grid gap-5 md:grid-cols-2">
             {myBookings.map(b => {
               if (!b) return null;
               return (
               <div key={b.bookingId || Math.random()} className={`bg-white rounded-2xl shadow-sm border-l-4 p-5 transition-all hover:shadow-md ${b.status === 'DIBATALKAN' ? 'border-l-red-400 opacity-60 bg-slate-50' : 'border-l-emerald-500'}`}>
                   <div className="flex justify-between mb-3">
                       <span className="font-mono font-bold text-xs text-slate-400 uppercase tracking-widest">ID: {b.bookingId}</span>
                       <span className={`text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wide ${b.status === 'TERKONFIRMASI' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{b.status}</span>
                   </div>
                   <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-xl ${b.status === 'TERKONFIRMASI' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                           <MapPin size={24}/>
                       </div>
                       <div>
                           <h4 className="font-bold text-lg text-slate-800 leading-tight">{b.roomName}</h4>
                           <p className="text-sm font-medium text-slate-500 mt-1">{b.date} • {b.startTime} - {b.endTime}</p>
                           {b.status === 'TERKONFIRMASI' && new Date(b.date + 'T' + b.startTime) > new Date() && (
                               <button onClick={() => setModalData({ isOpen: true, type: 'cancel_booking', data: b })} className="mt-3 text-red-500 text-xs font-bold hover:text-red-700 flex items-center gap-1 transition-colors">
                                   <X size={14}/> Batalkan Pesanan
                               </button>
                           )}
                       </div>
                   </div>
               </div>
             )})}
           </div>
        </div>
      )}
    </div>
  );
};

const BookingFlow = ({ onChangePage }) => {
    const { points, checkAvailability, executeBooking } = useBooking();
    const [step, setStep] = useState(0); 
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(1);
    const [timeLeft, setTimeLeft] = useState(300); // 5 Menit 
    const [allRoomsStatus, setAllRoomsStatus] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(2); 
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [newBookingId, setNewBookingId] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
  
    useEffect(() => {
        let interval;
        if (step === 1) {
            setTimeLeft(300); 
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        alert("Waktu booking habis!");
                        setStep(0); return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step]);
  
    const handleCheckAvailability = async (e) => {
      e.preventDefault();
      if (!date || !startTime) return alert("Mohon isi tanggal dan jam.");
      
      const today = new Date().toISOString().split('T')[0];
      if (date < today) return alert("Tidak bisa memilih tanggal yang sudah berlalu.");

      if (date === today) {
          const now = new Date();
          const [h, m] = startTime.split(':').map(Number);
          if (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m)) {
              return alert("Waktu sudah berlalu. Pilih jam yang akan datang.");
          }
      }

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
        <div className="max-w-lg mx-auto animate-fade-in py-10">
          <button onClick={() => onChangePage('dashboard')} className="mb-8 text-slate-500 flex items-center gap-2 hover:text-emerald-600 text-sm font-bold transition-colors">
              <ArrowRight className="rotate-180" size={18}/> Kembali ke Dashboard
          </button>
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Booking Ruang</h2>
            <p className="text-slate-500 mb-8">Pilih waktu penggunaan untuk melihat ruangan yang tersedia.</p>
            
            <form onSubmit={handleCheckAvailability} className="space-y-6">
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Penggunaan</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jam Mulai</label>
                    <input type="time" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Durasi</label>
                    <div className="relative">
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none transition-all" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                            <option value={1}>1 Jam</option><option value={2}>2 Jam</option><option value={3}>3 Jam</option>
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none text-slate-400"><Layers size={20}/></div>
                    </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4">
                  <Search size={20} /> Cek Ketersediaan
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (step === 1) {
        return (
          <div className="animate-fade-in relative pb-20">
            <div className="sticky top-20 z-40 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-full shadow-2xl flex items-center gap-4 w-fit mx-auto mb-8 border border-white/20 px-6">
                 <Timer className="text-emerald-400" size={24} />
                 <div>
                     <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Sisa Waktu</p>
                     <span className="font-mono font-bold text-xl leading-none">{formatTime(timeLeft)}</span>
                 </div>
            </div>

            <Modal isOpen={showConfirmModal} title="Konfirmasi Booking" onCancel={() => setShowConfirmModal(false)} onConfirm={handleExecuteBooking} confirmText="Ya, Booking Sekarang" type="success">
                <p className="text-slate-600 mb-4">Anda akan menggunakan poin SKS untuk membooking ruangan ini.</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Ruangan</span><span className="font-bold text-slate-800">{selectedRoom?.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Waktu</span><span className="font-bold text-slate-800">{date}, {startTime}</span></div>
                    <div className="flex justify-between pt-2 border-t border-slate-200"><span className="text-slate-500">Biaya</span><span className="font-bold text-emerald-600">-{duration} Poin</span></div>
                </div>
            </Modal>
            
            <div className="flex items-center justify-between mb-6 px-2">
               <button onClick={() => setStep(0)} className="text-slate-500 flex items-center gap-2 hover:text-emerald-600 text-sm font-bold transition-colors">← Ubah Pencarian</button>
               <div className="text-right"><p className="text-xs text-slate-400 font-bold uppercase">Status Pukul</p><p className="font-bold text-slate-700">{date} • {startTime}</p></div>
            </div>

            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 px-1">
              {[2, 3, 4].map(floor => (
                  <button key={floor} onClick={() => setSelectedFloor(floor)} className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm whitespace-nowrap ${selectedFloor === floor ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                      Lantai {floor}
                  </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visibleRooms.map((room) => (
                <div key={room.id} className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between min-h-[160px] ${room.isAvailable ? 'bg-white border-white shadow-lg hover:border-emerald-400 hover:shadow-xl cursor-pointer group' : 'bg-slate-50 border-slate-100 opacity-70 grayscale'}`} onClick={() => room.isAvailable && requestBooking(room)}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className={`p-3 rounded-2xl ${room.isAvailable ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors' : 'bg-slate-200 text-slate-400'}`}>
                            <MapPin size={24} />
                        </div>
                        {room.isAvailable ? <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wide">Tersedia</span> : <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wide">Terisi</span>}
                    </div>
                    <h3 className="font-extrabold text-xl text-slate-800 mb-1">{room.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kapasitas {room.capacity} Orang</p>
                  </div>
                  
                  {!room.isAvailable ? (
                      <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-red-500 font-bold flex items-start gap-1.5">
                          <Clock size={14} className="shrink-0 mt-0.5"/> {room.conflictReason}
                      </div>
                  ) : (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CheckCircle size={14}/> Klik untuk booking
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
            <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100 border-4 border-white">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Booking Berhasil!</h2>
            <p className="text-slate-500 mb-8 text-lg">Ruangan telah diamankan untuk Anda.</p>
            <div className="bg-white px-8 py-4 rounded-2xl font-mono font-bold text-slate-700 border-2 border-slate-100 shadow-lg mb-8 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Booking ID</span>
                <span className="text-xl">{newBookingId}</span>
            </div>
            <div className="text-sm font-bold text-emerald-600 animate-pulse">Mengalihkan ke dashboard...</div>
        </div>
      )
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
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage('dashboard')}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
                <Calendar className="text-white w-6 h-6" />
            </div>
            <span className="font-extrabold text-slate-800 text-xl tracking-tight hidden sm:block">Reservefy</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block leading-tight">
                <div className="text-sm font-bold text-slate-800">{user.name}</div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-0.5 uppercase tracking-wide">{user.major}</div>
            </div>
            <button onClick={logout} className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-400 transition-colors" title="Logout"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-4 mt-6 flex-grow w-full">
        {currentPage === 'dashboard' && <DashboardPage onChangePage={setCurrentPage} />}
        {currentPage === 'booking' && <BookingFlow onChangePage={setCurrentPage} />}
      </main>
      
      {/* COPYRIGHT FOOTER */}
      <footer className="py-8 text-center border-t border-slate-200 mt-auto bg-white">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Created by</p>
          <p className="text-slate-800 font-extrabold text-sm">MAFFH Team © 2025</p>
      </footer>
    </div>
  );
}