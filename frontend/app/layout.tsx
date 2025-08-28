import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "react-hot-toast";

export const metadata = { title: "E-Garage", description: "Garage Management" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: 'white' } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
