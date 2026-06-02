import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h1 className="font-serif text-7xl text-white/10 mb-2">404</h1>
      <p className="text-lg text-white/40 mb-6">Page not found</p>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-4 py-2 text-sm text-[#C8956C] hover:text-[#B8855C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to home
      </button>
    </div>
  );
}
