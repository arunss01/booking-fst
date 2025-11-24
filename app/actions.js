"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper: Format Date YYYY-MM-DD
const formatDate = (dateObj) => dateObj.toISOString().split('T')[0];

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

// UPDATE: Get Data sekarang butuh parameter "selectedDate"
export async function getInitialData(userId, userKelas, userMajor, selectedDateStr) {
  try {
    const userData = await prisma.user.findUnique({ where: { id: userId } });

    // 1. Ambil Jadwal Induk
    const rawSchedules = await prisma.schedule.findMany({
      where: { kelas: userKelas, major: userMajor },
      include: { 
        room: true,
        // Ambil info cancel KHUSUS untuk tanggal yang dipilih user
        cancellations: {
          where: { date: selectedDateStr }
        }
      },
      orderBy: { jamMulai: 'asc' }
    });

    // 2. Manipulasi Data: Jika ada di tabel cancellations, ubah status jadi 'cancelled' HANYA UNTUK TAMPILAN INI
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
    console.error(error);
    return { success: false };
  }
}

// UPDATE: Cancel sekarang mencatat ke tabel ClassCancellation
export async function cancelScheduleAction(userId, scheduleId, sks, targetDateStr) {
  try {
    // 1. Catat pembatalan untuk tanggal SPESIFIK ini
    await prisma.classCancellation.create({
      data: {
        scheduleId: scheduleId,
        date: targetDateStr
      }
    });

    // 2. Tambah Poin User
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


export async function checkRoomAvailabilityAction(date, startTimeStr, duration) {
  try {
    const timeToMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    
    const reqStart = timeToMinutes(startTimeStr);
    const reqEnd = reqStart + (duration * 60);

    const allRooms = await prisma.room.findMany();
    const dateObj = new Date(date);
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const dayName = days[dateObj.getDay()];

    // Ambil jadwal kuliah & booking aktif
    const masterSchedules = await prisma.schedule.findMany({
      where: { hari: dayName },
      include: { cancellations: { where: { date: date } } }
    });

    const activeBookings = await prisma.booking.findMany({
      where: { date: date, status: 'TERKONFIRMASI' }
    });

    const results = allRooms.map(room => {
      let isAvailable = true;
      let conflictReason = "";

      // A. Cek Konflik Jadwal Kuliah
      const classConflict = masterSchedules.find(sch => {
        if (sch.roomId !== room.id) return false;
        if (sch.cancellations.length > 0) return false; // Skip jika sudah dicancel

        const schStart = timeToMinutes(sch.jamMulai);
        const schEnd = timeToMinutes(sch.jamSelesai);
        return (reqStart < schEnd && reqEnd > schStart);
      });

      if (classConflict) {
        isAvailable = false;
        // REVISI: Menambahkan Jam Berlangsung agar user tahu kapan selesai
        conflictReason = `Kuliah: ${classConflict.mataKuliah} (${classConflict.jamMulai} - ${classConflict.jamSelesai})`;
      }

      // B. Cek Konflik Booking User Lain
      if (isAvailable) {
        const bookingConflict = activeBookings.find(b => {
          if (b.roomId !== room.id) return false;
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          return (reqStart < bEnd && reqEnd > bStart);
        });

        if (bookingConflict) {
          isAvailable = false;
          // REVISI: Menambahkan Jam Booking
          conflictReason = `Booking: ${bookingConflict.userName} (${bookingConflict.startTime} - ${bookingConflict.endTime})`;
        }
      }

      return { ...room, isAvailable, conflictReason };
    });

    return { success: true, data: results };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal cek room." };
  }
}


export async function bookRoomAction(bookingData) {
   // Logic sama persis dengan sebelumnya
   try {
    const { userId, roomId, roomName, floor, date, startTime, duration, userName, userMajor, userClass } = bookingData;
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + duration;
    const endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    await prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: duration } }
    });

    const newBooking = await prisma.booking.create({
      data: {
        bookingId: `BKG-${Date.now()}`,
        userId, roomId, roomName, floor, date, startTime, endTime, duration,
        status: "TERKONFIRMASI", userName, userMajor, userClass
      }
    });
    revalidatePath('/');
    return { success: true, bookingId: newBooking.bookingId };
  } catch (error) {
    return { success: false, message: "Gagal booking." };
  }
}