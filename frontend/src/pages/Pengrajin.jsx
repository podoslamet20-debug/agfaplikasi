import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Hammer, Edit, Trash2, Phone, MapPin, CreditCard } from "lucide-react";

const emptyForm = { nama: "", telepon: "", alamat: "", rekening: "", catatan: "" };

export default function Pengrajin() {
  const { API, canEdit } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/pengrajin`);
      setItems(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.nama.trim()) return toast.error("Nama pengrajin wajib diisi");
    try {
      if (editingId) {
        await axios.put(`${API}/pengrajin/${editingId}`, form);
        toast.success("Pengrajin diupdate");
      } else {
        await axios.post(`${API}/pengrajin`, form);
        toast.success("Pengrajin ditambahkan");
      }
      setOpen(false); setEditingId(null); setForm(emptyForm);
      load();
    } catch (e) {
      toast.error("Gagal: " + (e.response?.data?.detail || ""));
    }
  };

  const startEdit = (p) => {
    setForm({ nama: p.nama || "", telepon: p.telepon || "", alamat: p.alamat || "", rekening: p.rekening || "", catatan: p.catatan || "" });
    setEditingId(p._id);
    setOpen(true);
  };

  const del = async (id) => {
    try {
      await axios.delete(`${API}/pengrajin/${id}`);
      toast.success("Pengrajin dihapus");
      load();
    } catch (e) { toast.error("Gagal hapus"); }
  };

  const filtered = items.filter(p =>
    !search || (p.nama || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.telepon || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="pengrajin-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Pengrajin</h1>
          <p className="text-[#5C5C5C] mt-1">Master data pengrajin (tukang / craftsman)</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="bg-[#8B5A2B] hover:bg-[#7A4E24] text-white" data-testid="add-pengrajin-button">
                <Plus className="w-4 h-4 mr-2" /> Tambah Pengrajin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Pengrajin" : "Tambah Pengrajin"}</DialogTitle>
                <DialogDescription>Data pengrajin akan dipakai saat alokasi SPK dan Barang Masuk.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nama Pengrajin</Label>
                  <Input data-testid="input-pengrajin-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
                </div>
                <div>
                  <Label>Telepon</Label>
                  <Input data-testid="input-pengrajin-telepon" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
                </div>
                <div>
                  <Label>Alamat</Label>
                  <Textarea data-testid="input-pengrajin-alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
                </div>
                <div>
                  <Label>Rekening</Label>
                  <Input data-testid="input-pengrajin-rekening" value={form.rekening} onChange={(e) => setForm({ ...form, rekening: e.target.value })} placeholder="Bank / No. Rekening" />
                </div>
                <div>
                  <Label>Catatan</Label>
                  <Textarea data-testid="input-pengrajin-catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
                </div>
                <Button onClick={submit} className="w-full bg-[#8B5A2B] hover:bg-[#7A4E24] text-white" data-testid="submit-pengrajin-button">Simpan</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="p-4 border border-[#E5E5E5]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
          <Input placeholder="Cari nama atau telepon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="search-pengrajin-input" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="pengrajin-list">
        {filtered.length === 0 ? (
          <Card className="col-span-full p-12 text-center border border-dashed border-[#E5E5E5]">
            <Hammer className="w-12 h-12 mx-auto text-[#5C5C5C] mb-3" />
            <p className="text-[#5C5C5C]">Belum ada data pengrajin. Tambahkan pengrajin pertama.</p>
          </Card>
        ) : (
          filtered.map((p, idx) => (
            <Card key={p._id} className="p-5 border border-[#E5E5E5] hover:shadow-md transition-shadow" data-testid={`pengrajin-item-${idx}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#F0E6D6] flex items-center justify-center">
                    <Hammer className="w-5 h-5 text-[#8B5A2B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A]">{p.nama}</h3>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => startEdit(p)} data-testid={`edit-pengrajin-${idx}`}><Edit className="w-3 h-3" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-[#F44336]" data-testid={`delete-pengrajin-${idx}`}><Trash2 className="w-3 h-3" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Pengrajin?</AlertDialogTitle>
                          <AlertDialogDescription>Pengrajin &quot;{p.nama}&quot; akan dihapus. SPK/BM yang sudah memakainya tetap tersimpan (data historis).</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction className="bg-[#F44336]" onClick={() => del(p._id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
              {p.telepon && <p className="text-sm text-[#5C5C5C] flex items-center gap-2"><Phone className="w-3 h-3" /> {p.telepon}</p>}
              {p.alamat && <p className="text-sm text-[#5C5C5C] flex items-start gap-2 mt-1"><MapPin className="w-3 h-3 mt-0.5" /> {p.alamat}</p>}
              {p.rekening && <p className="text-sm text-[#5C5C5C] flex items-center gap-2 mt-1"><CreditCard className="w-3 h-3" /> {p.rekening}</p>}
              {p.catatan && <p className="text-xs text-[#5C5C5C] italic mt-2 border-t border-[#E5E5E5] pt-2">{p.catatan}</p>}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
