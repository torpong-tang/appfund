
import "./globals.css";
import { Inter, Sarabun, Outfit } from "next/font/google"; // Next.js optimizes fonts automatically

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sarabun = Sarabun({ weight: ["300", "400", "500", "600", "700"], subsets: ["thai", "latin"], variable: "--font-sarabun" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "เป๋าเรา Acc BA 34 - Full AI & Original Features (V11)",
  description: "ระบบจัดการเงินรุ่นและทำเนียบศิษย์เก่า",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className={`${inter.variable} ${sarabun.variable} ${outfit.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
