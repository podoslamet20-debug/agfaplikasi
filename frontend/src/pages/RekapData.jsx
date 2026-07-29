import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Package, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function RekapData() {
  const { API, canSeeCraftsman, isGuest } = useAuth();
  const [rekapPO, setRekapPO] = useState([]);
  const [rekapPengrajin, setRekapPengrajin] = useState([]);
  const [rekapBarang, setRekapBarang] = useState([]);
  const [rekapProgres, setRekapProgres] = useState([]);
  const [staffingSummary, setStaffingSummary] = useState([]);
  const [poList, setPoList] = useState([]);
  const [pengrajinList, setPengrajinList] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [filterNoPO, setFilterNoPO] = useState("all");
  const [filterPengrajin, setFilterPengrajin] = useState("all");
  const [filterBarang, setFilterBarang] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortAZ, setSortAZ] = useState(true);

  const buildQS = () => {
    const params = new URLSearchParams();
    if (filterNoPO !== "all") params.set("no_po", filterNoPO);
    if (filterPengrajin !== "all") params.set("pengrajin_id", filterPengrajin);
    if (filterBarang !== "all") params.set("barang_id", filterBarang);
    if (filterDateFrom) params.set("date_from", filterDateFrom);
    if (filterDateTo) params.set("date_to", filterDateTo);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const load = async () => {
    try {
      const qs = buildQS();
      const [poRes, pgRes, brRes, prRes, poListRes, sumRes, pengrRes, barRes] = await Promise.all([
        axios.get(`${API}/rekap/all-po${qs}`),
        !isGuest ? axios.get(`${API}/rekap/per-pengrajin${qs}`) : Promise.resolve({ data: [] }),
        axios.get(`${API}/rekap/per-barang${qs}`),
        axios.get(`${API}/rekap/progres${qs}`),
        axios.get(`${API}/po`),
        axios.get(`${API}/rekap/staffing-summary${filterNoPO !== "all" ? `?no_po=${filterNoPO}` : ""}`),
        axios.get(`${API}/pengrajin`),
        axios.get(`${API}/barang`),
      ]);
      setRekapPO(poRes.data);
      setRekapPengrajin(pgRes.data);
      setRekapBarang(brRes.data);
      setRekapProgres(prRes.data);
      setPoList(poListRes.data);
      setStaffingSummary(sumRes.data);
      setPengrajinList(pengrRes.data);
      setBarangList(barRes.data);
    } catch (e) { console.error(e); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterNoPO, filterPengrajin, filterBarang, filterDateFrom, filterDateTo]);

  const sortRows = (arr, key) => {
    if (!sortAZ) return arr;
    return [...arr].sort((a, b) => ((a[key] || "").toLowerCase().localeCompare((b[key] || "").toLowerCase())));
  };

  const sortedPO = useMemo(() => sortRows(rekapPO, "nama_barang"), [rekapPO, sortAZ]);
  const sortedBarang = useMemo(() => sortRows(rekapBarang, "nama_barang"), [rekapBarang, sortAZ]);
  const sortedProgres = useMemo(() => sortRows(rekapProgres, "nama_barang"), [rekapProgres, sortAZ]);
  const sortedPengrajin = useMemo(() => sortRows(rekapPengrajin, "pengrajin"), [rekapPengrajin, sortAZ]);
  const sortedStaffing = useMemo(() => sortRows(staffingSummary, "nama_barang"), [staffingSummary, sortAZ]);

  const resetFilters = () => { setFilterNoPO("all"); setFilterBarang("all"); setFilterPengrajin("all"); setFilterDateFrom(""); setFilterDateTo(""); };

  const exportData = (data, name, format) => {
    if (data.length === 0) return;
    if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
    } else {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 30));
      XLSX.writeFile(wb, `${name}.xlsx`);
    }
  };

  const statusLabel = (r) => {
    const s = [];
    if (r.komplit_pengrajin) s.push("Komplit Pengrajin");
    if (r.komplit_spk) s.push("Komplit SPK");
    if (r.komplit_terkirim) s.push("Komplit Terkirim");
    if (r.ready) s.push("Ready");
    return s.join(", ") || "Proses";
  };

  const exportPO = (fmt) => exportData(sortedPO.map(r => ({
    "No PO": r.no_po,
    "Nama Barang": r.nama_barang,
    ...(canSeeCraftsman && { "Pengrajin": r.nama_pengrajin }),
    "Qty PO": r.qty_po, "Qty Staffing": r.qty_staffing, "Kurang Kirim": r.kurang_kirim,
    "Status": statusLabel(r),
  })), "rekap-po", fmt);

  const exportBarang = (fmt) => exportData(sortedBarang.map(r => ({
    "Nama Barang": r.nama_barang,
    "No PO": r.no_po || (r.no_po_list || []).join(", "),
    ...(canSeeCraftsman && { "Pengrajin": r.nama_pengrajin || (r.pengrajin_names || []).join(", ") }),
    "Qty Masuk": r.qty_masuk, "Qty Packing": r.qty_packing, "Kurang": r.kurang,
  })), "rekap-per-barang", fmt);

  const exportProgres = (fmt) => exportData(sortedProgres.map(r => ({
    "No PO": r.no_po, "Nama Barang": r.nama_barang,
    "Tanggal Update": r.tanggal_terakhir || "-",
    "Qty Masuk": r.qty_masuk,
    "Grinda": r.grinda, "Sisa Grinda": r.sisa_grinda,
    "Servis": r.servis, "Sisa Servis": r.sisa_servis,
    "Finishing": r.finishing, "Sisa Finishing": r.sisa_finishing,
    "Packing": r.packing, "Sisa Packing": r.sisa_packing,
    "Status": r.komplit ? "KOMPLIT" : "PROSES",
  })), "rekap-progres", fmt);

  const exportPengrajin = (fmt) => exportData(sortedPengrajin.map(r => ({
    "Pengrajin": r.pengrajin,
    "No PO": r.no_po || (r.no_po_list || []).join(", "),
    "Barang Dikerjakan": r.barang_dikerjakan || (r.barang_list || []).join(", "),
    "SPK Qty": r.spk_qty, "Diterima": r.masuk_qty, "Remaining": r.remaining,
  })), "rekap-pengrajin", fmt);

  const exportStaffing = (fmt) => exportData(sortedStaffing.map(r => ({
    "No PO": r.no_po, "Nama Barang": r.nama_barang,
    "Qty PO": r.qty_po, "Qty Staffing": r.qty_staffing, "Kurang Kirim": r.kurang_kirim,
  })), "rekap-staffing", fmt);

  const printPage = () => window.print();

  const FilterPanel = () => (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 p-3 bg-[#FAFAFA] rounded-md border border-[#E5E5E5] print:hidden" data-testid="rekap-filters">
      <div>
        <Label className="text-xs">No PO</Label>
        <Select value={filterNoPO} onValueChange={setFilterNoPO}>
          <SelectTrigger data-testid="filter-no-po"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua PO</SelectItem>
            {poList.map((p, i) => <SelectItem key={i} value={p.no_po}>{p.no_po}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Barang</Label>
        <Select value={filterBarang} onValueChange={setFilterBarang}>
          <SelectTrigger data-testid="filter-barang"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Barang</SelectItem>
            {barangList.map((b) => <SelectItem key={b._id} value={b._id}>{b.nama_barang}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Pengrajin</Label>
        <Select value={filterPengrajin} onValueChange={setFilterPengrajin}>
          <SelectTrigger data-testid="filter-pengrajin"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pengrajin</SelectItem>
            {pengrajinList.map((p) => <SelectItem key={p._id} value={p._id}>{p.nama}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Dari Tanggal</Label>
        <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} data-testid="filter-date-from" />
      </div>
      <div>
        <Label className="text-xs">Sampai Tanggal</Label>
        <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} data-testid="filter-date-to" />
      </div>
      <div className="flex items-end gap-2">
        <Button variant={sortAZ ? "default" : "outline"} size="sm" onClick={() => setSortAZ(!sortAZ)} data-testid="toggle-sort-az" className={sortAZ ? "bg-[#8B5A2B] hover:bg-[#7A4E24]" : ""}>Sort A-Z</Button>
        <Button variant="outline" size="sm" onClick={resetFilters} data-testid="reset-rekap-filters">Reset</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="rekap-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Rekap Data</h1>
          <p className="text-[#5C5C5C] mt-1">Laporan komprehensif dengan filter — filter berlaku untuk semua tab.</p>
        </div>
        <Button variant="outline" onClick={printPage} data-testid="print-rekap"><Printer className="w-4 h-4 mr-2" /> Print</Button>
      </div>

      <div className="hidden print:block print-header mb-4">
        <h1 className="text-2xl font-bold">AGFDATA - Rekap Data</h1>
        <p className="text-sm">
          {filterNoPO !== "all" && `PO: ${filterNoPO} `}
          {filterBarang !== "all" && `Barang: ${barangList.find(b => b._id === filterBarang)?.nama_barang || filterBarang} `}
          {filterPengrajin !== "all" && `Pengrajin: ${pengrajinList.find(p => p._id === filterPengrajin)?.nama || filterPengrajin} `}
          {filterDateFrom && `dari ${filterDateFrom} `}
          {filterDateTo && `sampai ${filterDateTo} `}
        </p>
      </div>

      <Tabs defaultValue="po" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full print:hidden">
          <TabsTrigger value="po" data-testid="tab-rekap-po">Rekap PO</TabsTrigger>
          <TabsTrigger value="barang" data-testid="tab-rekap-barang">Per Barang</TabsTrigger>
          <TabsTrigger value="progres" data-testid="tab-rekap-progres">Progres</TabsTrigger>
          <TabsTrigger value="pengrajin" data-testid="tab-rekap-pengrajin" disabled={isGuest}>Per Pengrajin</TabsTrigger>
          <TabsTrigger value="staffing" data-testid="tab-rekap-staffing">Staffing</TabsTrigger>
        </TabsList>

        <TabsContent value="po" className="mt-4">
          <Card className="p-6 border border-[#E5E5E5]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Rekap Semua PO</h2>
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => exportPO("csv")} data-testid="export-po-csv"><Download className="w-3 h-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportPO("xlsx")} data-testid="export-po-xlsx"><Download className="w-3 h-3 mr-1" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={printPage} data-testid="print-po"><Printer className="w-3 h-3 mr-1" /> Print</Button>
              </div>
            </div>
            <FilterPanel />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F0E6D6]"><tr><th className="p-2 text-left">Foto</th><th className="p-2 text-left">No PO</th><th className="p-2 text-left">Barang</th>{canSeeCraftsman && <th className="p-2 text-left">Pengrajin</th>}<th className="p-2 text-right">Qty PO</th><th className="p-2 text-right">Staffing</th><th className="p-2 text-right">Kurang Kirim</th><th className="p-2 text-center">Status</th></tr></thead>
                <tbody>
                  {sortedPO.map((r, i) => (
                    <tr key={i} className="border-b border-[#E5E5E5]" data-testid={`rekap-po-row-${i}`}>
                      <td className="p-2">{r.gambar_path ? <img src={`${API}/files/${r.gambar_path}`} className="w-10 h-10 object-cover rounded" alt="" /> : <div className="w-10 h-10 bg-[#F0E6D6] rounded flex items-center justify-center"><Package className="w-4 h-4 text-[#8B5A2B]" /></div>}</td>
                      <td className="p-2">{r.no_po}</td>
                      <td className="p-2">{r.nama_barang}</td>
                      {canSeeCraftsman && <td className="p-2">{r.nama_pengrajin}</td>}
                      <td className="p-2 text-right">{r.qty_po}</td>
                      <td className="p-2 text-right">{r.qty_staffing}</td>
                      <td className="p-2 text-right"><span className={`font-medium ${r.kurang_kirim > 0 ? 'text-[#F44336]' : 'text-[#4CAF50]'}`}>{r.kurang_kirim}</span></td>
                      <td className="p-2 text-center"><div className="flex flex-wrap gap-1 justify-center">{r.komplit_pengrajin && <span className="text-xs px-1.5 py-0.5 bg-[#4CAF50] text-white rounded whitespace-nowrap">Komplit Pengrajin</span>}{r.komplit_spk && <span className="text-xs px-1.5 py-0.5 bg-[#2196F3] text-white rounded whitespace-nowrap">Komplit SPK</span>}{r.komplit_terkirim && <span className="text-xs px-1.5 py-0.5 bg-[#9C27B0] text-white rounded whitespace-nowrap">Komplit Terkirim</span>}{r.ready && <span className="text-xs px-1.5 py-0.5 bg-[#FFC107] text-white rounded whitespace-nowrap">Ready</span>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedPO.length === 0 && <p className="text-center text-[#5C5C5C] py-8">Belum ada data</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="barang" className="mt-4">
          <Card className="p-6 border border-[#E5E5E5]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Rekap Per Barang</h2>
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => exportBarang("csv")} data-testid="export-barang-csv"><Download className="w-3 h-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportBarang("xlsx")} data-testid="export-barang-xlsx"><Download className="w-3 h-3 mr-1" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={printPage} data-testid="print-barang"><Printer className="w-3 h-3 mr-1" /> Print</Button>
              </div>
            </div>
            <FilterPanel />
            <p className="text-xs text-[#5C5C5C] mb-3">Total Qty Masuk & Kurang berdasarkan filter aktif. Kolom Pengrajin = semua pengrajin dari Barang Masuk.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F0E6D6]"><tr><th className="p-2 text-left">Foto</th><th className="p-2 text-left">Nama Barang</th><th className="p-2 text-left">No PO</th>{canSeeCraftsman && <th className="p-2 text-left">Pengrajin (semua)</th>}<th className="p-2 text-right">Qty Masuk</th><th className="p-2 text-right">Qty Packing</th><th className="p-2 text-right">Kurang</th></tr></thead>
                <tbody>
                  {sortedBarang.map((r, i) => (
                    <tr key={i} className="border-b border-[#E5E5E5]" data-testid={`rekap-barang-row-${i}`}>
                      <td className="p-2">{r.gambar_path ? <img src={`${API}/files/${r.gambar_path}`} className="w-10 h-10 object-cover rounded" alt="" /> : <div className="w-10 h-10 bg-[#F0E6D6] rounded flex items-center justify-center"><Package className="w-4 h-4 text-[#8B5A2B]" /></div>}</td>
                      <td className="p-2 font-medium">{r.nama_barang}</td>
                      <td className="p-2 text-xs">{r.no_po || (r.no_po_list || []).join(", ")}</td>
                      {canSeeCraftsman && <td className="p-2 text-xs">{r.nama_pengrajin || (r.pengrajin_names || []).join(", ")}</td>}
                      <td className="p-2 text-right">{r.qty_masuk}</td>
                      <td className="p-2 text-right">{r.qty_packing}</td>
                      <td className="p-2 text-right"><span className={`font-medium ${r.kurang > 0 ? 'text-[#F44336]' : 'text-[#4CAF50]'}`}>{r.kurang}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedBarang.length === 0 && <p className="text-center text-[#5C5C5C] py-8">Belum ada data</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="progres" className="mt-4">
          <Card className="p-6 border border-[#E5E5E5]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Rekap Progres Barang</h2>
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => exportProgres("csv")} data-testid="export-progres-csv"><Download className="w-3 h-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportProgres("xlsx")} data-testid="export-progres-xlsx"><Download className="w-3 h-3 mr-1" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={printPage} data-testid="print-progres"><Printer className="w-3 h-3 mr-1" /> Print</Button>
              </div>
            </div>
            <FilterPanel />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F0E6D6]"><tr><th className="p-2 text-left">Foto</th><th className="p-2 text-left">No PO</th><th className="p-2 text-left">Barang</th><th className="p-2 text-center">Tanggal Update</th><th className="p-2 text-right">Masuk</th><th className="p-2 text-right">Grinda<br/><span className="text-[10px] font-normal text-[#5C5C5C]">Sisa</span></th><th className="p-2 text-right">Servis<br/><span className="text-[10px] font-normal text-[#5C5C5C]">Sisa</span></th><th className="p-2 text-right">Finishing<br/><span className="text-[10px] font-normal text-[#5C5C5C]">Sisa</span></th><th className="p-2 text-right">Packing<br/><span className="text-[10px] font-normal text-[#5C5C5C]">Sisa</span></th><th className="p-2 text-center">Status</th></tr></thead>
                <tbody>
                  {sortedProgres.map((r, i) => (
                    <tr key={i} className="border-b border-[#E5E5E5]" data-testid={`rekap-progres-row-${i}`}>
                      <td className="p-2">{r.gambar_path ? <img src={`${API}/files/${r.gambar_path}`} className="w-10 h-10 object-cover rounded" alt="" /> : <div className="w-10 h-10 bg-[#F0E6D6] rounded flex items-center justify-center"><Package className="w-4 h-4 text-[#8B5A2B]" /></div>}</td>
                      <td className="p-2">{r.no_po}</td>
                      <td className="p-2 font-medium">{r.nama_barang}</td>
                      <td className="p-2 text-center text-xs text-[#5C5C5C]">{r.tanggal_terakhir || "-"}</td>
                      <td className="p-2 text-right">{r.qty_masuk}</td>
                      <td className="p-2 text-right"><div>{r.grinda}</div><div className="text-[10px] text-[#5C5C5C]">{r.sisa_grinda}</div></td>
                      <td className="p-2 text-right"><div>{r.servis}</div><div className="text-[10px] text-[#5C5C5C]">{r.sisa_servis}</div></td>
                      <td className="p-2 text-right"><div>{r.finishing}</div><div className="text-[10px] text-[#5C5C5C]">{r.sisa_finishing}</div></td>
                      <td className="p-2 text-right font-medium"><div>{r.packing}</div><div className="text-[10px] text-[#5C5C5C]">{r.sisa_packing}</div></td>
                      <td className="p-2 text-center">{r.komplit ? <span className="text-xs px-2 py-0.5 bg-[#4CAF50] text-white rounded">KOMPLIT</span> : <span className="text-xs px-2 py-0.5 bg-[#FFC107] text-white rounded">PROSES</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedProgres.length === 0 && <p className="text-center text-[#5C5C5C] py-8">Belum ada data</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pengrajin" className="mt-4">
          <Card className="p-6 border border-[#E5E5E5]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Rekap Per Pengrajin</h2>
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => exportPengrajin("csv")} data-testid="export-pengrajin-csv"><Download className="w-3 h-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportPengrajin("xlsx")} data-testid="export-pengrajin-xlsx"><Download className="w-3 h-3 mr-1" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={printPage} data-testid="print-pengrajin"><Printer className="w-3 h-3 mr-1" /> Print</Button>
              </div>
            </div>
            <FilterPanel />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F0E6D6]"><tr><th className="p-2 text-left">Pengrajin</th><th className="p-2 text-left">No PO</th><th className="p-2 text-left">Barang Dikerjakan (dari SPK)</th><th className="p-2 text-right">SPK Qty</th><th className="p-2 text-right">Diterima</th><th className="p-2 text-right">Remaining</th></tr></thead>
                <tbody>
                  {sortedPengrajin.map((r, i) => (
                    <tr key={i} className="border-b border-[#E5E5E5]" data-testid={`rekap-pengrajin-row-${i}`}>
                      <td className="p-2 font-medium">{r.pengrajin}</td>
                      <td className="p-2 text-xs">{r.no_po || (r.no_po_list || []).join(", ")}</td>
                      <td className="p-2 text-xs">{r.barang_dikerjakan || (r.barang_list || []).join(", ")}</td>
                      <td className="p-2 text-right">{r.spk_qty}</td>
                      <td className="p-2 text-right">{r.masuk_qty}</td>
                      <td className="p-2 text-right"><span className={`font-medium ${r.remaining > 0 ? 'text-[#F44336]' : 'text-[#4CAF50]'}`}>{r.remaining}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedPengrajin.length === 0 && <p className="text-center text-[#5C5C5C] py-8">Belum ada data</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="staffing" className="mt-4">
          <Card className="p-6 border border-[#E5E5E5]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Cabinet Grotesk, system-ui" }}>Rekap Staffing</h2>
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => exportStaffing("csv")} data-testid="export-staffing-csv"><Download className="w-3 h-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportStaffing("xlsx")} data-testid="export-staffing-xlsx"><Download className="w-3 h-3 mr-1" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={printPage} data-testid="print-staffing-summary"><Printer className="w-3 h-3 mr-1" /> Print</Button>
              </div>
            </div>
            <FilterPanel />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F0E6D6]"><tr><th className="p-2 text-left">Foto</th><th className="p-2 text-left">No PO</th><th className="p-2 text-left">Barang</th><th className="p-2 text-right">Qty PO</th><th className="p-2 text-right">Qty Staffing</th><th className="p-2 text-right">Kurang Kirim</th></tr></thead>
                <tbody>
                  {sortedStaffing.map((r, i) => (
                    <tr key={i} className="border-b border-[#E5E5E5]" data-testid={`rekap-staffing-row-${i}`}>
                      <td className="p-2">{r.gambar_path ? <img src={`${API}/files/${r.gambar_path}`} className="w-10 h-10 object-cover rounded" alt="" /> : <div className="w-10 h-10 bg-[#F0E6D6] rounded flex items-center justify-center"><Package className="w-4 h-4 text-[#8B5A2B]" /></div>}</td>
                      <td className="p-2">{r.no_po}</td>
                      <td className="p-2 font-medium">{r.nama_barang}</td>
                      <td className="p-2 text-right">{r.qty_po}</td>
                      <td className="p-2 text-right">{r.qty_staffing}</td>
                      <td className="p-2 text-right"><span className={`font-medium ${r.kurang_kirim > 0 ? 'text-[#F44336]' : 'text-[#4CAF50]'}`}>{r.kurang_kirim}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedStaffing.length === 0 && <p className="text-center text-[#5C5C5C] py-8">Belum ada data</p>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
