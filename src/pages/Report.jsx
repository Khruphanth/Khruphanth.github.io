import React, { useState, useEffect } from 'react';
import { fetchScriptData } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Report = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => { loadInitialData(); }, []);

  // ระบบ Filter ที่แก้ปัญหาเรื่องช่องว่าง (Trim)
  useEffect(() => {
    const filtered = data.filter(item => {
      const sTerm = searchTerm.toLowerCase().trim();
      const itemStatus = String(item["สถานะ"] || "").trim();
      const itemLoc = String(item["ที่เก็บ"] || "").trim();
      const itemCat = String(item["หมวดหมู่"] || "").trim();

      return (
        (sTerm === "" || String(item["ชื่อครุภัณฑ์"]).toLowerCase().includes(sTerm) || String(item["รหัสครุภัณฑ์"]).includes(sTerm)) &&
        (filterStatus === "" || itemStatus === filterStatus) &&
        (filterLocation === "" || itemLoc === filterLocation) &&
        (filterCategory === "" || itemCat === filterCategory)
      );
    });
    setFilteredData(filtered);
  }, [searchTerm, filterStatus, filterLocation, filterCategory, data]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const resData = await fetchScriptData("DATA"); // ดึงจากชีท DATA
      const resLogin = await fetchScriptData("LOGIN"); // ดึงจากชีท LOGIN

      if (Array.isArray(resData)) {
        const clean = resData.filter(row => {
          const id = String(row["รหัสครุภัณฑ์"] || "");
          return id && !id.includes("#") && id !== "รหัสครุภัณฑ์";
        });
        setData(clean);
        setFilteredData(clean);
      }
      
      // ดึงชื่อจากคอลัมน์ D (Name) ในชีท LOGIN
      if (Array.isArray(resLogin) && resLogin.length > 0) {
        const user = resLogin.find(u => u["Name"]) || resLogin[0];
        setUserName(user["Name"] || "ไม่ได้ระบุชื่อ");
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadFont = async () => {
    const response = await fetch('/fonts/Sarabun-Regular.ttf');
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const fontBase64 = await loadFont();
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.addFileToVFS("Sarabun.ttf", fontBase64);
      doc.addFont("Sarabun.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");

      // หัวรายงานพร้อมโลโก้ (เตรียมตำแหน่งไว้ให้)
      // doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20); 
      doc.setFontSize(16);
      doc.text("ใบรายงานสรุปข้อมูลครุภัณฑ์", 105, 18, { align: "center" });
      doc.setFontSize(12);
      doc.text("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น", 105, 25, { align: "center" });
      doc.setFontSize(10);
      doc.text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 195, 32, { align: "right" });

      autoTable(doc, {
        startY: 38,
        head: [['ลำดับ', 'รหัสครุภัณฑ์', 'รายการครุภัณฑ์', 'สถานที่เก็บ', 'สถานะ']],
        body: filteredData.map((item, idx) => [
          idx + 1, item["รหัสครุภัณฑ์"], item["ชื่อครุภัณฑ์"], item["ที่เก็บ"] || "-", item["สถานะ"] || "-"
        ]),
        styles: { font: "Sarabun", fontSize: 10 },
        headStyles: { font: "Sarabun", fontStyle: 'normal', fillColor: [240, 240, 240], textColor: 0, halign: 'center' },
        didDrawPage: (d) => {
          doc.setFontSize(8);
          doc.text(`หน้า ${doc.internal.getNumberOfPages()}`, 190, 285, { align: 'right' });
        }
      });

      // ส่วนลงชื่อท้ายรายงาน ดึงชื่อจาก LOGIN
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text("ลงชื่อ......................................................ผู้ออกรายงาน", 130, finalY);
      doc.text(`( ${userName} )`, 152, finalY + 8, { align: "center" });

      doc.save(`Report_${Date.now()}.pdf`);
    } catch (e) { alert("เกิดข้อผิดพลาดในการสร้าง PDF"); }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm mb-4 p-3 bg-light">
        <div className="row g-2">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="ค้นชื่อ/รหัส..." onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="col-md-2">
            <select className="form-select" onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">ทุกหมวดหมู่</option>
              {[...new Set(data.map(item => String(item["หมวดหมู่"] || "").trim()))].filter(Boolean).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="ปกติ">ปกติ</option>
              <option value="ชำรุด">ชำรุด</option>
              <option value="ใช้งานได้">ใช้งานได้</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="">ทุกที่เก็บ</option>
              {[...new Set(data.map(item => String(item["ที่เก็บ"] || "").trim()))].filter(Boolean).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100 fw-bold" onClick={exportPDF} disabled={loading}>
              {loading ? 'กำลังโหลด...' : 'ดาวน์โหลด PDF รายงาน'}
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive border rounded bg-white" style={{ maxHeight: '500px' }}>
        <table className="table table-sm table-hover m-0">
          <thead className="table-dark sticky-top">
            <tr className="text-center"><th>#</th><th>รหัสครุภัณฑ์</th><th>ชื่อครุภัณฑ์</th><th>ที่เก็บ</th><th>สถานะ</th></tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{row["รหัสครุภัณฑ์"]}</td>
                <td>{row["ชื่อครุภัณฑ์"]}</td>
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