"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Calendar, MapPin, User, LogOut, PlusCircle, CheckCircle, Search, AlertCircle, Lock, Eye, EyeOff, Hash, Layers, Timer, ShieldAlert, Clock, X, ArrowRight, Edit3, Filter, MessageSquare, Phone } from 'lucide-react';
import { loginUser, getInitialData, getAllSchedules, updateScheduleAction, cancelScheduleAction, cancelBookingAction, checkRoomAvailabilityAction, bookRoomAction } from './actions';

// --- CONTEXT ---
// (Bagian Context & Provider tidak berubah)
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
      if (result.user.role !== 'ADMIN') {
          await refreshUserData(result.user.id, result.user.kelas, result.user.major, dashboardDate);
      }
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
    if (user && user.role !== 'ADMIN') refreshUserData(user.id, user.kelas, user.major, dashboardDate);
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
          return { success: true, bookingId: result.bookingId };
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
// (Komponen Modal, QuickCheckModal, AdminDashboard, DashboardPage, BookingFlow tidak berubah)
const Modal = ({ isOpen, title, children, onConfirm, onCancel, confirmText = "Lanjutkan", type = "danger" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
                <div className={`p-4 flex items-center gap-3 ${type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {type === 'danger' ? <ShieldAlert size={24} /> : <CheckCircle size={24} />}
                    <h3 className="font-bold text-lg">{title}</h3>
                </div>
                <div className="p-6">{children}</div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm">Batal</button>
                    {onConfirm && <button onClick={onConfirm} className={`px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95 text-sm ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        {confirmText}
                    </button>}
                </div>
            </div>
        </div>
    );
};

const QuickCheckModal = ({ isOpen, onClose, onCheck }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(1);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        if(!date || !time) return;
        
        const today = new Date().toISOString().split('T')[0];
        if (date < today) return alert("Tanggal sudah lewat.");
        if (date === today) {
            const now = new Date();
            const [h, m] = time.split(':').map(Number);
            if (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m)) {
                return alert("Jam sudah lewat.");
            }
        }

        setLoading(true);
        const data = await onCheck(date, time, duration);
        setResults(data);
        setLoading(false);
    };

    useEffect(() => { if(!isOpen) { setResults(null); setDate(''); setTime(''); } }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-5 bg-emerald-600 text-white flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Search size={20}/> Cek Ruang Kosong</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 rounded-full p-1"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleCheck} className="flex flex-wrap md:flex-nowrap gap-3 mb-6 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="w-full md:w-32">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Jam</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="w-full md:w-24">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Durasi</label>
                            <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none">
                                <option value={1}>1 Jam</option><option value={2}>2 Jam</option><option value={3}>3 Jam</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="w-full md:w-auto bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-200">
                            {loading ? '...' : 'Cari'}
                        </button>
                    </form>

                    {results && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {results.map(room => (
                                <div key={room.id} className={`p-4 rounded-xl border-l-4 ${room.isAvailable ? 'border-emerald-500 bg-white shadow-sm hover:shadow-md' : 'border-red-500 bg-slate-50 opacity-90'} flex justify-between items-start transition-all`}>
                                    <div className="flex-1 pr-2">
                                        <h4 className="font-bold text-slate-800">{room.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Lt. {room.floor} • Kap. {room.capacity}</p>
                                    </div>
                                    {room.isAvailable ? (
                                        <span className="text-emerald-700 text-[10px] font-extrabold bg-emerald-100 px-2 py-1 rounded shrink-0">KOSONG</span>
                                    ) : (
                                        <div className="text-right shrink-0 flex flex-col items-end">
                                            <span className="text-red-700 text-[10px] font-extrabold bg-red-100 px-2 py-1 rounded mb-1">TERISI</span>
                                            <p className="text-[10px] text-red-600 font-medium leading-tight max-w-[140px] break-words text-right">
                                                {room.conflictReason}
                                            </p>
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

// ... (AdminDashboard dan DashboardPage tidak berubah)
const AdminDashboard = () => {
    const { user } = useBooking();
    const [allSchedules, setAllSchedules] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterKelas, setFilterKelas] = useState("Semua");
    const [filterDay, setFilterDay] = useState("Semua");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await getAllSchedules();
            if (res.success) {
                setAllSchedules(res.schedules);
                setRooms(res.rooms);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleEditClick = (sch) => {
        setEditData(sch);
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        const res = await updateScheduleAction(editData.id, editData);
        if (res.success) {
            alert("Jadwal berhasil diperbarui!");
            setEditModalOpen(false);
            setAllSchedules(prev => prev.map(s => s.id === editData.id ? {...editData, room: rooms.find(r => r.id === editData.roomId)} : s));
        } else {
            alert("Gagal update.");
        }
    };

    const filteredSchedules = allSchedules.filter(s => {
        return (filterKelas === "Semua" || s.kelas === filterKelas) &&
               (filterDay === "Semua" || s.hari === filterDay);
    });

    const uniqueClasses = [...new Set(allSchedules.map(s => s.kelas))].sort();

    return (
        <div className="animate-fade-in pb-20">
            {editModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <h3 className="font-bold text-xl mb-4 text-slate-800 flex items-center gap-2"><Edit3 size={20}/> Edit Jadwal Paten</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Mata Kuliah</label><input className="w-full border p-2 rounded" value={editData.mataKuliah} onChange={e => setEditData({...editData, mataKuliah: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Dosen</label><input className="w-full border p-2 rounded" value={editData.dosen} onChange={e => setEditData({...editData, dosen: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Hari</label><select className="w-full border p-2 rounded" value={editData.hari} onChange={e => setEditData({...editData, hari: e.target.value})}>{['SENIN','SELASA','RABU','KAMIS','JUMAT'].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Ruangan</label><select className="w-full border p-2 rounded" value={editData.roomId} onChange={e => setEditData({...editData, roomId: e.target.value})}>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Jam Mulai</label><input type="time" className="w-full border p-2 rounded" value={editData.jamMulai} onChange={e => setEditData({...editData, jamMulai: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Jam Selesai</label><input type="time" className="w-full border p-2 rounded" value={editData.jamSelesai} onChange={e => setEditData({...editData, jamSelesai: e.target.value})} /></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Batal</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Admin Dashboard</h2>
                <p className="text-slate-500 text-sm mb-6">Kelola Jadwal Paten Perkuliahan (Master Schedule).</p>
                <div className="flex flex-wrap gap-4 items-end">
                    <div><label className="block text-xs font-bold text-slate-400 mb-1">Filter Kelas</label><select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="border p-2 rounded-lg text-sm font-bold text-slate-700 min-w-[150px]"><option value="Semua">Semua Kelas</option>{uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-400 mb-1">Filter Hari</label><select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="border p-2 rounded-lg text-sm font-bold text-slate-700 min-w-[150px]"><option value="Semua">Semua Hari</option>{['SENIN','SELASA','RABU','KAMIS','JUMAT'].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                {loading ? <div className="p-10 text-center text-slate-400">Memuat data...</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-800 text-white uppercase text-xs font-bold">
                                <tr><th className="p-4">Kelas</th><th className="p-4">Hari/Jam</th><th className="p-4">Mata Kuliah</th><th className="p-4">Ruang</th><th className="p-4 text-center">Aksi</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSchedules.map(sch => (
                                    <tr key={sch.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-emerald-600">{sch.kelas} <br/><span className="text-slate-400 text-[10px] font-normal uppercase">{sch.major}</span></td>
                                        <td className="p-4"><span className="font-bold text-slate-700 block">{sch.hari}</span><span className="text-xs text-slate-500">{sch.jamMulai} - {sch.jamSelesai}</span></td>
                                        <td className="p-4"><div className="font-bold text-slate-800">{sch.mataKuliah}</div><div className="text-xs text-slate-500">{sch.dosen}</div></td>
                                        <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold border border-slate-200">{sch.room?.name}</span></td>
                                        <td className="p-4 text-center"><button onClick={() => handleEditClick(sch)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit3 size={18}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardPage = ({ onChangePage }) => {
  const { user, points, schedules, cancelSchedule, myBookings, cancelBooking, dashboardDate, setDashboardDate, checkAvailability } = useBooking();
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const weekDays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  
  // =========================================================================
  // BARU: Helper untuk menghitung tanggal spesifik dalam minggu yang dipilih
  // =========================================================================
  const getDayOffset = (dayName) => {
    const dayMap = { 'SENIN': 1, 'SELASA': 2, 'RABU': 3, 'KAMIS': 4, 'JUMAT': 5 };
    const selectedDate = new Date(dashboardDate);
    
    // Temukan hari Senin (hari pertama yang kita tampilkan) dari tanggal yang dipilih.
    // getDay() mengembalikan 0=Minggu, 1=Senin, dst.
    const dayOfWeek = selectedDate.getDay();
    const startOfWeek = new Date(selectedDate);
    // Jika tanggal yang dipilih adalah SENIN (dayOfWeek=1), offsetnya 0. 
    // Jika SELASA (dayOfWeek=2), offsetnya -1.
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
    startOfWeek.setDate(selectedDate.getDate() + offset);

    // Hitung tanggal untuk hari jadwal yang sebenarnya
    const targetDayIndex = dayMap[dayName];
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + (targetDayIndex - 1));

    return targetDate.toISOString().split('T')[0];
  };

  // =========================================================================
  // REVISI isSchedulePast: Kini menerima dayName dan timeSelesaiStr
  // =========================================================================
  const isSchedulePast = (dayName, timeSelesaiStr) => {
      // 1. Dapatkan tanggal kalender spesifik untuk jadwal ini (mis. 2025-12-02)
      const scheduleDateStr = getDayOffset(dayName);
      
      // 2. Gabungkan Tanggal Spesifik + Jam Selesai
      const scheduleEndDatetime = new Date(scheduleDateStr + 'T' + timeSelesaiStr + ':00');
      const now = new Date();

      // Membandingkan Scheduled End Time dengan waktu saat ini (now)
      return scheduleEndDatetime <= now;
  };

  // LOGIKA LAMA (BOOKING)
  const isBookingPast = (date, startTimeStr) => {
      const bookingStartDatetime = new Date(date + 'T' + startTimeStr + ':00');
      const now = new Date();
      return bookingStartDatetime < now;
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
              <br/>Tindakan ini akan mengembalikan/menambah Poin SKS Anda.
          </p>
      </Modal>

      <QuickCheckModal isOpen={showQuickCheck} onClose={() => setShowQuickCheck(false)} onCheck={checkAvailability} />

      {/* HERO SECTION */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl h-48 sm:h-56 group">
          <img src="/IMG-20251127-WA0013.jpg" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Hero"/>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-800/70 to-emerald-600/30"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <div className="text-emerald-100 font-bold text-xs uppercase tracking-widest mb-1">Saldo Poin Anda</div>
              <div className="text-5xl font-extrabold text-white tracking-tight mb-6">{points} <span className="text-2xl font-medium text-emerald-200">SKS</span></div>
              
              <div className="flex gap-3">
                  <button onClick={() => onChangePage('booking')} disabled={points === 0} className="bg-white text-emerald-800 px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-50 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                      <PlusCircle size={18}/> Booking Ruang
                  </button>
                  <button onClick={() => setShowQuickCheck(true)} className="bg-emerald-900/40 backdrop-blur-md text-white border border-white/30 px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-900/60 flex items-center gap-2 transition-all">
                      <Search size={18}/> Cek Ketersediaan
                  </button>
              </div>
          </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-2">
          <h3 className="font-extrabold text-2xl text-slate-800 flex items-center gap-2">Jadwal Kuliah Mingguan</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-2 shadow-sm">
              <div className="px-3 py-1.5 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 uppercase tracking-wide">Pilih Minggu</div>
              <input type="date" value={dashboardDate} onChange={(e) => setDashboardDate(e.target.value)} className="text-sm font-bold text-slate-800 bg-transparent outline-none pr-2 cursor-pointer"/>
          </div>
      </div>

      {/* TABEL JADWAL MINGGUAN (DENGAN HEADER HIJAU) */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            {/* HEADER WARNA EMERALD */}
            <thead className="bg-emerald-600 text-white uppercase text-xs font-bold tracking-wider">
                <tr>
                <th className="p-4 w-24">Hari</th>
                <th className="p-4 w-32">Jam</th>
                <th className="p-4">Mata Kuliah</th>
                <th className="p-4 w-32">Ruang</th>
                <th className="p-4 w-24 text-center">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {weekDays.map(day => {
                const daySchedules = (schedules || []).filter(s => s.hari === day);
                if (daySchedules.length === 0) return null;

                return daySchedules.map((sch, index) => {
                    // MENGGUNAKAN LOGIKA BARU isSchedulePast
                    const isPast = isSchedulePast(day, sch.jamSelesai); 
                    const isCancelled = sch.status === 'cancelled';
                    return (
                    <tr key={sch.id} className={`transition-colors hover:bg-emerald-50/30 ${isCancelled ? 'bg-red-50/50' : ''}`}>
                        {index === 0 && (
                            <td rowSpan={daySchedules.length} className="p-4 font-extrabold text-slate-700 bg-slate-50 border-r border-slate-100 align-top">{day}</td>
                        )}
                        <td className="p-4 font-mono font-bold text-slate-500">{sch.jamMulai} - {sch.jamSelesai}</td>
                        <td className="p-4">
                            <div className={`font-bold text-base ${isCancelled ? 'opacity-50 line-through text-slate-500' : 'text-slate-800'}`}>{sch.mataKuliah}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{sch.dosen}</div>
                            {isCancelled && <span className="inline-block mt-1 text-red-600 text-[10px] font-bold uppercase bg-red-100 px-2 py-0.5 rounded">Dibatalkan</span>}
                            {isPast && !isCancelled && <span className="inline-block mt-1 text-slate-400 text-[10px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded ml-2">Berlalu</span>}
                        </td>
                        <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${isCancelled ? 'bg-white text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                {sch.room?.name || sch.roomId}
                            </span>
                        </td>
                        <td className="p-4 text-center">
                        {isCancelled ? (
                            <button disabled className="text-slate-300 cursor-not-allowed"><LogOut size={18} /></button>
                        ) : isPast ? (
                            <span className="text-slate-300 cursor-not-allowed" title="Sudah berlalu"><Lock size={18} className="mx-auto"/></span>
                        ) : (
                            <button onClick={() => setModalData({ isOpen: true, type: 'cancel_schedule', data: sch })} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-red-100">
                                Cancel
                            </button>
                        )}
                        </td>
                    </tr>
                    );
                });
                })}
            </tbody>
            </table>
        </div>
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
                           {/* Menggunakan isBookingPast yang benar */}
                           {b.status === 'TERKONFIRMASI' && !isBookingPast(b.date, b.startTime) && (
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
      
      // VALIDASI WAKTU BOOKING
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
                  <input type="date" className="w-full p-4 bg-gray-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jam Mulai</label>
                    <input type="time" className="w-full p-4 bg-gray-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Durasi</label>
                    <div className="relative">
                        <select className="w-full p-4 bg-gray-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none transition-all" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                            <option value={1}>1 Jam</option><option value={2}>2 Jam</option><option value={3}>3 Jam</option>
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none text-slate-400"><Layers size={20}/></div>
                    </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4">
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
            <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-md text-slate-800 p-3 rounded-full shadow-2xl flex items-center gap-4 w-fit mx-auto mb-8 border border-slate-200 px-6">
                 <Timer className="text-emerald-600" size={24} />
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
                  <button key={floor} onClick={() => setSelectedFloor(floor)} className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm whitespace-nowrap ${selectedFloor === floor ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
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

// =========================================================================
// Halaman Login Baru (Revisi Estetika Maskot dan Teks)
// =========================================================================

const LoginHero = () => {
    return (
        <div className="relative h-full w-full p-8 md:p-12 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl">
            {/* Animasi Background (Minimalis/Berani) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" style={{stopColor: "rgba(255,255,255,0.2)"}} />
                            <stop offset="100%" style={{stopColor: "rgba(255,255,255,0)"}} />
                        </radialGradient>
                    </defs>
                    <rect width="100" height="100" fill="url(#grad)" />
                    <circle cx="20" cy="80" r="10" fill="rgba(255,255,255,0.15)" />
                    <circle cx="80" cy="30" r="15" fill="rgba(255,255,255,0.1)" />
                </svg>
            </div>
            
            {/* Maskot dengan Animasi */}
            {/* REVISI: Kecepatan animasi idle (Floating) dipercepat dari 6s menjadi 3.5s */}
            {/* REVISI: Menghapus border dan shadow keras pada maskot */}
            <style jsx global>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(50px) scale(0.8); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes floating {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .maskot-animated {
                    /* Animasi Idle dipercepat dari 6s menjadi 3.5s */
                    animation: slideIn 1s ease-out forwards, floating 3.5s ease-in-out infinite 1s;
                    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3)); /* Menambah kesan 3D (Drop Shadow) */
                }
            `}</style>

            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                <img 
                    src="/maskot reservefy.png" 
                    alt="Maskot Reservefy" 
                    className="w-4/5 h-auto object-contain maskot-animated cursor-pointer transition-transform duration-300 hover:scale-105"
                    // REVISI: Menghapus rounded-full, border, dan shadow box yang kaku
                    // Animasi Interaktif: merespons hover
                    onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
                    onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
                    style={{ animationDelay: '0.3s' }}
                />
                <h1 className="text-3xl font-extrabold mt-8 text-white tracking-tight drop-shadow-md">Selamat Datang di Reservefy</h1>
                {/* REVISI: Menghapus tulisan bertele-tele */}
                <p className="text-emerald-100 text-sm max-w-xs text-center font-semibold">
                    Sistem Booking Ruangan Berbasis Poin SKS.
                </p>
            </div>
        </div>
    );
}

const LoginForm = () => {
    const { login, authError, isLoading } = useBooking();
    const [nim, setNim] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="w-full max-w-md p-8 md:p-12">
            <div className="text-center mb-10">
                <div className="flex justify-center mx-auto mb-4">
                    {/* Logo Reservefy diperbesar */}
                    <img src="/logo reservefy.png" alt="Reservefy Logo" className="w-56 h-auto object-contain drop-shadow-md"/>
                </div>
                <h2 className="text-xl font-bold text-slate-700 mt-4">Masuk ke Akun Anda</h2>
                {/* REVISI: Menghapus referensi SIAKAD */}
                <p className="text-sm text-slate-500">Gunakan NIM dan Password Akun Reservefy Anda.</p>
            </div>

            {authError && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-pulse font-medium"><AlertCircle size={16} /> {authError}</div>}
            
            <form onSubmit={(e) => { e.preventDefault(); if(nim && password) login(nim, password); }} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">NIM / Username</label>
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input type="text" value={nim} onChange={(e) => setNim(e.target.value)} className="w-full pl-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" placeholder="Masukkan NIM" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" placeholder="••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4">
                    {isLoading ? 'Memproses...' : 'Masuk'}
                </button>
            </form>
            
            {/* Keterangan Login dan Link Bantuan */}
            <div className="mt-8 text-center pt-6 border-t border-slate-100 space-y-3">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Jika Anda memiliki kendala login atau membutuhkan akun baru, silakan hubungi Admin Akademik.
                </p>
                <div className="flex justify-center gap-4">
                    <a href="mailto:admin@reservefy.uin.ac.id" className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors">
                        <MessageSquare size={16}/> Email Admin
                    </a>
                    <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 text-sm font-bold flex items-center gap-1 transition-colors">
                        <Phone size={16}/> WhatsApp Admin
                    </a>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold pt-4">Powered by FAHAM Team</p>
            </div>
        </div>
    );
}

const LoginPage = () => {
    return (
        // Mengubah layout utama menjadi Flex/Grid 2 kolom di layar besar
        <div className="min-h-screen flex items-center justify-center font-sans bg-gray-50 p-4">
            <div className="relative z-10 w-full max-w-6xl h-[650px] flex rounded-3xl overflow-hidden shadow-2xl shadow-slate-300 border border-white/50 animate-fade-in-up">
                
                {/* Kolom Kiri (50/50 - Maskot & Background Gradasi) */}
                <div className="hidden md:flex md:w-1/2">
                    <LoginHero />
                </div>

                {/* Kolom Kanan (50/50 - Form Login) */}
                <div className="w-full md:w-1/2 flex items-center justify-center bg-white/95">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
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
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage('dashboard')}>
            <img src="/logo reservefy.png" alt="Reservefy Logo" className="h-10 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform"/>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block leading-tight">
                <div className="text-sm font-bold text-slate-800">{user.name}</div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-0.5 uppercase tracking-wide">{user.major} {user.role === 'ADMIN' && '(ADMIN)'}</div>
            </div>
            <button onClick={logout} className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-400 transition-colors" title="Logout"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-4 mt-6 flex-grow w-full">
        {user.role === 'ADMIN' ? (
            <AdminDashboard />
        ) : (
            <>
                {currentPage === 'dashboard' && <DashboardPage onChangePage={setCurrentPage} />}
                {currentPage === 'booking' && <BookingFlow onChangePage={setCurrentPage} />}
            </>
        )}
      </main>
      
      <footer className="py-8 text-center border-t border-slate-200 mt-auto bg-white">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Created by</p>
          <p className="text-slate-800 font-extrabold text-sm">FAHAM Team © 2025</p>
      </footer>
    </div>
  );
}