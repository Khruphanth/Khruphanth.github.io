import React, { useState, useEffect } from 'react';
import { fetchScriptData } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Report = () => {
  const [data, setData] = useState([]); // ข้อมูลที่รวมแล้ว
  const [filteredData, setFilteredData] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => { loadAllData(); }, []);

  // ระบบกรองข้อมูล
  useEffect(() => {
    const filtered = data.filter(item => {
      const name = String(item["ชื่อครุภัณฑ์"] || "").toLowerCase();
      const code = String(item["รหัสครุภัณฑ์"] || "");
      const status = String(item["สถานะ"] || "").trim();
      const location = String(item["ที่เก็บ"] || "").trim();
      const category = String(item["หมวดหมู่"] || "").trim();

      return (
        (searchTerm === "" || name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm)) &&
        (filterStatus === "" || status === filterStatus) &&
        (filterLocation === "" || location === filterLocation) &&
        (filterCategory === "" || category === filterCategory)
      );
    });
    setFilteredData(filtered);
  }, [searchTerm, filterStatus, filterLocation, filterCategory, data]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resShow, resData, resLogin] = await Promise.all([
        fetchScriptData("SHOW"), // ข้อมูลหลัก รหัส/ชื่อ/ที่เก็บ/สถานะ
        fetchScriptData("DATA"), // ข้อมูลหมวดหมู่
        fetchScriptData("LOGIN") // ข้อมูลผู้ออกรายงาน
      ]);

      // 1. ล้าง Key ข้อมูลจาก SHOW และ DATA
      const cleanShow = resShow.map(r => {
        let n = {}; Object.keys(r).forEach(k => n[k.trim()] = r[k]); return n;
      });
      const cleanData = resData.map(r => {
        let n = {}; Object.keys(r).forEach(k => n[k.trim()] = r[k]); return n;
      });

      // 2. รวมข้อมูล (Merge) โดยใช้ รหัสครุภัณฑ์ เป็นตัวเชื่อม
      const merged = cleanShow.map(showItem => {
        const dataItem = cleanData.find(d => d["รหัสครุภัณฑ์"] === showItem["รหัสครุภัณฑ์"]);
        return {
          ...showItem,
          "หมวดหมู่": dataItem ? dataItem["หมวดหมู่"] : "ไม่ระบุ"
        };
      }).filter(row => row["รหัสครุภัณฑ์"] && !String(row["รหัสครุภัณฑ์"]).includes("#N/A"));

      setData(merged);
      setFilteredData(merged);

      // 3. ดึงชื่อจาก LOGIN (คอลัมน์ D=Name)
      if (Array.isArray(resLogin)) {
        const cleanLogin = resLogin.map(r => {
          let n = {}; Object.keys(r).forEach(k => n[k.trim()] = r[k]); return n;
        });
        const user = cleanLogin.find(u => u["Name"]);
        setUserName(user ? user["Name"] : "ผู้ออกรายงาน");
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const response = await fetch('/fonts/Sarabun-Regular.ttf');
      const fontBase64 = window.btoa(new Uint8Array(await response.arrayBuffer()).reduce((d, b) => d + String.fromCharCode(b), ''));

      const doc = new jsPDF('p', 'mm', 'a4');
      doc.addFileToVFS("Sarabun.ttf", fontBase64);
      doc.addFont("Sarabun.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");

      // --- หัวรายงาน ---
      // 
      doc.setFontSize(18);
      doc.text("ใบรายงานสรุปข้อมูลครุภัณฑ์", 105, 15, { align: "center" });
      doc.setFontSize(11);
      doc.text("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น", 105, 21, { align: "center" });
      doc.setFontSize(9);
      doc.text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 195, 28, { align: "right" });

      autoTable(doc, {
        startY: 32,
        head: [['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์', 'หมวดหมู่', 'ที่เก็บ', 'สถานะ']],
        body: filteredData.map((item, idx) => [
          idx + 1, item["รหัสครุภัณฑ์"], item["ชื่อครุภัณฑ์"], item["หมวดหมู่"], item["ที่เก็บ"] || "-", item["สถานะ"] || "-"
        ]),
        styles: { font: "Sarabun", fontSize: 9 },
        headStyles: { font: "Sarabun", fontStyle: 'normal', fillColor: [240, 240, 240], textColor: 0, halign: 'center' }
      });

      // --- ลงชื่อตอนท้าย ---
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(11);
      doc.text("ลงชื่อ......................................................ผู้ออกรายงาน", 130, finalY);
      doc.text(`( ${userName} )`, 152, finalY + 8, { align: "center" });

      doc.save(`Report_${Date.now()}.pdf`);
    } catch (e) { alert("เกิดข้อผิดพลาดในการโหลดฟอนต์"); }
    setLoading(false);
  };

  const getOptions = (key) => [...new Set(data.map(item => String(item[key] || "").trim()))].filter(v => v && !v.includes("#"));

  return (
    <div className="container mt-4">
      <div className="card p-3 shadow-sm bg-light mb-4 border-0">
        <div className="row g-2">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="ค้นหาชื่อ/รหัส..." onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="col-md-2">
            <select className="form-select" onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">ทุกหมวดหมู่</option>
              {getOptions("หมวดหมู่").map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              {getOptions("สถานะ").map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="">ทุกที่เก็บ</option>
              {getOptions("ที่เก็บ").map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100 fw-bold" onClick={exportPDF} disabled={loading}>ออกรายงาน PDF</button>
          </div>
        </div>
      </div>

      <div className="table-responsive border rounded bg-white" style={{ maxHeight: '500px' }}>
        <table className="table table-sm m-0">
          <thead className="table-dark sticky-top text-center">
            <tr><th>#</th><th>รหัส</th><th>ชื่อครุภัณฑ์</th><th>หมวด</th><th>ที่เก็บ</th><th>สถานะ</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{row["รหัสครุภัณฑ์"]}</td>
                <td>{row["ชื่อครุภัณฑ์"]}</td>
                <td className="text-center">{row["หมวดหมู่"]}</td>
                <td>{row["ที่เก็บ"]}</td>
                <td className="text-center">{row["สถานะ"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Report;