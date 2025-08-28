import SidebarStaff from "@/components/layout/SidebarStaff";
import Topbar from "@/components/layout/Topbar";
import { StaffOnly } from "@/lib/guards";

export default function StaffLayout({children}:{children:React.ReactNode}){
  return (
    <StaffOnly>
      <div className="flex">
        <SidebarStaff/>
        <main className="flex-1 min-h-screen">
          <Topbar/>
          <div className="p-6 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </StaffOnly>
  );
}
