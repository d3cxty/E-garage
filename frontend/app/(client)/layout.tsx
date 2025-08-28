import Navbar from "@/components/layout/Navbar";
import { ClientOnly } from "@/lib/guards";

export default function ClientLayout({children}:{children:React.ReactNode}){
  return (
    <ClientOnly>
      <Navbar/>
      <div className="min-h-[calc(100vh-64px)] p-6 max-w-6xl mx-auto">{children}</div>
    </ClientOnly>
  );
}
