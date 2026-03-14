import { useState, useEffect, useMemo } from "react";
import { auth, provider, db } from "./firebase/config";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, doc, addDoc, updateDoc, getDocs,
  onSnapshot, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { seedMOAs } from "./firebase/seed";

const INDUSTRIES = ["Telecom","Food","Services","Technology","Finance","Healthcare","Education","Manufacturing","Retail","Government"];
const COLLEGES = ["CCS","CBA","CAS","COE","COED","CON","CAHS","CLA","CCJE","CAFA"];
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
const roleColors = { admin: "#7c3aed", faculty: "#0369a1", student: "#15803d" };
const NEU_DOMAINS = ["@neu.edu.ph", "@students.neu.edu.ph", "@gmail.com"];

const Badge = ({ status }) => {
  const meta = getStatusMeta(status);
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, whiteSpace: "nowrap" }}>{meta.group}</span>;
};

const Avatar = ({ initials, color = "#1e40af" }) => (
  <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
);

const getInitials = (name) => name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moas, setMoas] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMOA, setEditMOA] = useState(null);
  const [form, setForm] = useState({});
  const [showAudit, setShowAudit] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notification, setNotification] = useState(null);
  const [authError, setAuthError] = useState("");
  const [seeding, setSeeding] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const allowed = NEU_DOMAINS.some(d => user.email.endsWith(d));
        if (!allowed) {
          await signOut(auth);
          setAuthError("Please use your NEU institutional email (@neu.edu.ph or @students.neu.edu.ph).");
          setLoading(false);
          return;
        }
        setAuthUser(user);
        // Get or create user doc in Firestore
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        const existing = snap.docs.find(d => d.data().email === user.email);
        if (existing) {
          const data = { id: existing.id, ...existing.data() };
          if (data.blocked) {
            await signOut(auth);
            setAuthError("Your account has been blocked. Contact the administrator.");
            setAuthUser(null);
            setLoading(false);
            return;
          }
          setUserDoc(data);
        } else {
          // Auto-assign role based on email
          const isStudent = user.email.includes("@students.neu.edu.ph") || user.email.includes("@gmail.com");
          const role = snap.docs.length === 0 ? "admin" : isStudent ? "student" : "faculty";
          const newUser = { name: user.displayName, email: user.email, role, blocked: false, canMaintain: false, photoURL: user.photoURL };
          const ref = await addDoc(usersRef, newUser);
          setUserDoc({ id: ref.id, ...newUser });
        }
      } else {
        setAuthUser(null);
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen to MOAs
  useEffect(() => {
    if (!userDoc) return;
    const unsub = onSnapshot(collection(db, "moas"), (snap) => {
      setMoas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userDoc]);

  // Listen to Users (admin only)
  useEffect(() => {
    if (!userDoc || userDoc.role !== "admin") return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userDoc]);

  const handleSignIn = async () => {
    setAuthError("");
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      setAuthError("Sign-in failed. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUserDoc(null);
    setActiveTab("dashboard");
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedMOAs(userDoc.name);
    setSeeding(false);
    notify("Sample MOA data seeded!");
  };

  const role = userDoc?.role;
  const canMaintain = role === "admin" || (role === "faculty" && userDoc?.canMaintain);

  const filteredMOAs = useMemo(() => {
    let list = moas;
    if (role === "student") list = list.filter(m => !m.deleted && ["APPROVED_SIGNED","APPROVED_NOTARIZING","APPROVED_NO_NOTARIZATION"].includes(m.status));
    else if (role === "faculty") list = list.filter(m => !m.deleted);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => m.company?.toLowerCase().includes(q) || m.address?.toLowerCase().includes(q) || m.contact?.toLowerCase().includes(q) || m.college?.toLowerCase().includes(q) || m.industry?.toLowerCase().includes(q) || getStatusMeta(m.status).group.toLowerCase().includes(q));
    }
    if (filterCollege) list = list.filter(m => m.college === filterCollege);
    if (filterIndustry) list = list.filter(m => m.industry === filterIndustry);
    if (filterStatus) list = list.filter(m => getStatusMeta(m.status).group === filterStatus);
    if (filterDateFrom) list = list.filter(m => m.effectiveDate >= filterDateFrom);
    if (filterDateTo) list = list.filter(m => m.effectiveDate <= filterDateTo);
    return list;
  }, [moas, role, search, filterCollege, filterIndustry, filterStatus, filterDateFrom, filterDateTo]);

  const stats = useMemo(() => ({
    active: moas.filter(m => !m.deleted && ["APPROVED_SIGNED","APPROVED_NOTARIZING","APPROVED_NO_NOTARIZATION"].includes(m.status)).length,
    processing: moas.filter(m => !m.deleted && ["PROCESSING_HTE","PROCESSING_LEGAL","PROCESSING_VPAA"].includes(m.status)).length,
    expired: moas.filter(m => !m.deleted && m.status === "EXPIRED").length,
    expiring: moas.filter(m => !m.deleted && m.status === "EXPIRING").length,
    total: moas.filter(m => !m.deleted).length,
  }), [moas]);

  const openAdd = () => {
    setEditMOA(null);
    setForm({ hteid: "", company: "", address: "", contact: "", contactEmail: "", industry: "Technology", effectiveDate: "", status: "PROCESSING_HTE", college: "CCS" });
    setShowModal(true);
  };

  const openEdit = (moa) => { setEditMOA(moa); setForm({ ...moa }); setShowModal(true); };

  const saveMOA = async () => {
    const now = new Date().toLocaleString("en-PH");
    const auditEntry = { user: userDoc.name, date: now, op: editMOA ? "UPDATE" : "INSERT" };
    if (editMOA) {
      const ref = doc(db, "moas", editMOA.id);
      await updateDoc(ref, { ...form, audit: [...(editMOA.audit || []), auditEntry] });
      notify("MOA updated successfully.");
    } else {
      await addDoc(collection(db, "moas"), { ...form, deleted: false, audit: [auditEntry], createdAt: serverTimestamp() });
      notify("MOA added successfully.");
    }
    setShowModal(false);
  };

  const softDelete = async (moa) => {
    const now = new Date().toLocaleString("en-PH");
    const ref = doc(db, "moas", moa.id);
    await updateDoc(ref, { deleted: true, audit: [...(moa.audit || []), { user: userDoc.name, date: now, op: "SOFT DELETE" }] });
    notify("MOA removed (soft delete).", "warning");
    setConfirmAction(null);
  };

  const recoverMOA = async (moa) => {
    const now = new Date().toLocaleString("en-PH");
    const ref = doc(db, "moas", moa.id);
    await updateDoc(ref, { deleted: false, audit: [...(moa.audit || []), { user: userDoc.name, date: now, op: "RECOVER" }] });
    notify("MOA recovered successfully.");
  };

  const toggleBlock = async (u) => {
    await updateDoc(doc(db, "users", u.id), { blocked: !u.blocked });
    notify("User access updated.");
  };

  const toggleMaintain = async (u) => {
    await updateDoc(doc(db, "users", u.id), { canMaintain: !u.canMaintain });
    notify("Faculty permissions updated.");
  };

  const changeRole = async (u, newRole) => {
    await updateDoc(doc(db, "users", u.id), { role: newRole });
    notify("User role updated.");
  };

  const columns = {
    student: ["company","address","contact","contactEmail"],
    faculty: ["hteid","company","address","contact","contactEmail","industry","effectiveDate","status","college"],
    admin: ["hteid","company","address","contact","contactEmail","industry","effectiveDate","status","college","deleted","audit"],
  };
  const colLabels = { hteid:"HTE ID", company:"Company", address:"Address", contact:"Contact Person", contactEmail:"Email", industry:"Industry", effectiveDate:"Effective Date", status:"Status", college:"College", deleted:"Status", audit:"Audit Trail" };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f2040", fontFamily: "system-ui" }}>
      <div style={{ color: "#fff", fontSize: 16 }}>Loading...</div>
    </div>
  );

  if (!authUser || !userDoc) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 48, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
        <div style={{ background: "#1e3a5f", borderRadius: 12, padding: "12px 16px", display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ color: "#f59e0b", fontSize: 22, fontWeight: 700 }}>NEU</span>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>MOA Monitoring System</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>Sign In</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>Use your NEU institutional Google account to access the system.</p>
        {authError && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, border: "1px solid #fca5a5" }}>{authError}</div>}
        <button onClick={handleSignIn} style={{ width: "100%", padding: "12px 20px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          Sign in with Google
        </button>
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 16 }}>Only @neu.edu.ph and @students.neu.edu.ph emails are allowed.</p>
      </div>
    </div>
  );

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "◉" },
    { id: "moas", label: "MOA List", icon: "≡" },
    ...(role === "admin" ? [{ id: "users", label: "User Management", icon: "👤" }] : []),
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f0f4f8", minHeight: "100vh" }}>
      {notification && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: notification.type === "success" ? "#dcfce7" : notification.type === "warning" ? "#fef3c7" : "#fee2e2", color: notification.type === "success" ? "#166534" : notification.type === "warning" ? "#92400e" : "#991b1b", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {notification.msg}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, width: 220, height: "100vh", background: "#1e3a5f", display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#f59e0b", fontSize: 20, fontWeight: 800 }}>NEU</span>
            <div><div style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>MOA Monitor</div><div style={{ color: "#94a3b8", fontSize: 10 }}>v2.0 Firebase</div></div>
          </div>
        </div>
        <div style={{ padding: "12px 8px", flex: 1 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 4, background: activeTab === tab.id ? "rgba(245,158,11,0.2)" : "transparent", color: activeTab === tab.id ? "#f59e0b" : "#94a3b8", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, textAlign: "left" }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
          {role === "admin" && moas.length === 0 && (
            <button onClick={handleSeed} disabled={seeding} style={{ width: "100%", marginTop: 12, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: 12, cursor: "pointer" }}>
              {seeding ? "Seeding..." : "🌱 Seed Sample Data"}
            </button>
          )}
        </div>
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {userDoc.photoURL ? <img src={userDoc.photoURL} style={{ width: 36, height: 36, borderRadius: "50%" }} /> : <Avatar initials={getInitials(userDoc.name)} color="#f59e0b" />}
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{userDoc.name?.split(" ")[0]}</div>
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: roleColors[role] + "60", color: "#fff", fontWeight: 600 }}>{role}</span>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, padding: 24 }}>
        {activeTab === "dashboard" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>Dashboard</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Overview of MOA status across all colleges</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Active MOAs", value: stats.active, color: "#166534", bg: "#dcfce7" },
                { label: "Processing", value: stats.processing, color: "#92400e", bg: "#fef3c7" },
                { label: "Expiring Soon", value: stats.expiring, color: "#9a3412", bg: "#ffedd5" },
                { label: "Expired", value: stats.expired, color: "#7f1d1d", bg: "#fee2e2" },
                { label: "Total Active", value: stats.total, color: "#1e3a5f", bg: "#dbeafe" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: s.bg }} />
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Filter by College & Date</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  <option value="">All Colleges</option>
                  {COLLEGES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
                <button onClick={() => { setFilterCollege(""); setFilterDateFrom(""); setFilterDateTo(""); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Reset</button>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e3a5f", marginBottom: 16 }}>MOAs by College</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {COLLEGES.map(col => {
                  const count = moas.filter(m => !m.deleted && m.college === col).length;
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

        {activeTab === "moas" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>MOA List</h1>
                <p style={{ color: "#6b7280", fontSize: 14 }}>{role === "student" ? "Showing approved MOAs only" : role === "faculty" ? "Showing all active MOAs" : "Showing all records including deleted"}</p>
              </div>
              {canMaintain && <button onClick={openAdd} style={{ padding: "10px 20px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add MOA</button>}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #e5e7eb" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company, college, industry, contact, address, status..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  <option value="">All Colleges</option>
                  {COLLEGES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  <option value="">All Industries</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  <option value="">All Status</option>
                  {["APPROVED","PROCESSING","EXPIRED","EXPIRING"].map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => { setSearch(""); setFilterCollege(""); setFilterIndustry(""); setFilterStatus(""); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Reset</button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>{filteredMOAs.length} record(s) found</div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    {columns[role].map(col => <th key={col} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{colLabels[col]}</th>)}
                    {canMaintain && <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, color: "#374151" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMOAs.length === 0
                    ? <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No MOAs found.</td></tr>
                    : filteredMOAs.map((moa, idx) => (
                      <tr key={moa.id} style={{ borderBottom: "1px solid #f1f5f9", background: moa.deleted ? "#fef9f9" : idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                        {columns[role].map(col => (
                          <td key={col} style={{ padding: "10px 14px", color: moa.deleted ? "#9ca3af" : "#1f2937", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: col === "audit" ? "normal" : "nowrap" }}>
                            {col === "status" ? <><Badge status={moa.status} /><div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{getStatusMeta(moa.status).label.split(": ")[1]}</div></>
                              : col === "deleted" ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: moa.deleted ? "#fee2e2" : "#dcfce7", color: moa.deleted ? "#991b1b" : "#166534", fontWeight: 600 }}>{moa.deleted ? "Deleted" : "Active"}</span>
                              : col === "audit" ? <button onClick={() => setShowAudit(moa)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer" }}>View ({(moa.audit || []).length})</button>
                              : moa[col]}
                          </td>
                        ))}
                        {canMaintain && (
                          <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                            {!moa.deleted
                              ? <><button onClick={() => openEdit(moa)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", marginRight: 6 }}>Edit</button>
                                {role === "admin" && <button onClick={() => setConfirmAction(moa)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff5f5", cursor: "pointer", color: "#dc2626" }}>Delete</button>}</>
                              : role === "admin" && <button onClick={() => recoverMOA(moa)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #86efac", background: "#f0fdf4", cursor: "pointer", color: "#166534" }}>Recover</button>}
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "users" && role === "admin" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>User Management</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Manage user roles, access and permissions</p>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    {["User","Email","Role","Can Maintain MOAs","Status","Actions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: u.blocked ? "#fffbeb" : "#fff" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {u.photoURL ? <img src={u.photoURL} style={{ width: 36, height: 36, borderRadius: "50%" }} /> : <Avatar initials={getInitials(u.name)} color={roleColors[u.role || "student"]} />}
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#6b7280" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <select value={u.role} onChange={e => changeRole(u, e.target.value)} disabled={u.id === userDoc.id} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12, background: "#fff" }}>
                          <option value="admin">Admin</option>
                          <option value="faculty">Faculty</option>
                          <option value="student">Student</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.role === "faculty"
                          ? <button onClick={() => toggleMaintain(u)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: u.canMaintain ? "#dcfce7" : "#f1f5f9", color: u.canMaintain ? "#166534" : "#6b7280", fontWeight: 600 }}>{u.canMaintain ? "✓ Granted" : "✗ Denied"}</button>
                          : <span style={{ color: "#9ca3af", fontSize: 12 }}>{u.role === "admin" ? "Full Access" : "Read Only"}</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: u.blocked ? "#fee2e2" : "#dcfce7", color: u.blocked ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{u.blocked ? "Blocked" : "Active"}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.id !== userDoc.id && <button onClick={() => toggleBlock(u)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${u.blocked ? "#86efac" : "#fca5a5"}`, background: u.blocked ? "#f0fdf4" : "#fff5f5", cursor: "pointer", color: u.blocked ? "#166534" : "#dc2626", fontWeight: 500 }}>{u.blocked ? "Unblock" : "Block"}</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MOA Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 20 }}>{editMOA ? "Edit MOA" : "Add New MOA"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[{key:"hteid",label:"HTE ID",type:"text"},{key:"company",label:"Company Name",type:"text"},{key:"contact",label:"Contact Person",type:"text"},{key:"contactEmail",label:"Contact Email",type:"email"},{key:"effectiveDate",label:"Effective Date",type:"date"}].map(f => (
                <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{f.label}</label>
                  <input type={f.type} value={form[f.key] || ""} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Industry</label>
                <select value={form.industry || ""} onChange={e => setForm(p => ({...p,industry:e.target.value}))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>College</label>
                <select value={form.college || ""} onChange={e => setForm(p => ({...p,college:e.target.value}))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  {COLLEGES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Status</label>
                <select value={form.status || ""} onChange={e => setForm(p => ({...p,status:e.target.value}))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
                  {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Address</label>
                <textarea value={form.address || ""} onChange={e => setForm(p => ({...p,address:e.target.value}))} rows={2} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={saveMOA} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAudit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>Audit Trail</h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>{showAudit.company}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(showAudit.audit || []).map((a, i) => (
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

      {/* Confirm Delete */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>Soft Delete MOA?</h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>This will mark <strong>{confirmAction.company}</strong> as deleted. It can be recovered by admin.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={() => softDelete(confirmAction)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
