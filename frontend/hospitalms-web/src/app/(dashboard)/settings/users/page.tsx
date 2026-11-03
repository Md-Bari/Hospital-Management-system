"use client";

import { useEffect, useState } from "react";
import {
  Users, Search, Plus, X, Save, ShieldCheck, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
} from "lucide-react";
import { usersApi, rolesApi, UserListItem, RoleListItem, getApiError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ALL_ROLES = [
  "SuperAdmin", "HospitalAdmin", "BranchManager", "Doctor", "Nurse", "Receptionist",
  "Pharmacist", "LabTechnician", "BloodBankTechnician", "Radiologist", "Physiotherapist",
  "Dietitian", "SocialWorker", "MedicalCoder", "HRManager", "Cashier", "Accountant", "ITStaff",
];

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function UserManagementPage() {
  const { user, hasAnyRole } = useAuth();
  const isBranchManager = user?.roles?.includes("BranchManager") && !user?.roles?.includes("SuperAdmin") && !user?.roles?.includes("HospitalAdmin");

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Role edit modal
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Add user modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: "", email: "", password: "", roleName: "", phoneNumber: "" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const canManage = hasAnyRole(["SuperAdmin", "HospitalAdmin"]);
  const canView = hasAnyRole(["SuperAdmin", "HospitalAdmin", "BranchManager", "HRManager"]);

  const loadUsers = async (pg = page, q = search, rf = roleFilter) => {
    try {
      setLoading(true);
      setError("");
      const res = await usersApi.getUsers({ page: pg, pageSize: 15, search: q || undefined, role: rf || undefined });
      setUsers(res?.items ?? []);
      setTotal(res?.total ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (err) {
      setError(getApiError(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
    loadUsers(1, q, roleFilter);
  };

  const handleRoleFilter = (r: string) => {
    setRoleFilter(r);
    setPage(1);
    loadUsers(1, search, r);
  };

  const handlePage = (pg: number) => {
    setPage(pg);
    loadUsers(pg, search, roleFilter);
  };

  const openEditRoles = (u: UserListItem) => {
    setEditUser(u);
    setSelectedRoles(u.roles);
    setSaveMsg("");
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const saveRoles = async () => {
    if (!editUser) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await usersApi.assignRoles(editUser.id, selectedRoles);
      setSaveMsg("Roles updated successfully.");
      loadUsers();
      setTimeout(() => { setEditUser(null); setSaveMsg(""); }, 1500);
    } catch (err) {
      setSaveMsg(getApiError(err, "Failed to update roles."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: UserListItem) => {
    try {
      await usersApi.toggleStatus(u.id, !u.isActive);
      loadUsers();
    } catch (err) {
      alert(getApiError(err, "Failed to update status."));
    }
  };

  const handleAddUser = async () => {
    if (!addForm.fullName || !addForm.email || !addForm.password || !addForm.roleName) {
      setAddError("Full name, email, password and role are required.");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      await usersApi.createStaffUser(addForm);
      setShowAdd(false);
      setAddForm({ fullName: "", email: "", password: "", roleName: "", phoneNumber: "" });
      loadUsers();
    } catch (err) {
      setAddError(getApiError(err, "Failed to create user."));
    } finally {
      setAddLoading(false);
    }
  };

  // Roles available in the add-user form (BranchManagers cannot create BranchManagers)
  const availableAddRoles = isBranchManager
    ? ALL_ROLES.filter((r) => r !== "BranchManager" && r !== "SuperAdmin" && r !== "HospitalAdmin")
    : ALL_ROLES;

  if (!canView) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} total user{total !== 1 ? "s" : ""} in the system
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowAdd(true); setAddError(""); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New User
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-2xl text-red-600 text-xs border border-red-200">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none shadow-sm"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Roles</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Last Login</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  {canManage && <th className="px-5 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{u.departmentName ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(u.lastLoginAt)}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                        u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditRoles(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-slate-200 hover:border-blue-200 transition-all"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Roles
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            title={u.isActive ? "Deactivate" : "Activate"}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            {u.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {total} total users
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => handlePage(pg)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-semibold transition-colors",
                  pg === page ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Roles Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Roles — {editUser.fullName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {saveMsg && (
                <div className={cn(
                  "p-3 rounded-xl text-xs font-medium mb-3",
                  saveMsg.includes("success") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                )}>
                  {saveMsg}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "text-left p-2.5 rounded-xl border text-xs font-semibold transition-all",
                        isSelected
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
              <button
                onClick={saveRoles}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save Roles"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Add New Staff User
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">{addError}</div>
              )}
              {[
                { label: "Full Name *", key: "fullName", placeholder: "Dr. John Smith", type: "text" },
                { label: "Email *", key: "email", placeholder: "john@hospital.com", type: "email" },
                { label: "Password *", key: "password", placeholder: "Minimum 8 characters", type: "password" },
                { label: "Phone", key: "phoneNumber", placeholder: "+880 1700000000", type: "tel" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={addForm[key as keyof typeof addForm]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Role *</label>
                <select
                  value={addForm.roleName}
                  onChange={(e) => setAddForm((f) => ({ ...f, roleName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">Select a role…</option>
                  {availableAddRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
              <button
                onClick={handleAddUser}
                disabled={addLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {addLoading ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
