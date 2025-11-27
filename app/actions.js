"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- AUTH & DATA ---

export async function loginUser(nim, password) {
  try {
    const user = await prisma.user.findUnique({ where: { nim } });
    if (user && user.password === password) {
      const { password, ...userData } = user;
      return { success: true, user: userData };
    }
    return { success: false, message: "NIM atau Password salah." };
  } catch (error) {
    return { success: false, message: "Server Error." };
  }
}

export async function getInitialData(userId, userKelas, userMajor, dateStr) {
  try {
    const userData = await prisma.user.findUnique({ where: { id: userId } });
    
    // Ambil jadwal spesifik kelas user
    const rawSchedules = await prisma.schedule.findMany({
      where: { kelas: userKelas, major: userMajor },
      include: { 
        room: true,
        cancellations: { where: { date: dateStr } }
      },
      orderBy: { jamMulai: 'asc' }
    });

    // Mapping status jika ada cancellation di tanggal tersebut
    const processedSchedules = rawSchedules.map(sch => ({
      ...sch,
      status: sch.cancellations.length > 0 ? 'cancelled' : 'active'
    }));

    const myBookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return { 
      success: true, 
      points: userData.points, 
      schedules: processedSchedules, 
      myBookings 
    };
  } catch (error) {
    return { success: false };
  }
}

// --- KHUSUS ADMIN ---

export async function getAllSchedules() {
    try {
        const schedules = await prisma.schedule.findMany({
            include: { room: true },
            orderBy: [
                { major: 'asc' },
                { kelas: 'asc' },
                { hari: 'asc' }, 
                { jamMulai: 'asc' }
            ]
        });
        const rooms = await prisma.room.findMany();
        return { success: true, schedules, rooms };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function updateScheduleAction(scheduleId, newData) {
    try {
        await prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                mataKuliah: newData.mataKuliah,
                dosen: newData.dosen,
                roomId: newData.roomId,
                jamMulai: newData.jamMulai,
                jamSelesai: newData.jamSelesai,
                hari: newData.hari
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, message: "Gagal update jadwal." };
    }
}

// --- TRANSAKSI MAHASISWA ---

export async function cancelScheduleAction(userId, scheduleId, sks, targetDateStr) {
  try {
    // Catat tanggal merah di tabel Cancellation
    await prisma.classCancellation.create({
      data: { scheduleId: scheduleId, date: targetDateStr }
    });
    // Tambah Poin
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: sks } }
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function cancelBookingAction(userId, bookingId, duration) {
  try {
    await prisma.booking.update({
      where: { bookingId: bookingId },
      data: { status: 'DIBATALKAN' }
    });
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: duration } }
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// LOGIKA CEK KETERSEDIAAN (REVISI: Detail Konflik)
export async function checkRoomAvailabilityAction(date, startTimeStr, duration) {
  try {
    const timeToMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const reqStart = timeToMinutes(startTimeStr);
    const reqEnd = reqStart + (duration * 60);
    const allRooms = await prisma.room.findMany();
    const dateObj = new Date(date);
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const dayName = days[dateObj.getDay()];

    // Ambil jadwal Master (kecuali yang di-cancel tanggal ini)
    const masterSchedules = await prisma.schedule.findMany({
      where: { hari: dayName },
      include: { cancellations: { where: { date: date } } }
    });

    // Ambil Booking user lain yang aktif
    const activeBookings = await prisma.booking.findMany({
      where: { date: date, status: 'TERKONFIRMASI' }
    });

    const results = allRooms.map(room => {
      let isAvailable = true;
      let conflictReason = "";

      // A. Cek Konflik Jadwal Kuliah
      const classConflict = masterSchedules.find(sch => {
        if (sch.roomId !== room.id) return false;
        if (sch.cancellations.length > 0) return false; // Jika cancel, berarti kosong
        const schStart = timeToMinutes(sch.jamMulai);
        const schEnd = timeToMinutes(sch.jamSelesai);
        return (reqStart < schEnd && reqEnd > schStart);
      });

      if (classConflict) {
        isAvailable = false;
        // REVISI: Tampilkan Info Lengkap (Matkul, Kelas, Jurusan, Jam)
        conflictReason = `${classConflict.mataKuliah} (${classConflict.kelas}-${classConflict.major}) • ${classConflict.jamMulai}-${classConflict.jamSelesai}`;
      }

      // B. Cek Konflik Booking
      if (isAvailable) {
        const bookingConflict = activeBookings.find(b => {
          if (b.roomId !== room.id) return false;
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          return (reqStart < bEnd && reqEnd > bStart);
        });
        if (bookingConflict) {
          isAvailable = false;
          // REVISI: Tampilkan Info Lengkap Booking
          conflictReason = `Booked: ${bookingConflict.userName} (${bookingConflict.userClass}-${bookingConflict.userMajor}) • ${bookingConflict.startTime}-${bookingConflict.endTime}`;
        }
      }
      return { ...room, isAvailable, conflictReason };
    });
    return { success: true, data: results };
  } catch (error) {
    return { success: false, message: "Gagal cek room." };
  }
}

export async function bookRoomAction(bookingData) {
  try {
    const { userId, roomId, roomName, floor, date, startTime, duration, userName, userMajor, userClass } = bookingData;
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + duration;
    const endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    await prisma.user.update({ where: { id: userId }, data: { points: { decrement: duration } } });
    
    const newBooking = await prisma.booking.create({
      data: {
        bookingId: `BKG-${Date.now()}`, userId, roomId, roomName, floor, date, startTime, endTime, duration,
        status: "TERKONFIRMASI", userName, userMajor, userClass
      }
    });
    revalidatePath('/');
    return { success: true, bookingId: newBooking.bookingId };
  } catch (error) {
    return { success: false, message: "Gagal booking." };
  }
}