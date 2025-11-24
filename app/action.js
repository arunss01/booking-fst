"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. LOGIN
export async function loginUser(nim, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { nim },
    });

    if (user && user.password === password) {
      // Jangan kirim password kembali ke frontend
      const { password, ...userData } = user;
      return { success: true, user: userData };
    }
    return { success: false, message: "NIM atau Password salah." };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

// 2. AMBIL DATA AWAL (Saat Dashboard dimuat)
export async function getInitialData(userId, userKelas, userMajor) {
  try {
    // Ambil data user terbaru (untuk poin)
    const userData = await prisma.user.findUnique({ where: { id: userId } });

    // Ambil Jadwal Kuliah User (Sesuai Kelas & Jurusan)
    const schedules = await prisma.schedule.findMany({
      where: { 
        kelas: userKelas,
        major: userMajor
      },
      include: { room: true },
      orderBy: { jamMulai: 'asc' }
    });

    // Ambil History Booking User
    const myBookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return { 
      success: true, 
      points: userData.points, 
      schedules, 
      myBookings 
    };
  } catch (error) {
    console.error("Fetch Data Error:", error);
    return { success: false };
  }
}

// 3. CANCEL JADWAL KULIAH
export async function cancelScheduleAction(userId, scheduleId, sks) {
  try {
    // Update status jadwal menjadi cancelled
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'cancelled' }
    });

    // Tambah Poin User
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: sks } }
    });

    revalidatePath('/'); // Refresh data
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 4. CANCEL BOOKING RUANGAN
export async function cancelBookingAction(userId, bookingId, duration) {
  try {
    // Ubah status booking
    await prisma.booking.update({
      where: { bookingId: bookingId }, // Pastikan schema pakai bookingId sebagai unique atau cari by ID
      data: { status: 'DIBATALKAN' }
    });

    // Refund Poin
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

// 5. CEK KETERSEDIAAN RUANGAN (Complex Logic)
export async function checkRoomAvailabilityAction(date, startTimeStr, duration) {
  try {
    // Konversi waktu request ke menit
    const timeToMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    
    const reqStart = timeToMinutes(startTimeStr);
    const reqEnd = reqStart + (duration * 60);

    // Ambil semua ruangan
    const allRooms = await prisma.room.findMany();

    // Tentukan Hari (SENIN, SELASA, dll) dari tanggal yang dipilih
    const dateObj = new Date(date);
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const dayName = days[dateObj.getDay()];

    // Ambil semua jadwal kuliah AKTIF di hari itu
    const activeSchedules = await prisma.schedule.findMany({
      where: { 
        hari: dayName,
        status: 'active'
      }
    });

    // Ambil semua Booking orang lain di tanggal itu yang STATUSNYA TERKONFIRMASI
    const activeBookings = await prisma.booking.findMany({
      where: { 
        date: date,
        status: 'TERKONFIRMASI'
      }
    });

    // LOGIKA FILTERING
    const results = allRooms.map(room => {
      let isAvailable = true;
      let conflictReason = "";

      // A. Cek Tabrakan dengan Jadwal Kuliah
      const classConflict = activeSchedules.find(sch => {
        // Cek ID Room atau Nama Room (fuzzy match)
        if (sch.roomId !== room.id) return false;

        const schStart = timeToMinutes(sch.jamMulai);
        const schEnd = timeToMinutes(sch.jamSelesai);
        
        // Logika overlap waktu
        return (reqStart < schEnd && reqEnd > schStart);
      });

      if (classConflict) {
        isAvailable = false;
        conflictReason = `Kuliah: ${classConflict.mataKuliah}`;
      }

      // B. Cek Tabrakan dengan Booking Orang Lain
      if (isAvailable) {
        const bookingConflict = activeBookings.find(b => {
          if (b.roomId !== room.id) return false;

          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);

          return (reqStart < bEnd && reqEnd > bStart);
        });

        if (bookingConflict) {
          isAvailable = false;
          conflictReason = "Sudah Dipesan";
        }
      }

      return { ...room, isAvailable, conflictReason };
    });

    return { success: true, data: results };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal mengecek ketersediaan." };
  }
}

// 6. EKSEKUSI BOOKING
export async function bookRoomAction(bookingData) {
  try {
    const { userId, roomId, roomName, floor, date, startTime, duration, userName, userMajor, userClass } = bookingData;

    // Hitung End Time
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + duration;
    const endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    // 1. Kurangi Poin
    await prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: duration } }
    });

    // 2. Buat Booking
    const newBooking = await prisma.booking.create({
      data: {
        bookingId: `BKG-${Date.now()}`, // ID Unik
        userId,
        roomId,
        roomName,
        floor,
        date,
        startTime,
        endTime,
        duration,
        status: "TERKONFIRMASI",
        // Simpan snapshot data user (sesuai schema yang kita buat)
        userName,
        userMajor,
        userClass
      }
    });

    revalidatePath('/');
    return { success: true, bookingId: newBooking.bookingId };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal melakukan booking." };
  }
}