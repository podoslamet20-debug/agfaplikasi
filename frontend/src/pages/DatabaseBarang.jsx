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
import { Plus, Search, Upload, Package, Edit, Trash2, Eye } from "lucide-react";

export default function DatabaseBarang() {
  const { API, canEdit, canSeePrice } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const emptyForm = { nama_barang: "", spesifikasi: "", harga_pengrajin: 0, harga_jual: 0, catatan: "", gambar_path: "" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/barang${search ? `?search=${search}` : ""}`);
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [search]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await axios.post(`${API}/upload`, fd);
      setForm({ ...form, gambar_path: data.path });
      toast.success("Gambar berhasil diupload");
    } catch (e) {
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    try {
      if (editingId) {
        await axios.put(`${API}/barang/${editingId}`, form);
        toast.success("Barang berhasil diupdate");
      } else {
        await axios.post(`${API}/barang`, form);
        toast.success("Barang berhasil ditambahkan");
      }
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (e) {
      toast.error("Gagal: " + (e.response?.data?.detail || ""));
    }
  };

  const startEdit = (item) => {
    setForm({
      nama_barang: item.nama_barang,
      spesifikasi: item.spesifikasi,
      harga_pengrajin: item.harga_pengrajin || 0,
      harga_jual: item.harga_jual || 0,
      catatan: item.catatan || "",
      gambar_path: item.gambar_path || "",
    });
    setEditingId(item._id);
    setOpen(true);
  };

  const deleteBarang = async (id) => {
    try {
      await axios.delete(`${API}/barang/${id}`);
      toast.success("Barang dihapus");
      load();
    } catch (e) { toast.error("Gagal hapus"); }
  };

  return (
    <div className="space-y-6" data-testid="database-barang-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Database Barang</h1>
          <p className="text-[#5C5C5C] mt-1">Master data barang furniture</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); }}}>
            <DialogTrigger asChild>
              <Button className="bg-[#8B5A2B] hover:bg-[#7A4E24] text-white" data-testid="add-barang-button">
                <Plus className="w-4 h-4 mr-2" /> Tambah Barang
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Gambar Barang</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <Input type="file" onChange={handleUpload} data-testid="upload-image-input" accept="image/*" />
                    {uploading && <span className="text-sm text-[#5C5C5C]">Uploading...</span>}
                  </div>
                  {form.gambar_path && <img src={`${API}/files/${form.gambar_path}`} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-md" />}
                </div>
                <div>
                  <Label>Nama Barang</Label>
                  <Input data-testid="input-nama-barang" value={form.nama_barang} onChange={(e) => setForm({ ...form, nama_barang: e.target.value })} />
                </div>
                <p className="text-xs text-[#5C5C5C]">💡 Pengrajin sekarang di-manage di menu <strong>Pengrajin</strong> terpisah. Alokasi pengrajin per barang dibuat saat membuat SPK.</p>
                <div>
                  <Label>Spesifikasi</Label>
                  <Textarea data-testid="input-spesifikasi" value={form.spesifikasi} onChange={(e) => setForm({ ...form, spesifikasi: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Harga Pengrajin (Rp)</Label>
                    <Input type="number" data-testid="input-harga-pengrajin" value={form.harga_pengrajin} onChange={(e) => setForm({ ...form, harga_pengrajin: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Harga Jual (Rp)</Label>
                    <Input type="number" data-testid="input-harga-jual" value={form.harga_jual} onChange={(e) => setForm({ ...form, harga_jual: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <Label>Catatan</Label>
                  <Textarea data-testid="input-catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
                </div>
                <Button onClick={submit} className="w-full bg-[#8B5A2B] hover:bg-[#7A4E24] text-white" data-testid="submit-barang-button">Simpan</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="p-4 border border-[#E5E5E5]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
          <Input
            placeholder="Cari barang atau pengrajin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="search-barang-input"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="barang-list">
        {items.length === 0 ? (
          <Card className="col-span-full p-12 text-center border border-dashed border-[#E5E5E5]">
            <Package className="w-12 h-12 mx-auto text-[#5C5C5C] mb-3" />
            <p className="text-[#5C5C5C]">Belum ada data barang. Tambahkan barang pertama.</p>
          </Card>
        ) : (
          items.map((item, idx) => (
            <Card key={idx} className="overflow-hidden border border-[#E5E5E5] hover:shadow-md transition-shadow duration-200" data-testid={`barang-item-${idx}`}>
              {item.gambar_path ? (
                <img src={`${API}/files/${item.gambar_path}`} alt={item.nama_barang} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-[#F0E6D6] flex items-center justify-center">
                  <Package className="w-12 h-12 text-[#8B5A2B]" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-[#1A1A1A]">{item.nama_barang}</h3>
                <p className="text-xs text-[#5C5C5C] mt-2 line-clamp-2">{item.spesifikasi}</p>
                {canSeePrice && (
                  <div className="mt-3 pt-3 border-t border-[#E5E5E5] space-y-1">
                    <p className="text-xs text-[#5C5C5C]">Harga Pengrajin: <span className="font-medium text-[#1A1A1A]">Rp {item.harga_pengrajin?.toLocaleString('id-ID')}</span></p>
                    <p className="text-xs text-[#5C5C5C]">Harga Jual: <span className="font-medium text-[#4CAF50]">Rp {item.harga_jual?.toLocaleString('id-ID')}</span></p>
                  </div>
                )}
                <div className="mt-3 flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPreview(item)} className="flex-1" data-testid={`preview-barang-${idx}`}><Eye className="w-3 h-3" /></Button>
                  {canEdit && <Button variant="outline" size="sm" onClick={() => startEdit(item)} data-testid={`edit-barang-${idx}`}><Edit className="w-3 h-3" /></Button>}
                  {canEdit && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-[#F44336]" data-testid={`delete-barang-${idx}`}><Trash2 className="w-3 h-3" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Barang?</AlertDialogTitle>
                          <AlertDialogDescription>Barang &quot;{item.nama_barang}&quot; akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction className="bg-[#F44336]" onClick={() => deleteBarang(item._id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{preview?.nama_barang}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              {preview.gambar_path && <img src={`${API}/files/${preview.gambar_path}`} className="w-full h-64 object-cover rounded-md" alt="" />}
              <p><strong>Spesifikasi:</strong> {preview.spesifikasi}</p>
              {canSeePrice && (
                <>
                  <p><strong>Harga Pengrajin:</strong> Rp {preview.harga_pengrajin?.toLocaleString('id-ID')}</p>
                  <p><strong>Harga Jual:</strong> Rp {preview.harga_jual?.toLocaleString('id-ID')}</p>
                </>
              )}
              {preview.catatan && <p><strong>Catatan:</strong> {preview.catatan}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
