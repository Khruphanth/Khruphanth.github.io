import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { fetchSheetData, postAction } from "../../services/api";
import { SHEET_NAMES } from "../../config/config";

const UserTable = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [user, setUser] = useState({
    id: "",
    pass: "",
    status: "user",
    name: "",
  });

  // ---------------- LOAD ----------------
  const loadUsers = async () => {
    setLoading(true);
    try {
      const rows = await fetchSheetData(SHEET_NAMES.LOGIN || "LOGIN");
      const mapped = rows.map((r, i) => ({
        row: i + 2,
        id: r[0],
        pass: r[1],
        status: r[2],
        name: r[3],
      }));
      setList(mapped);
    } catch (e) {
      console.error(e);
      Swal.fire("โหลดข้อมูลล้มเหลว", "", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ---------------- SAVE ----------------
  const saveUser = async (e) => {
    e.preventDefault();
    setShowModal(false);

    Swal.fire({
      title: "กำลังบันทึก...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    if (mode === "add") {
      await postAction("LOGIN", "addUser", {
        id: user.id,
        pass: user.pass,
        status: user.status,
        name: user.name,
      });
    } else {
      await postAction("LOGIN", "updateUser", {
        row: user.row,
        status: user.status,
        name: user.name,
      });
    }

    Swal.fire("สำเร็จ", "", "success");
    loadUsers();
  };

  // ---------------- DELETE ----------------
  const deleteUser = async (row) => {
    const confirm = await Swal.fire({
      title: "ลบสมาชิก?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "กำลังลบ...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    await postAction("LOGIN", "delete", { row });

    Swal.fire("ลบแล้ว", "", "success");
    loadUsers();
  };

  // ---------------- OPEN MODAL ----------------
  const openAdd = () => {
    setUser({ id: "", pass: "", status: "user", name: "" });
    setMode("add");
    setShowModal(true);
  };

  const openEdit = (u) => {
    setUser(u);
    setMode("edit");
    setShowModal(true);
  };

  // ---------------- UI ----------------
  return (
    <div className="card shadow-sm rounded-4">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 className="fw-bold text-primary m-0">จัดการสมาชิก</h5>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          + เพิ่มสมาชิก
        </button>
      </div>

      <div className="table-responsive p-3">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>ชื่อ</th>
              <th>สิทธิ์</th>
              <th className="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center p-4">
                  กำลังโหลด...
                </td>
              </tr>
            ) : (
              list.map((u, i) => (
                <tr key={i}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.status === "admin"
                          ? "bg-danger"
                          : "bg-info text-dark"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-warning btn-sm me-1"
                      onClick={() => openEdit(u)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteUser(u.row)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={saveUser}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {mode === "add" ? "เพิ่มสมาชิก" : "แก้ไขสมาชิก"}
                  </h5>
                </div>

                <div className="modal-body">
                  {mode === "add" && (
                    <>
                      <input
                        required
                        className="form-control mb-2"
                        placeholder="Username"
                        value={user.id}
                        onChange={(e) =>
                          setUser({ ...user, id: e.target.value })
                        }
                      />
                      <input
                        required
                        className="form-control mb-2"
                        placeholder="Password"
                        value={user.pass}
                        onChange={(e) =>
                          setUser({ ...user, pass: e.target.value })
                        }
                      />
                    </>
                  )}

                  <input
                    required
                    className="form-control mb-2"
                    placeholder="ชื่อ-สกุล"
                    value={user.name}
                    onChange={(e) =>
                      setUser({ ...user, name: e.target.value })
                    }
                  />

                  <select
                    className="form-select"
                    value={user.status}
                    onChange={(e) =>
                      setUser({ ...user, status: e.target.value })
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    ปิด
                  </button>
                  <button type="submit" className="btn btn-primary">
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
