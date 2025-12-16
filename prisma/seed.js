// prisma/seed.js
require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  // 1. BERSIHKAN DATA LAMA
  await prisma.booking.deleteMany()
  await prisma.classCancellation.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.user.deleteMany()
  await prisma.room.deleteMany()
  
  console.log('🗑️  Database dibersihkan.')

  // 2. DATA RUANGAN
  const rooms = [
    { id: 'A-201', name: 'A-201', floor: 2, capacity: 40, type: 'Classroom' },
    { id: 'A-202', name: 'A-202', floor: 2, capacity: 30, type: 'Classroom' },
    { id: 'A-203', name: 'A-203', floor: 2, capacity: 30, type: 'Classroom' },
    { id: 'A-204', name: 'A-204', floor: 2, capacity: 30, type: 'Classroom' },
    { id: 'A-205', name: 'A-205', floor: 2, capacity: 30, type: 'Classroom' },
    { id: 'A-301', name: 'A-301', floor: 3, capacity: 30, type: 'Classroom' },
    { id: 'A-302', name: 'A-302', floor: 3, capacity: 30, type: 'Classroom' },
    { id: 'A-303', name: 'A-303', floor: 3, capacity: 30, type: 'Classroom' },
    { id: 'A-304', name: 'A-304', floor: 3, capacity: 30, type: 'Classroom' },
    { id: 'Lab-401', name: 'Lab-401', floor: 4, capacity: 25, type: 'Laboratorium' },
    { id: 'Lab-402', name: 'Lab-402', floor: 4, capacity: 25, type: 'Laboratorium' },
    { id: 'Lab-403', name: 'Lab-403', floor: 4, capacity: 25, type: 'Laboratorium' },
    { id: 'Lab-404', name: 'Lab-404', floor: 4, capacity: 25, type: 'Laboratorium' },
  ]

  for (const r of rooms) {
    await prisma.room.create({ data: r })
  }
  console.log('✅ Rooms created.')

  // 3. CREATE USERS (USERNAME = PASSWORD = KODE KELAS)
  const users = [
    { nim: "sdt3a", name: "SDT 3A", kelas: "3A", major: "Sains Data", role: "STUDENT" },
    { nim: "sdt1a", name: "SDT 1A", kelas: "1A", major: "Sains Data", role: "STUDENT" },
    { nim: "sdt5a", name: "SDT 5A", kelas: "5A", major: "Sains Data", role: "STUDENT" },
    { nim: "tpg1b", name: "TPG 1B", kelas: "1B", major: "Teknologi Pangan", role: "STUDENT" },
    { nim: "tpg5a", name: "TPG 5A", kelas: "5A", major: "Teknologi Pangan", role: "STUDENT" },
    { nim: "ilk5a", name: "ILK 5A", kelas: "5A", major: "Ilmu Lingkungan", role: "STUDENT" },
    { nim: "ilk3a", name: "ILK 3A", kelas: "3A", major: "Ilmu Lingkungan", role: "STUDENT" },
    { nim: "bio3a", name: "BIO 3A", kelas: "3A", major: "Biologi", role: "STUDENT" },
    { nim: "bio5a", name: "BIO 5A", kelas: "5A", major: "Biologi", role: "STUDENT" },
    { nim: "inf1a", name: "INF 1A", kelas: "1A", major: "Informatika", role: "STUDENT" },
    { nim: "admin", name: "Super Admin", kelas: "-", major: "Staff Akademik", role: "ADMIN" }
  ]

  for (const u of users) {
    await prisma.user.create({
      data: { 
        ...u, 
        password: u.nim // Password disamakan dengan username
      }
    })
  }
  console.log(`✅ Users created.`)

  // 4. JADWAL FULL
  const schedules = [
    { mataKuliah: "Metode Numerik", kelas: "3A", major: "Sains Data", roomId: "A-202", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Fuad Luky A., M.Pd.", sks: 3 },
    { mataKuliah: "Visualisasi Data", kelas: "3A", major: "Sains Data", roomId: "A-202", hari: "SENIN", jamMulai: "09:30", jamSelesai: "12:00", dosen: "Rizky K., M.Si.", sks: 3 },
    { mataKuliah: "R untuk Sains Data", kelas: "3A", major: "Sains Data", roomId: "A-203", hari: "SENIN", jamMulai: "15:00", jamSelesai: "17:30", dosen: "Dr. Aji Joko B.P.", sks: 3 },
    { mataKuliah: "Teori Peluang", kelas: "3A", major: "Sains Data", roomId: "A-204", hari: "SELASA", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Zulfanita D.R., M.Si.", sks: 3 },
    { mataKuliah: "Analisis Regresi", kelas: "3A", major: "Sains Data", roomId: "A-204", hari: "SELASA", jamMulai: "09:30", jamSelesai: "12:00", dosen: "Zulfanita D.R., M.Si.", sks: 3 },
    { mataKuliah: "Pemrograman Web", kelas: "3A", major: "Sains Data", roomId: "Lab-402", hari: "RABU", jamMulai: "08:40", jamSelesai: "11:20", dosen: "Moch Bagoes P., S.Kom.", sks: 3 },
    { mataKuliah: "Metode Penelitian", kelas: "3A", major: "Sains Data", roomId: "A-205", hari: "RABU", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Dr. Aji Joko B.P.", sks: 2 },
    { mataKuliah: "Kecerdasan Buatan", kelas: "3A", major: "Sains Data", roomId: "Lab-402", hari: "KAMIS", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Febrianta S.N., M.Kom.", sks: 3 },
    { mataKuliah: "Analisis Multivariat", kelas: "3A", major: "Sains Data", roomId: "A-201", hari: "JUMAT", jamMulai: "08:00", jamSelesai: "10:30", dosen: "Rizky K., M.Si.", sks: 3 },
    { mataKuliah: "Statistika", kelas: "1A", major: "Sains Data", roomId: "A-202", hari: "SENIN", jamMulai: "12:30", jamSelesai: "15:00", dosen: "Zulfanita D.R., M.Si.", sks: 3 },
    { mataKuliah: "Kimia Dasar", kelas: "1A", major: "Sains Data", roomId: "Lab-403", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Anang A.L., M.Eng.", sks: 2 },
    { mataKuliah: "Fisika Dasar", kelas: "1A", major: "Sains Data", roomId: "Lab-404", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Reno N., M.Pd.", sks: 2 },
    { mataKuliah: "Kalkulus 1", kelas: "1A", major: "Sains Data", roomId: "A-201", hari: "SELASA", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Isnan N., M.Kom.", sks: 3 },
    { mataKuliah: "Logika Matematika", kelas: "1A", major: "Sains Data", roomId: "A-201", hari: "SELASA", jamMulai: "10:00", jamSelesai: "11:40", dosen: "Isnan N., M.Kom.", sks: 2 },
    { mataKuliah: "Pengantar Sains Data", kelas: "1A", major: "Sains Data", roomId: "A-301", hari: "RABU", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Febrianta S.N., M.Kom.", sks: 2 },
    { mataKuliah: "Bahasa Indonesia", kelas: "1A", major: "Sains Data", roomId: "A-304", hari: "KAMIS", jamMulai: "10:00", jamSelesai: "11:40", dosen: "Tim Dosen MKU", sks: 2 },
    { mataKuliah: "Pancasila", kelas: "1A", major: "Sains Data", roomId: "A-304", hari: "JUMAT", jamMulai: "08:00", jamSelesai: "09:40", dosen: "Dr. Supriyanto", sks: 2 },
    { mataKuliah: "Pemodelan Sistem", kelas: "5A", major: "Sains Data", roomId: "A-204", hari: "SENIN", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Febrianta S.N., M.Kom.", sks: 2 },
    { mataKuliah: "Praktikum Media Kom", kelas: "5A", major: "Sains Data", roomId: "Lab-402", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:50", dosen: "Febrianta S.N., M.Kom.", sks: 1 },
    { mataKuliah: "Rekayasa Perangkat Lunak", kelas: "5A", major: "Sains Data", roomId: "A-205", hari: "SELASA", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Tigus J.B., M.Kom.", sks: 2 },
    { mataKuliah: "Metode Penelitian", kelas: "5A", major: "Sains Data", roomId: "A-205", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Dr. Aji Joko B.P.", sks: 4 },
    { mataKuliah: "Ekonometrika", kelas: "5A", major: "Sains Data", roomId: "A-205", hari: "SELASA", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Zulfanita D.R., M.Si.", sks: 2 },
    { mataKuliah: "Data Mining", kelas: "5A", major: "Sains Data", roomId: "Lab-402", hari: "RABU", jamMulai: "09:00", jamSelesai: "11:30", dosen: "Rizky K., M.Si.", sks: 3 },
    { mataKuliah: "Machine Learning", kelas: "5A", major: "Sains Data", roomId: "Lab-402", hari: "KAMIS", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Febrianta S.N., M.Kom.", sks: 3 },
    { mataKuliah: "Statistika", kelas: "1B", major: "Teknologi Pangan", roomId: "A-202", hari: "SENIN", jamMulai: "15:00", jamSelesai: "17:30", dosen: "Zulfanita D.R., M.Si.", sks: 3 },
    { mataKuliah: "Kimia Dasar", kelas: "1B", major: "Teknologi Pangan", roomId: "A-203", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Faida Zuhria, S.T.M.Eng.", sks: 2 },
    { mataKuliah: "Fisika Dasar", kelas: "1B", major: "Teknologi Pangan", roomId: "A-203", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Yesi Ihdina F., M.Farm.", sks: 2 },
    { mataKuliah: "Biologi Dasar", kelas: "1B", major: "Teknologi Pangan", roomId: "A-204", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Angga Dwi P., M.Biotech.", sks: 2 },
    { mataKuliah: "Biologi Umum", kelas: "1B", major: "Teknologi Pangan", roomId: "A-205", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Ika Feni S., M.Sc.", sks: 2 },
    { mataKuliah: "Biodiversitas", kelas: "1B", major: "Teknologi Pangan", roomId: "A-303", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Dicka Wahyu S., S.Si.", sks: 2 },
    { mataKuliah: "Pengantar Tekpang", kelas: "1B", major: "Teknologi Pangan", roomId: "A-302", hari: "RABU", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Wulan Suci W., M.Sc.", sks: 2 },
    { mataKuliah: "Matematika Dasar", kelas: "1B", major: "Teknologi Pangan", roomId: "A-301", hari: "KAMIS", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Isnan N., M.Kom.", sks: 2 },
    { mataKuliah: "Metabolisme Pangan", kelas: "5A", major: "Teknologi Pangan", roomId: "Lab-402", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Wulan Suci W., M.Sc.", sks: 3 },
    { mataKuliah: "Teknologi Minyak", kelas: "5A", major: "Teknologi Pangan", roomId: "A-301", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Wulan Suci W., M.Sc.", sks: 2 },
    { mataKuliah: "Rekayasa Proses", kelas: "5A", major: "Teknologi Pangan", roomId: "Lab-403", hari: "SELASA", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Sadewa Aziz D., M.Sc.", sks: 2 },
    { mataKuliah: "Keamanan Pangan", kelas: "5A", major: "Teknologi Pangan", roomId: "A-202", hari: "RABU", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Faida Zuhria, M.Eng.", sks: 2 },
    { mataKuliah: "Analisis Pangan", kelas: "5A", major: "Teknologi Pangan", roomId: "Lab-403", hari: "KAMIS", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Sadewa Aziz D., M.Sc.", sks: 3 },
    { mataKuliah: "Teknologi Fermentasi", kelas: "5A", major: "Teknologi Pangan", roomId: "Lab-403", hari: "JUMAT", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Sri Utami, M.Si.", sks: 3 },
    { mataKuliah: "Konservasi Energi", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Septin Puji A., Ph.D.", sks: 3 },
    { mataKuliah: "Pengelolaan SDA", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Ronnawan J., M.Si.", sks: 2 },
    { mataKuliah: "Limbah Domestik", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SENIN", jamMulai: "16:20", jamSelesai: "18:00", dosen: "Widyanti Y., M.T.", sks: 2 },
    { mataKuliah: "Biodiversitas Konservasi", kelas: "5A", major: "Ilmu Lingkungan", roomId: "A-302", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Ika Feni S., M.Sc.", sks: 2 },
    { mataKuliah: "Kewirausahaan Islami", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-402", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Ilzamha H.R., M.Sc.", sks: 2 },
    { mataKuliah: "Meteorologi", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Ronnawan J., M.Si.", sks: 2 },
    { mataKuliah: "AMDAL", kelas: "5A", major: "Ilmu Lingkungan", roomId: "A-203", hari: "RABU", jamMulai: "09:00", jamSelesai: "11:30", dosen: "Widyanti Y., M.T.", sks: 3 },
    { mataKuliah: "Hukum Lingkungan", kelas: "5A", major: "Ilmu Lingkungan", roomId: "A-304", hari: "KAMIS", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Tim Dosen Hukum", sks: 2 },
    { mataKuliah: "Lab Lingkungan", kelas: "3A", major: "Ilmu Lingkungan", roomId: "A-301", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Purwono, M.Si.", sks: 2 },
    { mataKuliah: "Eksplorasi SDA", kelas: "3A", major: "Ilmu Lingkungan", roomId: "A-301", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Angga Dwi P., M.Biotech.", sks: 2 },
    { mataKuliah: "Konservasi Alam Islam", kelas: "3A", major: "Ilmu Lingkungan", roomId: "A-302", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Ika Feni S., M.Sc.", sks: 2 },
    { mataKuliah: "Hidrologi", kelas: "3A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Ronnawan J., M.Si.", sks: 2 },
    { mataKuliah: "Ekologi", kelas: "3A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "RABU", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Purwono, M.Si.", sks: 3 },
    { mataKuliah: "Klimatologi Dasar", kelas: "3A", major: "Ilmu Lingkungan", roomId: "A-204", hari: "KAMIS", jamMulai: "10:00", jamSelesai: "11:40", dosen: "Ronnawan J., M.Si.", sks: 2 },
    { mataKuliah: "Bioteknologi Pangan", kelas: "3A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Faizal Jannu A.S.", sks: 2 },
    { mataKuliah: "Instrumen Biotek", kelas: "3A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Dicka Wahyu S., M.Si.", sks: 2 },
    { mataKuliah: "Kimia Bioanalisis", kelas: "3A", major: "Biologi", roomId: "A-303", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Dini Achnafani, M.Si.", sks: 2 },
    { mataKuliah: "Biokimia", kelas: "3A", major: "Biologi", roomId: "A-303", hari: "SELASA", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Dicka Wahyu S., M.Si.", sks: 2 },
    { mataKuliah: "Teknologi BioProses", kelas: "3A", major: "Biologi", roomId: "A-303", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Sri Utami, M.Si.", sks: 2 },
    { mataKuliah: "Genetika", kelas: "3A", major: "Biologi", roomId: "A-205", hari: "RABU", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Dini Achnafani, M.Si.", sks: 3 },
    { mataKuliah: "Mikrobiologi", kelas: "3A", major: "Biologi", roomId: "Lab-403", hari: "KAMIS", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Faizal Jannu A.S.", sks: 3 },
    { mataKuliah: "Regulasi Biotek", kelas: "5A", major: "Biologi", roomId: "A-301", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Angga Dwi P., M.Biotech.", sks: 2 },
    { mataKuliah: "Rekayasa Genetika", kelas: "5A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Sri Utami, M.Si.", sks: 2 },
    { mataKuliah: "DNA Forensik", kelas: "5A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Dicka Wahyu S., M.Si.", sks: 2 },
    { mataKuliah: "Protein Engineering", kelas: "5A", major: "Biologi", roomId: "A-304", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Faizal Jannu A.S.", sks: 2 },
    { mataKuliah: "Teknologi Antibodi", kelas: "5A", major: "Biologi", roomId: "A-304", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Dini Achnafani, M.Si.", sks: 2 },
    { mataKuliah: "Bioinformatika", kelas: "5A", major: "Biologi", roomId: "Lab-402", hari: "RABU", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Febrianta S.N., M.Kom.", sks: 3 },
    { mataKuliah: "Kultur Jaringan", kelas: "5A", major: "Biologi", roomId: "Lab-401", hari: "KAMIS", jamMulai: "08:40", jamSelesai: "11:20", dosen: "Sri Utami, M.Si.", sks: 3 },
    { mataKuliah: "Matematika", kelas: "1A", major: "Informatika", roomId: "A-201", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Isnan N., M.Kom.", sks: 2 },
    { mataKuliah: "Fisika Dasar", kelas: "1A", major: "Informatika", roomId: "Lab-404", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Moch Bagoes P., S.Kom.", sks: 2 },
    { mataKuliah: "Kimia Dasar", kelas: "1A", major: "Informatika", roomId: "Lab-404", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Anang A.L., M.Eng.", sks: 2 },
    { mataKuliah: "Algoritma Pemrograman", kelas: "1A", major: "Informatika", roomId: "Lab-402", hari: "SELASA", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Tigus J.B., M.Kom.", sks: 3 },
    { mataKuliah: "Pengantar TI", kelas: "1A", major: "Informatika", roomId: "A-201", hari: "RABU", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Febrianta S.N., M.Kom.", sks: 2 },
    { mataKuliah: "Bahasa Inggris", kelas: "1A", major: "Informatika", roomId: "A-303", hari: "KAMIS", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Tim Bahasa", sks: 2 },
    { mataKuliah: "Pancasila", kelas: "1A", major: "Informatika", roomId: "A-304", hari: "JUMAT", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Dr. Supriyanto", sks: 2 }
  ]

  for (const s of schedules) {
    await prisma.schedule.create({ data: s })
  }
  console.log(`✅ ${schedules.length} Real Schedules created.`)

  console.log('🏁 Seeding finished successfully. Database is ready!')
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect() })