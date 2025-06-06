import { Outlet } from "react-router-dom";
import Sidebar from "../components/Businessplan/Sidebar";

export default function GeneratorLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
