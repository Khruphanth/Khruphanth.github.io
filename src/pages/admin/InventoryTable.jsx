import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import { fetchSheetData, postAction } from "../../services/api";
import { SHEET_NAMES } from "../../config/config";

const CATEGORIES = ["-", "เครื่องใช้ไฟฟ้า", "พัดลม", "เครื่องปรับอากาศ", "เฟอร์นิเจอร์", "อุปกรณ์คอมพิวเตอร์", "สื่อการสอน", "อื่นๆ"];

/* ================= IMAGE ================= */
const RetryImage = ({ src, height }) => {
  const [url, setUrl] = useState(src);
  const [err, setErr] = useState(false);

  useEffect(() => { setUrl(src); setErr(false); }, [src]);

  if (err)
    return (
      <button
        className="btn btn-sm btn-light"
        onClick={(e) => { e.stopPropagation(); setUrl(src + "&t=" + Date.now()); setErr(false); }}
      >
        🔄
      </button>
    );

  return (
    <img
      src={url}
      height={height}
      style={{ cursor: "pointer" }}
      onClick={() => window.open(src, "_blank")}
      onError={() => setErr(true)}
    />
  );
};

/* ================= MAIN ================= */
const InventoryTable = () => {
  const [data, setData] = useState([]);
  const [mode, setMode] = useState("view");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "no", dir: "asc" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [editBuffer, setEditBuffer] = useState({});
  const [selected, setSelected] = useState(new Set());

  const [showAdd, setShowAdd] = useState(false);
  const [newItems, setNewItems] = useState([{ id: Date.now(), code: "", name: "", category: "-" }]);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);

  /* ================= LOAD ================= */
  const loadList = async () => {
    setLoading(true);
    try {
      const rows = await fetchSheetData(SHEET_NAMES.DATA || "DATA");
      setData(rows.map((r, i) => ({
        row: r._row,
        no: i + 1,
        code: r["รหัส"],
        name: r["ชื่อ"],
        category: r["ที่อยู่"] || "-",
        status: r["สถานะ"] || "ใช้งานได้",
        detail: r["รายละเอียด"] || ""
      })));
      reset();
    } catch {
      Swal.fire("Error", "โหลดข้อมูลไม่สำเร็จ", "error");
    }
    setLoading(false);
  };

  useEffect(() => { loadList(); }, []);

  const reset = () => {
    setMode("view");
    setEditBuffer({});
    setSelected(new Set());
  };

  /* ================= PROCESS ================= */
  const processed = useMemo(() => {
    let items = [...data];
    if (search)
      items = items.filter(i =>
        [i.code, i.name, i.category].some(v => String(v).toLowerCase().includes(search.toLowerCase()))
      );

    items.sort((a, b) => {
      const A = a[sort.key], B = b[sort.key];
      if (A < B) return sort.dir === "asc" ? -1 : 1;
      if (A > B) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [data, search, sort]);

  const totalPage = Math.ceil(processed.length / perPage);
  const current = processed.slice((page - 1) * perPage, page * perPage);

  /* ================= ADD ================= */
  const changeNew = (id, f, v) => {
    const u = newItems.map(i => i.id === id ? { ...i, [f]: v } : i);
    setNewItems(u);
    const last = u[u.length - 1];
    if (last.id === id && last.code && last.name && last.category !== "-")
      setNewItems([...u, { id: Date.now(), code: "", name: "", category: "-" }]);
  };

  const saveAdd = async () => {
    const valid = newItems.filter(i => i.code && i.name);
    if (!valid.length) return Swal.fire("เตือน", "กรอกข้อมูลก่อน", "warning");

    Swal.fire({ title: "กำลังบันทึก...", didOpen: Swal.showLoading });
    for (const i of valid)
      await postAction("DATA", "add", {
        "รหัส": i.code,
        "ชื่อ": i.name,
        "ที่อยู่": i.category,
        "สถานะ": "ใช้งานได้",
        "รายละเอียด": "-"
      });

    Swal.fire("สำเร็จ", `เพิ่ม ${valid.length} รายการ`, "success");
    setShowAdd(false);
    setNewItems([{ id: Date.now(), code: "", name: "", category: "-" }]);
    loadList();
  };

  /* ================= EDIT ================= */
  const enterEdit = () => {
    const b = {};
    current.forEach(i => b[i.row] = { ...i });
    setEditBuffer(b);
    setMode("edit");
  };

  const saveEdit = async () => {
    Swal.fire({ title: "กำลังบันทึก...", didOpen: Swal.showLoading });
    for (const r in editBuffer) {
      const i = editBuffer[r];
      await postAction("DATA", "edit", {
        row: r,
        "รหัส": i.code,
        "ชื่อ": i.name,
        "ที่อยู่": i.category,
        "สถานะ": i.status,
        "รายละเอียด": i.detail
      });
    }
    Swal.fire("บันทึกแล้ว", "", "success");
    loadList();
  };

  /* ================= DELETE ================= */
  const del = async () => {
    if (!selected.size) return;
    const ok = await Swal.fire({ title: `ลบ ${selected.size} รายการ?`, showCancelButton: true });
    if (!ok.isConfirmed) return;

    for (const r of [...selected].sort((a, b) => b - a))
      await postAction("DATA", "delete", { row: r });

    loadList();
  };

  /* ================= HISTORY ================= */
  const openHistory = async (item) => {
    setCurrentItem(item);
    setShowHistory(true);
    const rows = await fetchSheetData(SHEET_NAMES.LOG || "LOG");
    setHistory(rows.filter(r => String(r["รหัส"]) === String(item.code)));
  };

  /* ================= RENDER ================= */
  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex gap-2">
        {mode === "view" && (
          <>
            <input className="form-control form-control-sm w-25" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>เพิ่ม</button>
            <button className="btn btn-warning btn-sm" onClick={enterEdit}>แก้ไข</button>
            <button className="btn btn-danger btn-sm" onClick={() => setMode("delete")}>ลบ</button>
          </>
        )}
        {mode === "edit" && <>
          <button className="btn btn-success btn-sm" onClick={saveEdit}>บันทึก</button>
          <button className="btn btn-secondary btn-sm" onClick={reset}>ยกเลิก</button>
        </>}
        {mode === "delete" && <>
          <button className="btn btn-danger btn-sm" onClick={del}>ยืนยันลบ</button>
          <button className="btn btn-secondary btn-sm" onClick={reset}>ยกเลิก</button>
        </>}
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            {mode === "delete" && <th />}
            <th>รหัส</th><th>ชื่อ</th><th>หมวด</th><th>Barcode</th><th>QR</th>
          </tr>
        </thead>
        <tbody>
          {current.map(i => {
            const b = editBuffer[i.row] || i;
            return (
              <tr key={i.row} onClick={mode === "view" ? () => openHistory(i) : undefined}>
                {mode === "delete" &&
                  <td><input type="checkbox" checked={selected.has(i.row)}
                    onChange={() => {
                      const s = new Set(selected);
                      s.has(i.row) ? s.delete(i.row) : s.add(i.row);
                      setSelected(s);
                    }} /></td>}
                <td>{mode === "edit" ? <input value={b.code} onChange={e => setEditBuffer({ ...editBuffer, [i.row]: { ...b, code: e.target.value } })} /> : i.code}</td>
                <td>{mode === "edit" ? <input value={b.name} onChange={e => setEditBuffer({ ...editBuffer, [i.row]: { ...b, name: e.target.value } })} /> : i.name}</td>
                <td>{mode === "edit"
                  ? <select value={b.category} onChange={e => setEditBuffer({ ...editBuffer, [i.row]: { ...b, category: e.target.value } })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  : i.category}</td>
                <td><RetryImage src={`https://barcode.tec-it.com/barcode.ashx?data=${i.code}&code=Code128`} height={25} /></td>
                <td><RetryImage src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${i.code}`} height={35} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
