import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Package, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login berhasil!");
      navigate("/");
    } catch (err) {
      toast.error("Login gagal: " + (err.response?.data?.detail || "Coba lagi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAFAFA] to-[#F0E6D6] p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-[#8B5A2B] flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>AGFDATA</h1>
              <p className="text-sm text-[#5C5C5C]">Furniture Data Management</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] leading-tight" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>
            Kelola Data Furniture dengan <span className="text-[#8B5A2B]">Presisi & Efisiensi</span>
          </h2>
          <p className="text-[#5C5C5C]">
            Sistem terpadu untuk manajemen database barang, PO, SPK, dan tracking progres produksi furniture.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {["Database Barang", "PO & SPK", "Barang Masuk", "Rekap Data"].map((f) => (
              <div key={f} className="p-3 bg-white rounded-md border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A]">
                {f}
              </div>
            ))}
          </div>
        </div>
        <Card className="p-8 shadow-md border border-[#E5E5E5] bg-white">
          <div className="lg:hidden mb-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#8B5A2B] flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>AGFDATA</h1>
              <p className="text-xs text-[#5C5C5C]">Furniture Data Management</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Masuk ke Akun</h2>
          <p className="text-sm text-[#5C5C5C] mb-6">Silahkan login untuk mengakses sistem</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  placeholder="admin@agfdata.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full bg-[#8B5A2B] hover:bg-[#7A4E24] text-white"
            >
              {loading ? "Memuat..." : "Login"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
