import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { fetchSheetData, postAction } from '../services/api';
import { SHEET_NAMES } from '../config/config';
import { AuthService } from '../services/auth'; // นำเข้าเพื่อดึงข้อมูล User

const Report = () => {
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [currentUser, setCurrentUser] = useState(null); // เก็บข้อมูลผู้ใช้
  const reportRef = useRef();

  useEffect(() => {
    // ดึงชื่อผู้ใช้จากระบบ Login
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);

    const load = async () => {
      const rows = await fetchSheetData(SHEET_NAMES.SHOW || "SHOW");
      setRawData(rows.length > 1 ? rows.slice(1) : []);
    };
    load();
  }, []);

  // ... (handleSearch และ handleExport เหมือนเดิม) ...

  return (
    <div className="container py-4">
      {/* ... ส่วน Search Filter ... */}

      {/* ฟอร์มรายงานที่ปรับแก้ใหม่ */}
      <div ref={reportRef} className="bg-white p-5 shadow-sm mx-auto" style={{ width: '210mm', minHeight: '297mm', color: '#000' }}>
        <div className="text-center mb-4">
          <h4 className="fw-bold">ใบรายงานสรุปสถานะครุภัณฑ์</h4>
          <p>ระบบจัดการข้อมูลครุภัณฑ์ออนไลน์</p>
          <hr />
        </div>
        
        <div className="row mb-4">
          <div className="col-8">
            {/* 1. ใช้ชื่อจากระบบ Login (คอลัมน์ name ในชีท) */}
            <p className="mb-1"><strong>ผู้พิมพ์รายงาน:</strong> {currentUser ? currentUser.name : 'แอดมินระบบ'}</p>
            {/* 2. เปลี่ยนชื่อหน่วยงานตามสั่ง */}
            <p><strong>หน่วยงาน:</strong> คณะ/สาขา ครุศาสตร์อุตสาหกรรม คอมพิวเตอร์</p>
          </div>
          <div className="col-4 text-end">
            <p><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH')}</p>
          </div>
        </div>

        <table className="table table-bordered border-dark">
          <thead className="text-center bg-light">
            <tr>
              <th>ลำดับ</th><th>รหัสครุภัณฑ์</th><th>ชื่อรายการ</th><th>สถานะ</th><th>สถานที่</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((item, idx) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{item.code}</td><td>{item.name}</td>
                <td className="text-center">{item.status}</td><td>{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 row">
          <div className="col-7"></div>
          <div className="col-5 text-center">
            {/* 3. เอาวงเล็บ ( ) ออกจากส่วนลงชื่อ */}
            <p className="mb-5">ลงชื่อ...........................................................</p>
            <p>ผู้ออกรายงาน</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;