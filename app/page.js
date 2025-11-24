"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Calendar, MapPin, User, LogOut, PlusCircle, CheckCircle, Search, AlertCircle, Lock, Eye, EyeOff, Hash, Layers, Timer, ShieldAlert, Clock } from 'lucide-react';
import { loginUser, getInitialData, cancelScheduleAction, cancelBookingAction, checkRoomAvailabilityAction, bookRoomAction } from './actions';

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
    setUser(null);
    setPoints(0);
    setSchedules([]);
    setMyBookings([]);
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
    if (user) {
        refreshUserData(user.id, user.kelas, user.major, dashboardDate);
    }
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
          // SAFETY: Pastikan return object ada bookingId-nya
          return { success: true, bookingId: result.bookingId || "UNKNOWN-ID" };
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

// --- COMPONENTS ---

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

const LoginPage = () => {
  const { login, authError, isLoading } = useBooking();
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        {authError && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 animate-pulse"><AlertCircle size={16} /> {authError}</div>}
        <form onSubmit={(e) => { e.preventDefault(); if(nim && password) login(nim, password); }} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">NIM / Username</label>
            <div className="relative"><User className="absolute left-3 top-3 text-slate-400" size={20} /><input type="text" value={nim} onChange={(e) => setNim(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold bg-slate-50 focus:bg-white" placeholder="Masukkan NIM" /></div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <div className="relative"><Lock className="absolute left-3 top-3 text-slate-400" size={20} /><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold bg-slate-50 focus:bg-white" placeholder="Masukkan Password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-70">{isLoading ? 'Memuat...' : 'Masuk Sistem'}</button>
        </form>
      </div>
    </div>
  );
};

const DashboardPage = ({ onChangePage }) => {
  const { user, points, schedules, cancelSchedule, myBookings, cancelBooking, dashboardDate, setDashboardDate } = useBooking();
  
  const getDayName = (dateStr) => {
      const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
      return days[new Date(dateStr).getDay()];
  };

  const currentDayName = getDayName(dashboardDate);
  // SAFETY CHECK: Pastikan schedules ada sebelum di-filter
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
    <div className="space-y-8 animate-fade-in pb-24">
      <Modal 
         isOpen={modalData.isOpen} 
         title={modalData.type === 'cancel_schedule' ? "Batalkan Jadwal?" : "Batalkan Booking?"}
         onCancel={() => setModalData({ ...modalData, isOpen: false })}
         onConfirm={async () => {
             // SAFETY CHECK: Pastikan modalData.data tidak null
             if (!modalData.data) return;

             if (modalData.type === 'cancel_schedule') await cancelSchedule(modalData.data.id, modalData.data.sks);
             else await cancelBooking(modalData.data.bookingId, modalData.data.duration);
             setModalData({ isOpen: false, type: '', data: null });
         }}
         confirmText="Ya, Lanjutkan"
      >
          <p className="text-slate-600">Apakah Anda yakin ingin membatalkan ini? Poin akan disesuaikan.</p>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-medium mb-1">Saldo Poin</p>
            <div className="text-4xl font-bold tracking-tight">{points} SKS</div>
          </div>
          <button onClick={() => onChangePage('booking')} disabled={points === 0} className="relative z-10 px-5 py-3 bg-white text-emerald-800 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-slate-50">
            <PlusCircle size={20} /> Booking
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><User size={20} /></div>
             <div><h3 className="font-bold text-slate-800 text-sm">{user.name}</h3><p className="text-xs text-slate-500">{user.major}</p></div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between sticky top-16 z-30">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Calendar size={20} className="text-emerald-600"/> Jadwal Kuliah</h3>
        <input type="date" value={dashboardDate} onChange={(e) => setDashboardDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"/>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-600 flex justify-between">
              <span>{currentDayName}</span>
              <span className="text-xs font-normal bg-white px-2 py-1 rounded border">{dashboardDate}</span>
          </div>
          {todaysSchedules.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">Tidak ada jadwal kuliah di hari ini.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="p-4">Jam</th>
                  <th className="p-4">Mata Kuliah</th>
                  <th className="p-4">Ruang</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todaysSchedules.map((sch) => {
                  const isPast = isSchedulePast(sch.jamMulai);
                  const isCancelled = sch.status === 'cancelled';
                  return (
                    <tr key={sch.id} className={`hover:bg-slate-50 transition-colors ${isCancelled ? 'bg-red-50/50' : ''} ${isPast ? 'opacity-60' : ''}`}>
                        <td className="p-4 font-medium text-slate-600">{sch.jamMulai} - {sch.jamSelesai}</td>
                        <td className="p-4">
                        <div className={isCancelled ? 'opacity-50 line-through' : 'font-bold text-slate-800'}>{sch.mataKuliah}</div>
                        <div className="text-xs text-slate-500">{sch.dosen}</div>
                        {isCancelled && <span className="text-red-600 text-[10px] font-bold uppercase">Dibatalkan</span>}
                        {isPast && !isCancelled && <span className="text-slate-400 text-[10px] font-bold uppercase ml-2">Berlalu</span>}
                        </td>
                        <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{sch.room?.name || sch.roomId}</span></td>
                        <td className="p-4 text-center">
                        {isCancelled ? (
                            <button disabled className="text-slate-300 cursor-not-allowed"><LogOut size={18} /></button>
                        ) : isPast ? (
                            <button disabled className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-not-allowed border border-slate-200">Selesai</button>
                        ) : (
                            <button onClick={() => setModalData({ isOpen: true, type: 'cancel_schedule', data: sch })} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Cancel</button>
                        )}
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* Booking History (SAFETY CHECK: Jika myBookings null, jangan crash) */}
      {myBookings && myBookings.length > 0 && (
        <div className="mt-8">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="text-emerald-600" size={20} /> Tiket Booking Saya</h3>
           <div className="grid gap-4 md:grid-cols-2">
             {myBookings.map(b => {
               // SAFETY CHECK: Jika data b corrupt/null, skip
               if (!b) return null;
               
               return (
               <div key={b.bookingId || Math.random()} className={`bg-white rounded-xl shadow-md border p-4 ${b.status === 'DIBATALKAN' ? 'opacity-75 border-red-200' : 'border-slate-200'}`}>
                   <div className="flex justify-between mb-2">
                       <span className="font-mono font-bold text-slate-600">{b.bookingId}</span>
                       <span className={`text-xs font-bold px-2 py-1 rounded ${b.status === 'TERKONFIRMASI' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{b.status}</span>
                   </div>
                   <h4 className="font-bold text-lg">{b.roomName}</h4>
                   <p className="text-sm text-slate-500">{b.date} • {b.startTime} - {b.endTime}</p>
                   {b.status === 'TERKONFIRMASI' && new Date(b.date + 'T' + b.startTime) > new Date() && (
                       <button onClick={() => setModalData({ isOpen: true, type: 'cancel_booking', data: b })} className="mt-3 text-red-500 text-xs font-bold hover:underline">Batalkan Booking</button>
                   )}
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
    const [timeLeft, setTimeLeft] = useState(300); 
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
        <div className="max-w-lg mx-auto animate-fade-in">
          <button onClick={() => onChangePage('dashboard')} className="mb-6 text-slate-500 flex items-center gap-1 hover:text-emerald-600 text-sm font-medium">← Kembali ke Dashboard</button>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Cari Ketersediaan</h2>
            <form onSubmit={handleCheckAvailability} className="space-y-6">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal</label>
                  <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jam</label>
                    <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Durasi</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={duration} onChange={e => setDuration(parseInt(e.target.value))}><option value={1}>1 Jam</option><option value={2}>2 Jam</option><option value={3}>3 Jam</option></select></div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Search size={20} /> Cek Ruangan</button>
            </form>
          </div>
        </div>
      );
    }

    if (step === 1) {
        return (
          <div className="animate-fade-in relative">
            <div className="sticky top-20 z-40 bg-slate-900 text-white p-3 rounded-full shadow-xl flex items-center gap-3 w-fit mx-auto mb-6 border-2 border-emerald-400">
                 <Timer className="text-emerald-400" size={20} />
                 <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
            <Modal isOpen={showConfirmModal} title="Konfirmasi" onCancel={() => setShowConfirmModal(false)} onConfirm={handleExecuteBooking} confirmText="Booking" type="success"><p>Booking {selectedRoom?.name}?</p></Modal>
            
            <div className="flex items-center justify-between mb-6">
               <button onClick={() => setStep(0)} className="text-slate-500 flex items-center gap-1 hover:text-emerald-600 text-sm font-medium">← Ubah Waktu</button>
               <div className="text-right"><p className="text-xs text-slate-400">Status Pukul</p><p className="font-bold text-sm text-slate-700">{date} • {startTime}</p></div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[2, 3, 4].map(floor => (<button key={floor} onClick={() => setSelectedFloor(floor)} className={`px-5 py-2 rounded-full text-sm font-bold ${selectedFloor === floor ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>Lt {floor}</button>))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleRooms.map((room) => (
                <div key={room.id} className={`p-5 rounded-xl border-2 ${room.isAvailable ? 'bg-white hover:border-emerald-500 cursor-pointer' : 'bg-slate-100 opacity-80'}`} onClick={() => room.isAvailable && requestBooking(room)}>
                  <div className="flex justify-between mb-2">
                      <h3 className="font-bold text-lg">{room.name}</h3>
                      {room.isAvailable ? <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded">OK</span> : <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded">SIBUK</span>}
                  </div>
                  {!room.isAvailable && (
                      <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-red-600 font-bold flex items-start gap-1">
                          <Clock size={12} className="mt-0.5 shrink-0"/> {room.conflictReason}
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-emerald-200 shadow-xl"><CheckCircle className="w-12 h-12 text-emerald-600" /></div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Booking Berhasil!</h2>
            <p className="text-slate-500 mb-4">Ruangan <strong>{selectedRoom?.name}</strong> telah diamankan.</p>
            <div className="bg-slate-100 px-6 py-3 rounded-lg font-mono font-bold text-slate-700 border border-slate-200 mb-6">ID: {newBookingId}</div>
            <div className="text-sm text-slate-400 animate-pulse">Mengalihkan ke dashboard...</div>
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-200 px-4 py-3 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-lg flex items-center justify-center shadow-emerald-200 shadow-md"><Calendar className="text-white w-5 h-5" /></div>
            <span className="font-bold text-slate-800 text-lg tracking-tight hidden sm:block">FST Booking</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block leading-tight"><div className="text-sm font-bold text-slate-800">{user.name}</div><div className="text-xs text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded-full mt-0.5">{user.major}</div></div>
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