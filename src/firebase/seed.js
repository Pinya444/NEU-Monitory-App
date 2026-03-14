import { db } from "./config";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

const MOCK_MOAS = [
  { hteid: "HTE-2024-001", company: "Globe Telecom Inc.", address: "The Globe Tower, BGC, Taguig", contact: "Rosario Bautista", contactEmail: "r.bautista@globe.com.ph", industry: "Telecom", effectiveDate: "2023-09-01", status: "APPROVED_SIGNED", college: "CCS", deleted: false },
  { hteid: "HTE-2024-002", company: "Jollibee Foods Corp.", address: "10F Jollibee Plaza, Ortigas, Pasig", contact: "Carlo Mendoza", contactEmail: "c.mendoza@jollibee.com.ph", industry: "Food", effectiveDate: "2024-09-01", status: "APPROVED_NOTARIZING", college: "CBA", deleted: false },
  { hteid: "HTE-2024-003", company: "Accenture Philippines", address: "6788 Ayala Ave, Makati City", contact: "Patricia Lim", contactEmail: "p.lim@accenture.com", industry: "Technology", effectiveDate: "2023-03-01", status: "EXPIRED", college: "CCS", deleted: false },
  { hteid: "HTE-2024-004", company: "BDO Unibank", address: "BDO Corporate Center, Makati", contact: "Fernando Garcia", contactEmail: "f.garcia@bdo.com.ph", industry: "Finance", effectiveDate: "2026-02-01", status: "EXPIRING", college: "CBA", deleted: false },
  { hteid: "HTE-2024-005", company: "Philippine General Hospital", address: "Taft Ave, Manila", contact: "Dr. Nena Ramos", contactEmail: "n.ramos@pgh.gov.ph", industry: "Healthcare", effectiveDate: "2026-09-01", status: "PROCESSING_LEGAL", college: "CON", deleted: false },
  { hteid: "HTE-2024-006", company: "PLDT Inc.", address: "Ramon Cojuangco Bldg, Makati", contact: "Alicia Torres", contactEmail: "a.torres@pldt.com.ph", industry: "Telecom", effectiveDate: "2027-03-01", status: "PROCESSING_HTE", college: "COE", deleted: false },
  { hteid: "HTE-2023-007", company: "SM Prime Holdings", address: "MOA Arena Complex, Pasay", contact: "Vincent Sy", contactEmail: "v.sy@smprime.com", industry: "Retail", effectiveDate: "2026-01-01", status: "APPROVED_NO_NOTARIZATION", college: "CBA", deleted: true },
  { hteid: "HTE-2025-008", company: "Manulife Philippines", address: "NEX Tower, Ayala Ave, Makati", contact: "Grace Villanueva", contactEmail: "g.villanueva@manulife.com.ph", industry: "Finance", effectiveDate: "2027-09-01", status: "PROCESSING_VPAA", college: "CBA", deleted: false },
];

export const seedMOAs = async (adminName) => {
  for (const moa of MOCK_MOAS) {
    const ref = doc(collection(db, "moas"));
    await setDoc(ref, {
      ...moa,
      audit: [{ user: adminName, date: new Date().toLocaleString("en-PH"), op: "INSERT" }],
      createdAt: serverTimestamp(),
    });
  }
  console.log("Seeded MOAs!");
};
