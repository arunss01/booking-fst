import { Inter } from "next/font/google"; // Mengganti Geist dengan Inter
import "./globals.css";

// Konfigurasi font Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Mendefinisikan variable font yang baru
});

// Metadata tanpa TypeScript syntax
export const metadata = {
  title: "Reservefy - FST UINSA",
  description: "Sistem Booking Ruangan Berbasis Poin SKS",
};

// Component RootLayout (tanpa deklarasi tipe Readonly)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        // Menggunakan variable font Inter yang baru
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}