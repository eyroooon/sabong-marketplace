"use client";

import { useState, useEffect, useRef } from "react";
import { apiGet, apiPatch, apiUpload } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const { accessToken, user, setAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Seller verification state
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");
  const governmentIdRef = useRef<HTMLInputElement>(null);
  const farmPermitRef = useRef<HTMLInputElement>(null);
  const [governmentIdPreview, setGovernmentIdPreview] = useState<string | null>(null);
  const [farmPermitPreview, setFarmPermitPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    province: "",
    city: "",
    barangay: "",
    addressLine: "",
    zipCode: "",
  });

  useEffect(() => {
    if (!accessToken) return;

    const loadData = async () => {
      try {
        const userData: any = await apiGet("/users/me", accessToken);
        setForm({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          province: userData.province || "",
          city: userData.city || "",
          barangay: userData.barangay || "",
          addressLine: userData.addressLine || "",
          zipCode: userData.zipCode || "",
        });
      } catch {
        setError("Failed to load profile");
      }

      // Load seller profile if user is a seller
      if (user?.role === "seller" || user?.role === "admin") {
        try {
          const seller: any = await apiGet("/sellers/me", accessToken);
          setSellerProfile(seller);
        } catch {
          // Not a seller, ignore
        }
      }

      setLoading(false);
    };

    loadData();
  }, [accessToken, user?.role]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updated: any = await apiPatch("/users/me", form, accessToken!);

      // Update auth store with new user data
      const { refreshToken } = useAuth.getState();
      if (refreshToken) {
        setAuth(
          {
            id: updated.id,
            phone: updated.phone,
            firstName: updated.firstName,
            lastName: updated.lastName,
            role: updated.role,
            avatarUrl: updated.avatarUrl,
          },
          accessToken!,
          refreshToken,
        );
      }

      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function handleFilePreview(
    file: File,
    setter: (url: string | null) => void,
  ) {
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleDocumentUpload(e: React.FormEvent) {
    e.preventDefault();
    setDocError("");
    setDocSuccess("");

    const govFile = governmentIdRef.current?.files?.[0];
    const permitFile = farmPermitRef.current?.files?.[0];

    if (!govFile && !permitFile) {
      setDocError("Please select at least one document to upload.");
      return;
    }

    setUploadingDocs(true);

    try {
      const formData = new FormData();
      if (govFile) formData.append("governmentId", govFile);
      if (permitFile) formData.append("farmPermit", permitFile);

      const result: any = await apiUpload(
        "/sellers/me/documents",
        formData,
        accessToken!,
      );

      setSellerProfile((prev: any) => ({
        ...prev,
        governmentIdUrl: result.governmentIdUrl || prev?.governmentIdUrl,
        farmPermitUrl: result.farmPermitUrl || prev?.farmPermitUrl,
        verificationStatus: result.verificationStatus || prev?.verificationStatus,
      }));

      setDocSuccess(result.message || "Documents uploaded successfully!");
      // Clear file inputs
      if (governmentIdRef.current) governmentIdRef.current.value = "";
      if (farmPermitRef.current) farmPermitRef.current.value = "";
      setGovernmentIdPreview(null);
      setFarmPermitPreview(null);
    } catch (err: any) {
      setDocError(err.message || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account details and preferences.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Personal Info */}
        <section>
          <h2 className="mb-3 font-semibold">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </section>

        {/* Address */}
        <section>
          <h2 className="mb-3 font-semibold">Address</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Address Line</label>
              <input
                type="text"
                value={form.addressLine}
                onChange={(e) => updateField("addressLine", e.target.value)}
                placeholder="Street, building, house number"
                className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Barangay</label>
                <input
                  type="text"
                  value={form.barangay}
                  onChange={(e) => updateField("barangay", e.target.value)}
                  placeholder="Barangay name"
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">City / Municipality</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Province</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  placeholder="Province"
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">ZIP Code</label>
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  placeholder="3020"
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-border pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Seller Verification Section */}
      {sellerProfile && (
        <section id="verification" className="mt-10 scroll-mt-8">
          <div className="border-t border-border pt-8">
            <h2 className="text-xl font-bold">Seller Verification</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your government ID and farm permit to get your seller profile verified.
            </p>

            {/* Current verification status */}
            <div className="mt-4">
              {sellerProfile.verificationStatus === "verified" && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                  <svg
                    className="h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Your account is verified!</span>
                  {sellerProfile.verifiedAt && (
                    <span className="text-green-600">
                      &mdash; verified on{" "}
                      {new Date(sellerProfile.verifiedAt).toLocaleDateString(
                        "en-PH",
                        { year: "numeric", month: "long", day: "numeric" },
                      )}
                    </span>
                  )}
                </div>
              )}
              {sellerProfile.verificationStatus === "pending" && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                  <svg
                    className="h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <span className="font-medium">Verification pending</span> &mdash;
                    your documents are under review.
                  </span>
                </div>
              )}
              {sellerProfile.verificationStatus === "rejected" && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <svg
                    className="h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <span className="font-medium">Verification rejected</span> &mdash;
                    please re-upload your documents below.
                  </span>
                </div>
              )}
            </div>

            {/* Currently uploaded documents */}
            {(sellerProfile.governmentIdUrl || sellerProfile.farmPermitUrl) && (
              <div className="mt-4 rounded-lg border border-border p-4">
                <h3 className="mb-2 text-sm font-medium">Uploaded Documents</h3>
                <div className="flex flex-wrap gap-4">
                  {sellerProfile.governmentIdUrl && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Government ID:</span>{" "}
                      Uploaded
                    </div>
                  )}
                  {sellerProfile.farmPermitUrl && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Farm Permit:</span>{" "}
                      Uploaded
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload form - show if not verified or if rejected */}
            {sellerProfile.verificationStatus !== "verified" && (
              <form onSubmit={handleDocumentUpload} className="mt-4 space-y-4">
                {docError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {docError}
                  </div>
                )}
                {docSuccess && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {docSuccess}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Government ID <span className="text-destructive">*</span>
                  </label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Upload a clear photo of your valid government-issued ID (e.g., passport, driver&apos;s license, PhilSys ID).
                  </p>
                  <input
                    ref={governmentIdRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFilePreview(file, setGovernmentIdPreview);
                      else setGovernmentIdPreview(null);
                    }}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary"
                  />
                  {governmentIdPreview && (
                    <div className="mt-2">
                      <img
                        src={governmentIdPreview}
                        alt="Government ID preview"
                        className="h-32 rounded-lg border border-border object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Farm Permit{" "}
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Upload your farm or business permit if available. This helps speed up verification.
                  </p>
                  <input
                    ref={farmPermitRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFilePreview(file, setFarmPermitPreview);
                      else setFarmPermitPreview(null);
                    }}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary"
                  />
                  {farmPermitPreview && (
                    <div className="mt-2">
                      <img
                        src={farmPermitPreview}
                        alt="Farm permit preview"
                        className="h-32 rounded-lg border border-border object-cover"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploadingDocs}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {uploadingDocs ? "Uploading..." : "Submit Documents for Verification"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
