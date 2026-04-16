"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch } from "@/lib/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

type SortField = "name" | "role" | "createdAt";
type SortDir = "asc" | "desc";
type RoleTab = "all" | "buyer" | "seller" | "admin";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 text-red-700 ring-red-600/20",
  seller: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  buyer: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const AVATAR_COLORS: Record<string, string> = {
  admin: "bg-red-600",
  seller: "bg-emerald-600",
  buyer: "bg-blue-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState<RoleTab>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(
    (page = 1) => {
      if (!accessToken) return;
      setLoading(true);
      apiGet<UsersResponse>(`/admin/users?page=${page}&limit=20`, accessToken)
        .then((res) => {
          setUsers(res.data);
          setPagination(res.pagination);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [accessToken],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleStatus = async (userId: string, currentActive: boolean) => {
    if (!accessToken) return;
    try {
      await apiPatch(`/admin/users/${userId}/toggle`, { isActive: !currentActive }, accessToken);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u)),
      );
    } catch {
      // ignore
    }
    setOpenMenu(null);
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (!accessToken) return;
    try {
      await apiPatch(`/admin/users/${userId}/role`, { role: newRole }, accessToken);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch {
      // ignore
    }
    setOpenMenu(null);
  };

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...users];

    // Role tab
    if (roleTab !== "all") {
      list = list.filter((u) => u.role === roleTab);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)),
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortField === "role") {
        cmp = a.role.localeCompare(b.role);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, roleTab, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg
      className={`ml-1 inline h-3.5 w-3.5 transition-colors ${sortField === field ? "text-foreground" : "text-muted-foreground/40"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {sortField === field && sortDir === "desc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      )}
    </svg>
  );

  const allSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs: { key: RoleTab; label: string }[] = [
    { key: "all", label: "All Users" },
    { key: "buyer", label: "Buyers" },
    { key: "seller", label: "Sellers" },
    { key: "admin", label: "Admins" },
  ];

  const tabCount = (key: RoleTab) =>
    key === "all" ? users.length : users.filter((u) => u.role === key).length;

  const pageStart = (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination.total} total user{pagination.total !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                roleTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  roleTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tabCount(tab.key)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  onClick={() => toggleSort("name")}
                >
                  User <SortIcon field="name" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  onClick={() => toggleSort("role")}
                >
                  Role <SortIcon field="role" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  onClick={() => toggleSort("createdAt")}
                >
                  Joined <SortIcon field="createdAt" />
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      <p className="text-sm font-medium text-muted-foreground">No users found</p>
                      <p className="text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`transition-colors hover:bg-muted/50 ${idx % 2 === 1 ? "bg-muted/20" : ""} ${selected.has(user.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_COLORS[user.role] ?? "bg-gray-500"}`}
                        >
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email || <span className="italic text-muted-foreground/40">--</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${ROLE_COLORS[user.role] ?? "bg-gray-50 text-gray-700 ring-gray-600/20"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block" ref={openMenu === user.id ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenu === user.id && (
                          <div className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-lg border border-border bg-popover py-1 shadow-lg ring-1 ring-black/5">
                            <button
                              onClick={() => setOpenMenu(null)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                            >
                              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Profile
                            </button>
                            <div className="my-1 border-t border-border" />
                            {user.role !== "admin" && (
                              <>
                                <button
                                  onClick={() => toggleStatus(user.id, user.isActive)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                                >
                                  {user.isActive ? (
                                    <>
                                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Activate
                                    </>
                                  )}
                                </button>
                                {user.role !== "seller" && (
                                  <button
                                    onClick={() => changeRole(user.id, "seller")}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                                  >
                                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    Make Seller
                                  </button>
                                )}
                                <button
                                  onClick={() => changeRole(user.id, "admin")}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-muted"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                  </svg>
                                  Make Admin
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading users...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No users found</div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${AVATAR_COLORS[user.role] ?? "bg-gray-500"}`}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${ROLE_COLORS[user.role] ?? "bg-gray-50 text-gray-700 ring-gray-600/20"}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              {user.email && (
                <p className="mt-2 truncate text-xs text-muted-foreground">{user.email}</p>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</span>
                {user.role !== "admin" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(user.id, user.isActive)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        user.isActive
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{pagination.total > 0 ? pageStart : 0}</span> to{" "}
          <span className="font-medium text-foreground">{pageEnd}</span> of{" "}
          <span className="font-medium text-foreground">{pagination.total}</span> users
        </p>
        <div className="flex items-center gap-1">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchUsers(pagination.page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchUsers(p)}
              className={`hidden h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors sm:inline-flex ${
                p === pagination.page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchUsers(pagination.page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
