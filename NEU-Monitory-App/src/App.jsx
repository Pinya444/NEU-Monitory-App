import { useState, useEffect, useMemo } from "react";

const INDUSTRIES = ["Telecom", "Food", "Services", "Technology", "Finance", "Healthcare", "Education", "Manufacturing", "Retail", "Government"];
const COLLEGES = ["CCS", "CBA", "CAS", "COE", "COED", "CON", "CAHS", "CLA", "CCJE", "CAFA"];

const STATUS_LIST = [
  { value: "APPROVED_SIGNED", label: "APPROVED: Signed by President", group: "APPROVED", color: "#166534", bg: "#dcfce7", border: "#86efac" },
  { value: "APPROVED_NOTARIZING", label: "APPROVED: On-going notarization", group: "APPROVED", color: "#14532d", bg: "#dcfce7", border: "#86efac" },
  { value: "APPROVED_NO_NOTARIZATION", label: "APPROVED: No notarization needed", group: "APPROVED", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  { value: "PROCESSING_HTE", label: "PROCESSING: Awaiting HTE partner signature", group: "PROCESSING", color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  { value: "PROCESSING_LEGAL", label: "PROCESSING: MOA draft sent to Legal Office", group: "PROCESSING", color: "#78350f", bg: "#fef3c7", border: "#fcd34d" },
  { value: "PROCESSING_VPAA", label: "PROCESSING: Sent to VPAA/OP for approval", group: "PROCESSING", color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  { value: "EXPIRED", label: "EXPIRED: No renewal done", group: "EXPIRED", color: "#7f1d1d", bg: "#fee2e2", border: "#fca5a5" },
  { value: "EXPIRING", label: "EXPIRING: Within 2 months of expiration", group: "EXPIRING", color: "#9a3412", bg: "#ffedd5", border: "#fdba74" },
];

const getStatusMeta = (val) => STATUS_LIST.find(s => s.value === val) || STATUS_LIST[0];

const MOCK_USERS = [
  { id: "u1", name: "Admin NEU", email: "admin@neu.edu.ph", role: "admin", blocked: false, avatar: "AN" },
  { id: "u2", name: "Dr. Maria Santos", email: "m.santos@neu.edu.ph", role: "faculty", blocked: false, avatar: "MS", canMaintain: true },
  { id: "u3", name: "Prof. Juan dela Cruz", email: "j.delacruz@neu.edu.ph", role: "faculty", blocked: false, avatar: "JD", canMaintain: false },
  { id: "u4", name: "Angelo Cruz", email: "a.cruz@students.neu.edu.ph", role: "student", blocked: false, avatar: "AC" },
  { id: "u5", name: "Bianca Reyes", email: "b.reyes@students.neu.edu.ph", role: "student", blocked: true, avatar: "BR" },
];

const today = new Date();
const d = (offset) => { const dt = new Date(today); dt.setMonth(dt.getMonth() + offset); return dt.toISOString().split('T')[0]; };

const MOCK_MOAS = [
  { id: "m1", hteid: "HTE-2024-001", company: "Globe Telecom Inc.", address: "The Globe Tower, Bonifacio Global City, Taguig", contact: "Rosario Bautista", contactEmail: "r.bautista@globe.com.ph", industry: "Telecom", effectiveDate: d(-18), status: "APPROVED_SIGNED", college: "CCS", deleted: false, audit: [{ user: "Dr. Maria Santos", date: "2024-01-15 09:32", op: "INSERT" }] },
  { id: "m2", hteid: "HTE-2024-002", company: "Jollibee Foods Corp.", address: "10 F Jollibee Plaza, Ortigas, Pasig City", contact: "Carlo Mendoza", contactEmail: "c.mendoza@jollibee.com.ph", industry: "Food", effectiveDate: d(-6), status: "APPROVED_NOTARIZING", college: "CBA", deleted: false, audit: [{ user: "Dr. Maria Santos", date: "2024-06-10 14:05", op: "INSERT" }] },
  { id: "m3", hteid: "HTE-2024-003", company: "Accenture Philippines", address: "6788 Ayala Ave, Makati City", contact: "Patricia Lim", contactEmail: "p.lim@accenture.com", industry: "Technology", effectiveDate: d(-24), status: "EXPIRED", college: "CCS", deleted: false, audit: [{ user: "Admin NEU", date: "2023-12-01 10:00", op: "INSERT" }, { user: "Admin NEU", date: "2024-12-01 10:00", op: "UPDATE" }] },
  { id: "m4", hteid: "HTE-2024-004", company: "BDO Unibank", address: "BDO Corporate Center, Makati City", contact: "Fernando Garcia", contactEmail: "f.garcia@bdo.com.ph", industry: "Finance", effectiveDate: d(-1), status: "EXPIRING", college: "CBA", deleted: false, audit: [{ user: "Dr. Maria Santos", date: "2024-09-20 11:22", op: "INSERT" }] },
  { id: "m5", hteid: "HTE-2024-005", company: "Philippine General Hospital", address: "Taft Ave, Manila", contact: "Dr. Nena Ramos", contactEmail: "n.ramos@pgh.gov.ph", industry: "Healthcare", effectiveDate: d(6), status: "PROCESSING_LEGAL", college: "CON", deleted: false, audit: [{ user: "Prof. Juan dela Cruz", date: "2025-01-05 08:44", op: "INSERT" }] },
  { id: "m6", hteid: "HTE-2024-006", company: "PLDT Inc.", address: "Ramon Cojuangco Bldg, Makati", contact: "Alicia Torres", contactEmail: "a.torres@pldt.com.ph", industry: "Telecom", effectiveDate: d(12), status: "PROCESSING_HTE", college: "COE", deleted: false, audit: [{ user: "Admin NEU", date: "2025-02-14 16:30", op: "INSERT" }] },
  { id: "m7", hteid: "HTE-2023-007", company: "SM Prime Holdings", address: "Mall of Asia Arena Complex, Pasay City", contact: "Vincent Sy", contactEmail: "v.sy@smprime.com", industry: "Retail", effectiveDate: d(-3), status: "APPROVED_NO_NOTARIZATION", college: "CBA", deleted: true, audit: [{ user: "Dr. Maria Santos", date: "2023-08-10 09:00", op: "INSERT" }, { user: "Admin NEU", date: "2025-03-01 17:00", op: "SOFT DELETE" }] },
  { id: "m8", hteid: "HTE-2025-008", company: "Manulife Philippines", address: "NEX Tower, 6786 Ayala Ave, Makati", contact: "Grace Villanueva", contactEmail: "g.villanueva@manulife.com.ph", industry: "Finance", effectiveDate: d(18), status: "PROCESSING_VPAA", college: "CBA", deleted: false, audit: [{ user: "Dr. Maria Santos", date: "2025-01-20 13:00", op: "INSERT" }] },
];

const Badge = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, whiteSpace: "nowrap" }}>
      {meta.group}
    </span>
  );
};

const Avatar = ({ initials, color = "#1e40af" }) => (
  <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
    {initials}
  </div>
);

const roleColors = { admin: "#7c3aed", faculty: "#0369a1", student: "#15803d" };

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [moas, setMoas] = useState(MOCK_MOAS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMOA, setEditMOA] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [form, setForm] = useState({});
  const [showAudit, setShowAudit] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const canMaintain = currentUser && (currentUser.role === "admin" || (currentUser.role === "faculty" && users.find(u => u.id === currentUser.id)?.canMaintain));

  const filteredMOAs = useMemo(() => {
    let list = moas;
    if (currentUser?.role === "student") list = list.filter(m => !m.deleted && ["APPROVED_SIGNED", "APPROVED_NOTARIZING", "APPROVED_NO_NOTARIZATION"].includes(m.status));
    else if (currentUser?.role === "faculty") list = list.filter(m => !m.deleted);
    // admin sees all

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.company.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q) ||
        m.contact.toLowerCase().includes(q) ||
        m.college.toLowerCase().includes(q) ||
        m.industry.toLowerCase().includes(q) ||
        getStatusMeta(m.status).group.toLowerCase().includes(q)
      );
    }
    if (filterCollege) list = list.filter(m => m.college === filterCollege);
    if (filterIndustry) list = list.filter(m => m.industry === filterIndustry);
    if (filterStatus) list = list.filter(m => getStatusMeta(m.status).group === filterStatus);
    if (filterDateFrom) list = list.filter(m => m.effectiveDate >= filterDateFrom);
    if (filterDateTo) list = list.filter(m => m.effectiveDate <= filterDateTo);
    return list;
  }, [moas, currentUser, search, filterCollege, filterIndustry, filterStatus, filterDateFrom, filterDateTo]);

  const stats = useMemo(() => {
    const active = moas.filter(m => !m.deleted && ["APPROVED_SIGNED", "APPROVED_NOTARIZING", "APPROVED_NO_NOTARIZATION"].includes(m.status));
    const processing = moas.filter(m => !m.deleted && ["PROCESSING_HTE", "PROCESSING_LEGAL", "PROCESSING_VPAA"].includes(m.status));
    const expired = moas.filter(m => !m.deleted && m.status === "EXPIRED");
    const expiring = moas.filter(m => !m.deleted && m.status === "EXPIRING");
    return { active: active.length, processing: processing.length, expired: expired.length, expiring: expiring.length, total: moas.filter(m => !m.deleted).length };
  }, [moas]);

  const openAdd = () => {
    setEditMOA(null);
    setForm({ hteid: "", company: "", address: "", contact: "", contactEmail: "", industry: "Technology", effectiveDate: "", status: "PROCESSING_HTE", college: "CCS" });
    setShowModal(true);
  };

  const openEdit = (moa) => {
    setEditMOA(moa);
    setForm({ ...moa });
    setShowModal(true);
  };

  const saveMOA = () => {
    const now = new Date().toLocaleString("en-PH");
    if (editMOA) {
      setMoas(prev => prev.map(m => m.id === editMOA.id ? {
        ...m, ...form,
        audit: [...m.audit, { user: currentUser.name, date: now, op: "UPDATE" }]
      } : m));
      notify("MOA updated successfully.");
    } else {
      const newMOA = {
        id: "m" + Date.now(), ...form, deleted: false,
        audit: [{ user: currentUser.name, date: now, op: "INSERT" }]
      };
      setMoas(prev => [...prev, newMOA]);
      notify("MOA added successfully.");
    }
    setShowModal(false);
  };

  const softDelete = (id) => {
    const now = new Date().toLocaleString("en-PH");
    setMoas(prev => prev.map(m => m.id === id ? {
      ...m, deleted: true,
      audit: [...m.audit, { user: currentUser.name, date: now, op: "SOFT DELETE" }]
    } : m));
    notify("MOA removed (soft delete).", "warning");
    setConfirmAction(null);
  };

  const recoverMOA = (id) => {
    const now = new Date().toLocaleString("en-PH");
    setMoas(prev => prev.map(m => m.id === id ? {
      ...m, deleted: false,
      audit: [...m.audit, { user: currentUser.name, date: now, op: "RECOVER" }]
    } : m));
    notify("MOA recovered successfully.");
  };

  const toggleBlock = (uid) => {
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, blocked: !u.blocked } : u));
    notify("User access updated.");
  };

  const toggleMaintain = (uid) => {
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, canMaintain: !u.canMaintain } : u));
    notify("Faculty permissions updated.");
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
          <div style={{ background: "#1e3a5f", borderRadius: 12, padding: "12px 16px", display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span style={{ color: "#f59e0b", fontSize: 22, fontWeight: 700 }}>NEU</span>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>MOA Monitoring System</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 32 }}>Use your institutional NEU email to access the system.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK_USERS.filter(u => !u.blocked).map(u => (
              <button key={u.id} onClick={() => { setCurrentUser(u); setActiveTab("dashboard"); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: 10, background: "#f9fafb", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
              >
                <Avatar initials={u.avatar} color={roleColors[u.role]} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{u.email}</div>
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: roleColors[u.role] + "20", color: roleColors[u.role], fontWeight: 600, textTransform: "capitalize" }}>{u.role}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 20 }}>Demo: Click any user to sign in</p>
        </div>
      </div>
    );
  }

  const role = currentUser.role;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "◉", roles: ["admin", "faculty", "student"] },
    { id: "moas", label: "MOA List", icon: "≡", roles: ["admin", "faculty", "student"] },
    ...(role === "admin" ? [{ id: "users", label: "User Management", icon: "👤", roles: ["admin"] }] : []),
  ];

  const visibleTabs = tabs.filter(t => t.roles.includes(role));

  const columns = {
    student: ["company", "address", "contact", "contactEmail"],
    faculty: ["hteid", "company", "address", "contact", "contactEmail", "industry", "effectiveDate", "status", "college"],
    admin: ["hteid", "company", "address", "contact", "contactEmail", "industry", "effectiveDate", "status", "college", "deleted", "audit"],
  };

  const colLabels = { hteid: "HTE ID", company: "Company", address: "Address", contact: "Contact Person", contactEmail: "Email", industry: "Industry", effectiveDate: "Effective Date", status: "Status", college: "College", deleted: "Deleted", audit: "Audit Trail" };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f0f4f8", minHeight: "100vh" }}>
      {/* Notification */}
      {notification && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: notification.type === "success" ? "#dcfce7" : notification.type === "warning" ? "#fef3c7" : "#fee2e2", color: notification.type === "success" ? "#166534" : notification.type === "warning" ? "#92400e" : "#991b1b", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: `1px solid ${notification.type === "success" ? "#86efac" : notification.type === "warning" ? "#fcd34d" : "#fca5a5"}` }}>
          {notification.msg}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, width: 220, height: "100vh", background: "#1e3a5f", display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#f59e0b", fontSize: 20, fontWeight: 800 }}>NEU</span>
            <div>
              <div style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>MOA Monitor</div>
              <div style={{ color: "#94a3b8", fontSize: 10 }}>v1.0.0</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 8px", flex: 1 }}>
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 4, background: activeTab === tab.id ? "rgba(245,158,11,0.2)" : "transparent", color: activeTab === tab.id ? "#f59e0b" : "#94a3b8", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, textAlign: "left", transition: "all 0.15s" }}>
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Avatar initials={currentUser.avatar} color="#f59e0b" />
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{currentUser.name.split(" ")[0]}</div>
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: roleColors[role] + "40", color: "#fff", fontWeight: 600 }}>{role}</span>
            </div>
          </div>
          <button onClick={() => setCurrentUser(null)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 220, padding: 24 }}>
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>Dashboard</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Overview of MOA status across all colleges</p>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Active MOAs", value: stats.active, color: "#166534", bg: "#dcfce7" },
                { label: "Processing", value: stats.processing, color: "#92400e", bg: "#fef3c7" },
                { label: "Expiring Soon", value: stats.expiring, color: "#9a3412", bg: "#ffedd5" },
                { label: "Expired", value: stats.expired, color: "#7f1d1d", bg: "#fee2e2" },
                { label: "Total Active", value: stats.total, color: "#1e3a5f", bg: "#dbeafe" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: s.bg }} />
                </div>
              ))}
            </div>

            {/* Filter Row */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Filter Statistics</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, color: "#374151", background: "#fff" }}>
                  <option value="">All Colleges</option>
                  {COLLEGES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} placeholder="From" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, color: "#374151" }} />
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} placeholder="To" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, color: "#374151" }} />
                <button onClick={() => { setFilterCollege(""); setFilterDateFrom(""); setFilterDateTo(""); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13, color: "#374151" }}>Reset</button>
              </div>
            </div>

            {/* By College */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e3a5f", marginBottom: 16 }}>MOAs by College</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {COLLEGES.map(col => {
                  const count = moas.filter(m => !m.deleted && m.college === col && (!filterCollege || m.college === filterCollege)).length;
                  return (
                    <div key={col} style={{ padding: "12px 16px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{col}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MOA List Tab */}
        {activeTab === "moas" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>MOA List</h1>
                <p style={{ color: "#6b7280", fontSize: 14 }}>
                  {role === "student" ? "Showing all approved MOAs" : role === "faculty" ? "Showing all active MOAs" : "Showing all MOA records including deleted"}
                </p>
              </div>
              {canMaintain && (
                <button onClick={openAdd} style={{ padding: "10px 20px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  + Add MOA
                </button>
              )}
            </div>

            {/* Search & Filters */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #e5e7eb" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company, college, industry, contact, address, status..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, color: "#374151", background: "#fff" }}>
                  <option value="">All Colleges</option>
                  {COLLEGES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, color: "#374151", background: "#fff" }}>
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, color: "#374151", background: "#fff" }}>
                  <option value="">All Status</option>
                  {["APPROVED", "PROCESSING", "EXPIRED", "EXPIRING"].map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => { setSearch(""); setFilterCollege(""); setFilterIndustry(""); setFilterStatus(""); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Reset</button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>{filteredMOAs.length} record(s) found</div>

            {/* Table */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    {columns[role].map(col => (
                      <th key={col} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{colLabels[col]}</th>
                    ))}
                    {canMaintain && <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, color: "#374151" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMOAs.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No MOAs found.</td></tr>
                  ) : filteredMOAs.map((moa, idx) => (
                    <tr key={moa.id} style={{ borderBottom: "1px solid #f1f5f9", background: moa.deleted ? "#fef9f9" : idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      {columns[role].map(col => (
                        <td key={col} style={{ padding: "10px 14px", color: moa.deleted ? "#9ca3af" : "#1f2937", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: col === "audit" ? "normal" : "nowrap" }}>
                          {col === "status" ? <><Badge status={moa.status} /><div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{getStatusMeta(moa.status).label.split(": ")[1]}</div></>
                            : col === "deleted" ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: moa.deleted ? "#fee2e2" : "#dcfce7", color: moa.deleted ? "#991b1b" : "#166534", fontWeight: 600 }}>{moa.deleted ? "Deleted" : "Active"}</span>
                              : col === "audit" ? (
                                <button onClick={() => setShowAudit(moa)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", color: "#374151" }}>
                                  View ({moa.audit.length})
                                </button>
                              )
                                : moa[col]}
                        </td>
                      ))}
                      {canMaintain && (
                        <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {!moa.deleted ? (
                            <>
                              <button onClick={() => openEdit(moa)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", marginRight: 6, color: "#374151" }}>Edit</button>
                              {role === "admin" && <button onClick={() => setConfirmAction({ type: "delete", id: moa.id, label: moa.company })} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff5f5", cursor: "pointer", color: "#dc2626" }}>Delete</button>}
                            </>
                          ) : (
                            role === "admin" && <button onClick={() => recoverMOA(moa.id)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #86efac", background: "#f0fdf4", cursor: "pointer", color: "#166534" }}>Recover</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && role === "admin" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>User Management</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Manage user access and permissions</p>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    {["User", "Email", "Role", "Can Maintain MOAs", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: u.blocked ? "#fffbeb" : "#fff" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar initials={u.avatar} color={roleColors[u.role]} />
                          <span style={{ fontWeight: 500, color: "#111" }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#6b7280" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: roleColors[u.role] + "20", color: roleColors[u.role], fontWeight: 600 }}>{u.role}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.role === "faculty" ? (
                          <button onClick={() => toggleMaintain(u.id)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: u.canMaintain ? "#dcfce7" : "#f1f5f9", color: u.canMaintain ? "#166534" : "#6b7280", fontWeight: 600 }}>
                            {u.canMaintain ? "✓ Granted" : "✗ Denied"}
                          </button>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 12 }}>{u.role === "admin" ? "Full Access" : "Read Only"}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: u.blocked ? "#fee2e2" : "#dcfce7", color: u.blocked ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                          {u.blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.id !== currentUser.id && (
                          <button onClick={() => toggleBlock(u.id)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${u.blocked ? "#86efac" : "#fca5a5"}`, background: u.blocked ? "#f0fdf4" : "#fff5f5", cursor: "pointer", color: u.blocked ? "#166534" : "#dc2626", fontWeight: 500 }}>
                            {u.blocked ? "Unblock" : "Block"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MOA Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 20 }}>{editMOA ? "Edit MOA" : "Add New MOA"}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "hteid", label: "HTE ID", type: "text" },
                { key: "company", label: "Company Name", type: "text" },
                { key: "contact", label: "Contact Person", type: "text" },
                { key: "contactEmail", label: "Contact Email", type: "email" },
                { key: "effectiveDate", label: "Effective Date", type: "date" },
              ].map(f => (
                <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{f.label}</label>
                  <input type={f.type} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
                </div>
              ))}

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Industry</label>
                <select value={form.industry || ""} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>College</label>
                <select value={form.college || ""} onChange={e => setForm(p => ({ ...p, college: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  {COLLEGES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Status</label>
                <select value={form.status || ""} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Address</label>
                <textarea value={form.address || ""} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={saveMOA} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAudit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>Audit Trail</h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>{showAudit.company}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {showAudit.audit.map((a, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1e3a5f" }}>{a.user}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: a.op === "INSERT" ? "#dcfce7" : a.op === "UPDATE" ? "#dbeafe" : a.op === "SOFT DELETE" ? "#fee2e2" : "#f0fdf4", color: a.op === "INSERT" ? "#166534" : a.op === "UPDATE" ? "#1d4ed8" : a.op === "SOFT DELETE" ? "#dc2626" : "#166534", fontWeight: 600 }}>{a.op}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{a.date}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAudit(null)} style={{ marginTop: 20, width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Close</button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>Soft Delete MOA?</h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>This will mark <strong>{confirmAction.label}</strong> as deleted. It can be recovered by the admin.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={() => softDelete(confirmAction.id)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
