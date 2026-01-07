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

      // 🔥 ตัด header row (แถวหัวตาราง) ทิ้งแน่นอน
      const bodyRows = Array.isArray(rows) ? rows.slice(1) : [];

      const mapped = bodyRows
        .filter(r => r && r[0] && String(r[0]).trim() !== "")
        .map((r, i) => ({
          row: i + 3, // header อยู่แถว 1 → ข้อมูลเริ่มแถว 2
          code: String(r[0]).trim(),
          name: r[1] || "",
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

  useEffect(() => {
    loadWait();
  }, []);

  const handleChange = (index, field, value) => {
    const newData = [...data];
    newData[index][field] = value;
    setData(newData);

    const rowId = newData[index].row;
    setSelectedRows(prev => {
      const s = new Set(prev);
      s.add(rowId);
      return s;
    });
  };

  const toggleSelect = (rowId) => {
    const s = new Set(selectedRows);
    s.has(rowId) ? s.delete(rowId) : s.add(rowId);
    setSelectedRows(s);
  };

  const handleApprove = async () => {
    const items = data.filter(item => selectedRows.has(item.row));
    if (items.length === 0) return;

    const invalid = items.find(i => i.location === "-" || i.status === "-");
    if (invalid) {
      return Swal.fire('ข้อมูลไม่ครบ', `รหัส ${invalid.code} ยังไม่ได้เลือกที่อยู่หรือสถานะ`, 'warning');
    }

    Swal.fire({
      title: 'กำลังบันทึก...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      for (const item of items) {
        await postAction("LOG", "addLog", {
          "รหัส": item.code,
          "ชื่อ": item.name,
          "ที่อยู่": item.location,
          "สถานะ": item.status,
          "หมายเหตุ": item.note
        });
        await postAction("WAIT", "delete", { row: item.row });
      }
      Swal.fire('สำเร็จ', 'อนุมัติเรียบร้อย', 'success');
      loadWait();
    } catch (e) {
      Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
    }
  };

  const renderTime = (val) => {
    if (!val) return "-";
    if (String(val).includes(":")) return String(val).substring(0, 5);
    return val;
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold text-primary m-0">
          รายการรอตรวจสอบ ({data.length})
        </h5>
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" onClick={loadWait}>
            <i className="bi bi-arrow-clockwise"></i> รีเฟรช
          </button>
          <button
            className="btn btn-success"
            onClick={handleApprove}
            disabled={selectedRows.size === 0}
          >
            <i className="bi bi-check-lg"></i> อนุมัติที่เลือก
          </button>
        </div>
      </div>

      <div className="table-responsive p-3">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th width="40"></th>
              <th>รหัส</th>
              <th>ชื่อ</th>
              <th style={{ width: '150px' }}>ที่อยู่</th>
              <th style={{ width: '150px' }}>สถานะ</th>
              <th>หมายเหตุ</th>
              <th>วันที่</th>
              <th>เวลา</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center p-4">กำลังโหลด...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  ไม่พบข้อมูลรายการรอตรวจสอบ
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.row}
                  onClick={() => toggleSelect(item.row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedRows.has(item.row)}
                      onChange={() => toggleSelect(item.row)}
                    />
                  </td>

                  <td className="fw-bold">{item.code}</td>
                  <td>{item.name}</td>

                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className={`form-select form-select-sm ${item.location === '-' ? 'border-danger' : 'border-success'}`}
                      value={item.location}
                      onChange={e => handleChange(idx, 'location', e.target.value)}
                    >
                      {LOCATIONS.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </td>

                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className={`form-select form-select-sm ${item.status === '-' ? 'border-danger' : 'border-success'}`}
                      value={item.status}
                      onChange={e => handleChange(idx, 'status', e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  <td onClick={e => e.stopPropagation()}>
                    <input
                      className="form-control form-control-sm"
                      value={item.note}
                      onChange={e => handleChange(idx, 'note', e.target.value)}
                    />
                  </td>

                  <td>{formatDate(item.date)}</td>
                  <td>{renderTime(item.time)}</td>
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
