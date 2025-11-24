require('dotenv').config(); // <--- TAMBAHKAN INI DI BARIS 1

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()


async function main() {
  console.log('🌱 Start seeding database dengan Jadwal Lengkap (Senin & Selasa)...')

  // 1. CLEAN UP (Hapus data lama)
  await prisma.booking.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.user.deleteMany()
  await prisma.room.deleteMany()
  
  console.log('🗑️  Data lama dibersihkan.')

  // 2. DATA RUANGAN (Sesuai CSV)
  const rooms = [
    // Lantai 2
    { id: 'A-201', name: 'A-201 (Seminar)', floor: 2, capacity: 40, type: 'Classroom' },
    { id: 'A-202', name: 'A-202', floor: 2, capacity: 30, type: 'Classroom' },
    { id: 'A-203', name: 'A-203', floor: 2, capacity: 30, type: 'Classroom' },
    { id: 'A-204', name: 'A-204', floor: 2, capacity: 30, type: 'Classroom' },
    { id: 'A-205', name: 'A-205', floor: 2, capacity: 30, type: 'Classroom' },
    // Lantai 3
    { id: 'A-301', name: 'A-301', floor: 3, capacity: 30, type: 'Classroom' },
    { id: 'A-302', name: 'A-302', floor: 3, capacity: 30, type: 'Classroom' },
    { id: 'A-303', name: 'A-303', floor: 3, capacity: 30, type: 'Classroom' },
    { id: 'A-304', name: 'A-304', floor: 3, capacity: 30, type: 'Classroom' },
    // Lantai 4 (Laboratorium)
    { id: 'Lab-401', name: 'Lab-401 (Lingkungan)', floor: 4, capacity: 25, type: 'Laboratorium' },
    { id: 'Lab-402', name: 'Lab-402 (Komputasi)', floor: 4, capacity: 25, type: 'Laboratorium' },
    { id: 'Lab-403', name: 'Lab-403 (Kimia/Umum)', floor: 4, capacity: 25, type: 'Laboratorium' },
    { id: 'Lab-404', name: 'Lab-404 (Fisika/Umum)', floor: 4, capacity: 25, type: 'Laboratorium' },
  ]

  for (const r of rooms) {
    await prisma.room.create({ data: r })
  }
  console.log('✅ Rooms created.')

  // 3. CREATE USERS (Perwakilan 10 Kelas)
  // Password default: 123
  const users = [
    // 1. Aruna (Sains Data 3A)
    { nim: "12345", name: "Aruna (SDT 3A)", kelas: "3A", major: "Sains Data", role: "STUDENT" },
    // 2. Fajar (Sains Data 1A)
    { nim: "10001", name: "Melani (SDT 1A)", kelas: "1A", major: "Sains Data", role: "STUDENT" },
    // 3. Galih (Sains Data 5A)
    { nim: "10002", name: "Fiya (SDT 5A)", kelas: "5A", major: "Sains Data", role: "STUDENT" },
    // 4. Budi (Teknologi Pangan 1B)
    { nim: "67890", name: "Haya (TPG 1B)", kelas: "1B", major: "Teknologi Pangan", role: "STUDENT" },
    // 5. Hana (Teknologi Pangan 5A)
    { nim: "20001", name: "Firda (TPG 5A)", kelas: "5A", major: "Teknologi Pangan", role: "STUDENT" },
    // 6. Citra (Ilmu Lingkungan 5A)
    { nim: "11223", name: "Citra (ILK 5A)", kelas: "5A", major: "Ilmu Lingkungan", role: "STUDENT" },
    // 7. Indah (Ilmu Lingkungan 3A)
    { nim: "30001", name: "Indah (ILK 3A)", kelas: "3A", major: "Ilmu Lingkungan", role: "STUDENT" },
    // 8. Dina (Biologi 3A)
    { nim: "44556", name: "Dina (BIO 3A)", kelas: "3A", major: "Biologi", role: "STUDENT" },
    // 9. Joko (Biologi 5A)
    { nim: "40001", name: "Joko (BIO 5A)", kelas: "5A", major: "Biologi", role: "STUDENT" },
    // 10. Eko (Informatika 1A)
    { nim: "77889", name: "Eko (INF 1A)", kelas: "1A", major: "Informatika", role: "STUDENT" },
    // ADMIN
    { nim: "admin", name: "Super Admin", kelas: "-", major: "Staff Akademik", role: "ADMIN", password: "admin123" }
  ]

  for (const u of users) {
    await prisma.user.create({
      data: { ...u, password: u.password || "123" } // Default pass 123
    })
  }
  console.log('✅ Users (10 Sampel Kelas) created.')

  // 4. JADWAL LENGKAP (Ekstraksi Excel Senin & Selasa)
  const schedules = [
    // --- 1. SAINS DATA 3A (Kelas Aruna) ---
    { mataKuliah: "Metode Numerik", kelas: "3A", major: "Sains Data", roomId: "A-202", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Fuad Luky Atmaja, M.Pd.", sks: 3 },
    { mataKuliah: "Visualisasi Data", kelas: "3A", major: "Sains Data", roomId: "A-202", hari: "SENIN", jamMulai: "09:30", jamSelesai: "12:00", dosen: "Rizky Kusumawardani, M.Si.", sks: 3 },
    { mataKuliah: "R untuk Sains Data", kelas: "3A", major: "Sains Data", roomId: "A-203", hari: "SENIN", jamMulai: "15:00", jamSelesai: "17:30", dosen: "Dr. Aji Joko Budi P.", sks: 3 },
    { mataKuliah: "Teori Peluang", kelas: "3A", major: "Sains Data", roomId: "A-204", hari: "SELASA", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Zulfanita Dien R., M.Si.", sks: 3 },
    { mataKuliah: "Analisis Regresi Terapan", kelas: "3A", major: "Sains Data", roomId: "A-204", hari: "SELASA", jamMulai: "09:30", jamSelesai: "12:00", dosen: "Zulfanita Dien R., M.Si.", sks: 3 },
    { mataKuliah: "Pemrograman Web", kelas: "3A", major: "Sains Data", roomId: "A-205", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Moch Bagoes Pakarti, S.Kom.", sks: 2 },

    // --- 2. SAINS DATA 1A (Kelas Fajar) ---
    { mataKuliah: "Statistika", kelas: "1A", major: "Sains Data", roomId: "A-202", hari: "SENIN", jamMulai: "12:30", jamSelesai: "15:00", dosen: "Zulfanita Dien R., M.Si.", sks: 3 },
    { mataKuliah: "Kimia Dasar", kelas: "1A", major: "Sains Data", roomId: "Lab-403", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Anang Anggono L., M.Eng.", sks: 2 },
    { mataKuliah: "Fisika Dasar", kelas: "1A", major: "Sains Data", roomId: "Lab-404", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Reno Nurdiyanto, M.Pd.", sks: 2 },

    // --- 3. SAINS DATA 5A (Kelas Galih) ---
    { mataKuliah: "Pemodelan Sistem", kelas: "5A", major: "Sains Data", roomId: "A-204", hari: "SENIN", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Febrianta Surya N., M.Kom.", sks: 2 },
    { mataKuliah: "Praktikum Media Komunikasi", kelas: "5A", major: "Sains Data", roomId: "Lab-402", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:50", dosen: "Febrianta Surya N., M.Kom.", sks: 1 },
    { mataKuliah: "Rekayasa Perangkat Lunak", kelas: "5A", major: "Sains Data", roomId: "A-205", hari: "SELASA", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Tigus Juni Betri, M.Kom.", sks: 2 },
    { mataKuliah: "Metode Penelitian Sains Data", kelas: "5A", major: "Sains Data", roomId: "A-205", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Dr. Aji Joko Budi P.", sks: 4 },
    { mataKuliah: "Ekonometrika", kelas: "5A", major: "Sains Data", roomId: "A-205", hari: "SELASA", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Zulfanita Dien R., M.Si.", sks: 2 },
    { mataKuliah: "Media Komunikasi Sains Data", kelas: "5A", major: "Sains Data", roomId: "A-301", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Febrianta Surya N., M.Kom.", sks: 2 },

    // --- 4. TEKNOLOGI PANGAN 1B (Kelas Budi) ---
    { mataKuliah: "Statistika", kelas: "1B", major: "Teknologi Pangan", roomId: "A-202", hari: "SENIN", jamMulai: "15:00", jamSelesai: "17:30", dosen: "Zulfanita Dien R., M.Si.", sks: 3 },
    { mataKuliah: "Kimia Dasar", kelas: "1B", major: "Teknologi Pangan", roomId: "A-203", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Faida Zuhria, S.T.M.Eng.", sks: 2 },
    { mataKuliah: "Fisika Dasar", kelas: "1B", major: "Teknologi Pangan", roomId: "A-203", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Yesi Ihdina F., M.Farm.", sks: 2 },
    { mataKuliah: "Biologi Dasar", kelas: "1B", major: "Teknologi Pangan", roomId: "A-204", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Angga Dwi Prasetyo, M.Biotech.", sks: 2 },
    { mataKuliah: "Biologi Umum", kelas: "1B", major: "Teknologi Pangan", roomId: "A-205", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Ika Feni Setiyaningrum, M.Sc.", sks: 2 },
    { mataKuliah: "Matematika", kelas: "1B", major: "Teknologi Pangan", roomId: "A-205", hari: "SENIN", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Isnan Nabawi, S.Pd.M.Kom.", sks: 2 },
    { mataKuliah: "Biodiversitas", kelas: "1B", major: "Teknologi Pangan", roomId: "A-303", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Dicka Wahyu Setiasari, S.Si.", sks: 2 },

    // --- 5. TEKNOLOGI PANGAN 5A (Kelas Hana) ---
    { mataKuliah: "Metabolisme Komponen Pangan", kelas: "5A", major: "Teknologi Pangan", roomId: "Lab-402", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Wulan Suci W., M.Sc.", sks: 3 },
    { mataKuliah: "Teknologi Minyak", kelas: "5A", major: "Teknologi Pangan", roomId: "A-301", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Wulan Suci W., M.Sc.", sks: 2 },
    { mataKuliah: "Praktikum Rekayasa Proses", kelas: "5A", major: "Teknologi Pangan", roomId: "Lab-403", hari: "SELASA", jamMulai: "13:00", jamSelesai: "15:30", dosen: "Sadewa Aziz D., M.Sc.", sks: 2 },

    // --- 6. ILMU LINGKUNGAN 5A (Kelas Citra) ---
    { mataKuliah: "Konservasi Energi & Energi Terbarukan", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SENIN", jamMulai: "07:00", jamSelesai: "09:30", dosen: "Septin Puji Astuti, Ph.D.", sks: 3 },
    { mataKuliah: "Pengelolaan SDA & DAS", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Ronnawan J., M.Si.", sks: 2 },
    { mataKuliah: "Pengelolaan Air Limbah Domestik", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SENIN", jamMulai: "16:20", jamSelesai: "18:00", dosen: "Widyanti Yuliandari, M.T.", sks: 2 },
    { mataKuliah: "Biodiversitas & Konservasi", kelas: "5A", major: "Ilmu Lingkungan", roomId: "A-302", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Ika Feni Setiyaningrum, M.Sc.", sks: 2 },
    { mataKuliah: "Kewirausahaan Islami", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-402", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Ilzamha Hadijah R., M.Sc.", sks: 2 },
    { mataKuliah: "Meteorologi & Klimatologi", kelas: "5A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Ronnawan J., M.Si.", sks: 2 },

    // --- 7. ILMU LINGKUNGAN 3A (Kelas Indah) ---
    { mataKuliah: "Laboratorium Lingkungan", kelas: "3A", major: "Ilmu Lingkungan", roomId: "A-301", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Purwono, S.Si., M.Si.", sks: 2 },
    { mataKuliah: "Eksplorasi Konservasi SD Lokal", kelas: "3A", major: "Ilmu Lingkungan", roomId: "A-301", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Angga Dwi Prasetyo, M.Biotech.", sks: 2 },
    { mataKuliah: "Konservasi Alam dalam Islam", kelas: "3A", major: "Ilmu Lingkungan", roomId: "A-302", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Ika Feni Setiyaningrum, M.Sc.", sks: 2 },
    { mataKuliah: "Hidrologi & Hidrogeologi", kelas: "3A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Ronnawan J., M.Si.", sks: 2 },
    { mataKuliah: "Statistika", kelas: "3A", major: "Ilmu Lingkungan", roomId: "Lab-401", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Septin Puji Astuti, Ph.D.", sks: 2 },

    // --- 8. BIOLOGI 3A (Kelas Dina) ---
    { mataKuliah: "Bioteknologi Pangan", kelas: "3A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Faizal Jannu Aryanto S.", sks: 2 },
    { mataKuliah: "Instrumentasi Bioteknologi", kelas: "3A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Dicka Wahyu S., M.Si.", sks: 2 },
    { mataKuliah: "Kimia Bioanalisis", kelas: "3A", major: "Biologi", roomId: "A-303", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Dini Achnafani, M.Si.", sks: 2 },
    { mataKuliah: "Biokimia", kelas: "3A", major: "Biologi", roomId: "A-303", hari: "SELASA", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Dicka Wahyu S., M.Si.", sks: 2 },
    { mataKuliah: "Teknologi BioProses", kelas: "3A", major: "Biologi", roomId: "A-303", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Sri Utami, M.Si.", sks: 2 },
    { mataKuliah: "Pengantar Ilmu Komputer", kelas: "3A", major: "Biologi", roomId: "A-303", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Tigus Juni Betri, M.Kom.", sks: 2 },

    // --- 9. BIOLOGI 5A (Kelas Joko) ---
    { mataKuliah: "Regulasi & Fatwa Produk Biotek", kelas: "5A", major: "Biologi", roomId: "A-301", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Angga Dwi Prasetyo, M.Biotech.", sks: 2 },
    { mataKuliah: "Rekayasa Genetika", kelas: "5A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "08:40", jamSelesai: "10:20", dosen: "Sri Utami, M.Si.", sks: 2 },
    { mataKuliah: "DNA Forensik", kelas: "5A", major: "Biologi", roomId: "A-302", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Dicka Wahyu S., M.Si.", sks: 2 },
    { mataKuliah: "Protein Engineering", kelas: "5A", major: "Biologi", roomId: "A-304", hari: "SELASA", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Faizal Jannu Aryanto S.", sks: 2 },
    { mataKuliah: "Teknologi Antibodi", kelas: "5A", major: "Biologi", roomId: "A-304", hari: "SELASA", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Dini Achnafani, M.Si.", sks: 2 },
    { mataKuliah: "Manajemen Bioindustri Pangan", kelas: "5A", major: "Biologi", roomId: "A-304", hari: "SELASA", jamMulai: "14:40", jamSelesai: "16:20", dosen: "Sri Utami, M.Si.", sks: 2 },

    // --- 10. INFORMATIKA 1A (Kelas Eko) ---
    { mataKuliah: "Matematika", kelas: "1A", major: "Informatika", roomId: "A-201", hari: "SENIN", jamMulai: "07:00", jamSelesai: "08:40", dosen: "Isnan Nabawi, M.Kom.", sks: 2 },
    { mataKuliah: "Fisika Dasar", kelas: "1A", major: "Informatika", roomId: "Lab-404", hari: "SENIN", jamMulai: "10:20", jamSelesai: "12:00", dosen: "Moch Bagoes Pakarti, S.Kom.", sks: 2 },
    { mataKuliah: "Kimia Dasar", kelas: "1A", major: "Informatika", roomId: "Lab-404", hari: "SENIN", jamMulai: "13:00", jamSelesai: "14:40", dosen: "Anang Anggono L., M.Eng.", sks: 2 },
  ]

  for (const s of schedules) {
    await prisma.schedule.create({ data: s })
  }
  console.log(`✅ ${schedules.length} Real Schedules (Senin & Selasa) created.`)

  console.log('🏁 Seeding finished successfully. Database is ready!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })