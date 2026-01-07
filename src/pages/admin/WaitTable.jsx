import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchSheetData, postAction } from '../../services/api';
import { formatDate } from '../../utils/formatter';
import { SHEET_NAMES } from '../../config/config';

const WaitTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());

  const LOCATIONS = ["-", "501", "502", "503", "401", "401A", "401B", "401C", "402", "403", "404", "405", "ห้องพักครู", "301", "302"];
  const STATUS_OPTIONS = ["-", "ใช้งานได้", "ชำรุด", "ส่งซ่อม", "เสื่อมสภาพ"];

  const loadWait = async () => {
    setLoading(true);
    try {
      const rows = await fetchSheetData(SHEET_NAMES.WAIT || "WAIT");
      // slice(1) ตัดหัวแถวออก และกรองแถวว่าง/แถวที่มีคำว่า "รหัส" ทิ้ง
      const mapped = rows.slice(1)
        .filter(r => r && r[0] && String(r[0]).trim() !== "" && String(r[0]) !== "รหัส")
        .map((r, i) => ({
          row: i + 2, // อ้างอิงแถวที่ถูกต้องใน Sheet (เริ่มที่ 2)
          code: r[0], 
          name: r[1],
          location: "-", 
          status: "-",   
          note: r[4] || "", 
          date: r[5], 
          time: r[6]
        }));
      setData(mapped);
      setSelectedRows(new Set());
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'โหลดข้อมูลไม่สำเร็จ', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { loadWait(); }, []);

  const handleChange = (index, field, value) => {
    const newData = [...data];
    newData[index][field] = value;
    setData(newData);

    // ติ๊กถูกอัตโนมัติเมื่อมีการเปลี่ยนแปลงข้อมูล
    const rowId = newData[index].row;
    if (!selectedRows.has(rowId)) {
      setSelectedRows(prev => new Set(prev).add(rowId));
    }
  };

  const toggleSelect = (rowId) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(rowId)) newSet.delete(rowId); else newSet.add(rowId);
    setSelectedRows(newSet);
  };

  const handleApprove = async () => {
    const itemsToApprove = data.filter(item => selectedRows.has(item.row));
    if (itemsToApprove.length === 0) return;
    
    const invalid = itemsToApprove.find(i => i.location === "-" || i.status === "-");
    if (invalid) return Swal.fire('ข้อมูลไม่ครบ', `รหัส ${invalid.code} ยังไม่ได้เลือกที่อยู่หรือสถานะ`, 'warning');

    Swal.fire({ title: 'กำลังอนุมัติ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      for (const item of itemsToApprove) {
        // 1. ส่งข้อมูลไปหน้า LOG (ใช้ชื่อคีย์ภาษาไทยตามที่ Script รับ)
        await postAction("LOG", "addLog", {
          "รหัส": item.code, "ชื่อ": item.name, "ที่อยู่": item.location,
          "สถานะ": item.status, "หมายเหตุ": item.note
        });
        // 2. ลบออกจากหน้า WAIT
        await postAction("WAIT", "delete", { row: item.row });
      }
      Swal.fire('สำเร็จ', `อนุมัติเรียบร้อย`, 'success');
      loadWait();
    } catch (e) {
      Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold text-primary m-0">รายการรอตรวจสอบ ({data.length})</h5>
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" onClick={loadWait}><i className="bi bi-arrow-clockwise"></i> รีเฟรช</button>
          <button className="btn btn-success" onClick={handleApprove} disabled={selectedRows.size === 0}>อนุมัติที่เลือก</button>
        </div>
      </div>
      <div className="table-responsive p-3">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th width="40"><i className="bi bi-check2-square"></i></th>
              <th>รหัส</th>
              <th>ชื่อ</th>
              <th style={{width: '150px'}}>ที่อยู่</th>
              <th style={{width: '150px'}}>สถานะ</th>
              <th>หมายเหตุ</th>
              <th>วันที่</th>
              <th>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center p-4">กำลังโหลด...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-5 text-muted">ไม่พบข้อมูลรายการรอตรวจสอบ</td></tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx} onClick={() => toggleSelect(item.row)} style={{cursor: 'pointer'}}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="form-check-input" checked={selectedRows.has(item.row)} onChange={() => toggleSelect(item.row)} />
                  </td>
                  <td className="fw-bold">{item.code}</td>
                  <td>{item.name}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select className="form-select form-select-sm" value={item.location} onChange={e => handleChange(idx, 'location', e.target.value)}>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <select className="form-select form-select-sm" value={item.status} onChange={e => handleChange(idx, 'status', e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <input className="form-control form-control-sm" value={item.note} onChange={e => handleChange(idx, 'note', e.target.value)}/>
                  </td>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WaitTable;