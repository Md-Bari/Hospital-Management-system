"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Building,
  UserCheck,
  Save,
  Check,
} from "lucide-react";
import { rolesApi, RoleListItem, RoleDetailResponse, usersApi, UserListItem } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function RolesAndPermissionsPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("SuperAdmin");
  const [roleDetail, setRoleDetail] = useState<RoleDetailResponse | null>(null);
  const [roleUsers, setRoleUsers] = useState<UserListItem[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [isEditing, setIsEditing] = useState(false);
  const [editablePermissions, setEditablePermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRoleDetail(selectedRole);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const data = await rolesApi.getRoles();
      setRoles(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErrorMessage(error.response?.data?.error || "Failed to load roles list.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadRoleDetail = async (roleName: string) => {
    setLoadingDetail(true);
    setIsEditing(false);
    setSaveSuccess(false);
    try {
      const detail = await rolesApi.getRolePermissions(roleName);
      setRoleDetail(detail);
      setEditablePermissions(detail.assignedPermissions);

      // Load users in this role
      const usersData = await usersApi.getUsers({ role: roleName, pageSize: 50 });
      setRoleUsers(usersData.items ?? []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErrorMessage(error.response?.data?.error || `Failed to load details for ${roleName}.`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTogglePermission = (code: string) => {
    if (!isEditing || selectedRole === "SuperAdmin") return;
    setEditablePermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAllInModule = (permissionCodes: string[]) => {
    if (!isEditing || selectedRole === "SuperAdmin") return;
    const allSelected = permissionCodes.every((c) => editablePermissions.includes(c));
    if (allSelected) {
      setEditablePermissions((prev) => prev.filter((c) => !permissionCodes.includes(c)));
    } else {
      setEditablePermissions((prev) => Array.from(new Set([...prev, ...permissionCodes])));
    }
  };

  const handleSavePermissions = async () => {
    if (selectedRole === "SuperAdmin") return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      await rolesApi.updateRolePermissions(selectedRole, editablePermissions);
      setSaveSuccess(true);
      setIsEditing(false);
      await loadRoles();
      await loadRoleDetail(selectedRole);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErrorMessage(error.response?.data?.error || "Failed to save permission modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCatalog =
    roleDetail?.catalog.filter((g) =>
      filterModule === "all" ? true : g.module.toLowerCase() === filterModule.toLowerCase()
    ) ?? [];

  const totalPermissionsInSystem =
    roleDetail?.catalog.reduce((acc, g) => acc + g.permissions.length, 0) || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              Security & Governance
            </span>
            <span className="text-xs text-slate-400">• Fine-Grained Authorization</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage centralized roles, operational scopes, and permission grants across all 17 healthcare disciplines.
          </p>
        </div>

        <button
          onClick={() => {
            loadRoles();
            if (selectedRole) loadRoleDetail(selectedRole);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Matrices</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Configured Roles</p>
            <p className="text-xl font-bold text-slate-800">{roles.length || 17}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Assigned Users</p>
            <p className="text-xl font-bold text-slate-800">
              {roles.reduce((acc, r) => acc + r.userCount, 0)} Active
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Policy Definitions</p>
            <p className="text-xl font-bold text-slate-800">{totalPermissionsInSystem || 108}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Your Active Role</p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {user?.roles?.join(", ") || "SuperAdmin"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Roles List (Left) + Role Details & Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Roles Navigation (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search healthcare roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
              {loadingRoles ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading roles catalog...</div>
              ) : (
                filteredRoles.map((r) => {
                  const isSelected = selectedRole === r.name;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.name)}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl transition-all border flex items-center justify-between",
                        isSelected
                          ? "bg-blue-50/80 border-blue-200 shadow-sm text-blue-900"
                          : "bg-white border-transparent hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate">{r.name}</span>
                          {r.isSystemRole && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.description}</p>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[11px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-xs">
                          {r.permissionsCount} perms
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          {r.userCount} {r.userCount === 1 ? "user" : "users"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Role Permissions Matrix & Users (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {loadingDetail || !roleDetail ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 text-xs">
              Loading role permissions and security grants...
            </div>
          ) : (
            <>
              {/* Role Header Card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-900">{roleDetail.roleName}</h2>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        {isEditing ? editablePermissions.length : roleDetail.assignedPermissions.length} / {totalPermissionsInSystem} Permissions Granted
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{roleDetail.roleDescription}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedRole === "SuperAdmin" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Immutable SuperAdmin</span>
                      </div>
                    ) : isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditablePermissions(roleDetail.assignedPermissions);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePermissions}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? "Saving..." : "Save Grants"}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200/60 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Customize Permissions</span>
                      </button>
                    )}
                  </div>
                </div>

                {saveSuccess && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Permissions successfully committed and active in authorization cache.</span>
                  </div>
                )}

                {/* Progress Coverage Bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Access Coverage Footprint</span>
                    <span className="font-bold text-slate-700">
                      {Math.round(
                        ((isEditing ? editablePermissions.length : roleDetail.assignedPermissions.length) /
                          totalPermissionsInSystem) *
                          100
                      )}
                      % of System
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          ((isEditing ? editablePermissions.length : roleDetail.assignedPermissions.length) /
                            totalPermissionsInSystem) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Module Quick Filter Tabs */}
                <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setFilterModule("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-semibold transition-colors flex-shrink-0",
                      filterModule === "all"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    All Modules ({roleDetail.catalog.length})
                  </button>
                  {roleDetail.catalog.map((g) => (
                    <button
                      key={g.module}
                      onClick={() => setFilterModule(g.module)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-semibold transition-colors flex-shrink-0",
                        filterModule === g.module
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {g.module}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Matrix Cards by Module */}
              <div className="space-y-4">
                {displayedCatalog.map((group) => {
                  const moduleCodes = group.permissions.map((p) => p.code);
                  const assignedInGroup = moduleCodes.filter((c) =>
                    (isEditing ? editablePermissions : roleDetail.assignedPermissions).includes(c)
                  ).length;
                  const allSelected = assignedInGroup === moduleCodes.length;

                  return (
                    <div
                      key={group.module}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{group.module}</span>
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                            {assignedInGroup} / {group.permissions.length} active
                          </span>
                        </div>

                        {isEditing && selectedRole !== "SuperAdmin" && (
                          <button
                            type="button"
                            onClick={() => handleSelectAllInModule(moduleCodes)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            {allSelected ? "Deselect All" : "Grant All"}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {group.permissions.map((perm) => {
                          const isAssigned = (
                            isEditing ? editablePermissions : roleDetail.assignedPermissions
                          ).includes(perm.code);

                          return (
                            <div
                              key={perm.id}
                              onClick={() => handleTogglePermission(perm.code)}
                              className={cn(
                                "p-3 rounded-2xl border text-left transition-all",
                                isEditing && selectedRole !== "SuperAdmin" ? "cursor-pointer" : "",
                                isAssigned
                                  ? "bg-blue-50/50 border-blue-200 text-slate-900"
                                  : "bg-slate-50/50 border-slate-100 text-slate-400 opacity-60"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-xs flex items-center gap-1.5">
                                    <span>{perm.action}</span>
                                    <span className="font-mono text-[10px] text-slate-400 font-normal">
                                      ({perm.code})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {perm.description}
                                  </p>
                                </div>

                                <div className="flex-shrink-0 mt-0.5">
                                  {isAssigned ? (
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Assigned Staff Members in this Role */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-800">
                      Active Users Assigned to {roleDetail.roleName}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {roleUsers.length} staff member{roleUsers.length === 1 ? "" : "s"}
                  </span>
                </div>

                {roleUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No users currently assigned to this role.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roleUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{u.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p>
                          {u.departmentName && (
                            <p className="text-[10px] text-blue-600 font-medium truncate mt-0.5">
                              {u.departmentName}
                            </p>
                          )}
                        </div>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

