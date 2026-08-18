import { useState, useEffect, useMemo } from "react";
import { User, X } from "lucide-react";
import { userService } from "../services/userService";
import { UserType, UpdateUserRequest } from "../types/user";
// import { sessionService } from "../../auth/services/sessionService"; // TODO: Uncomment when backend confirms /user-sessions endpoints
// import { UserSession } from "../../auth/types/auth"; // TODO: Uncomment when backend confirms /user-sessions endpoints
import { useAuth } from "../../../contexts/AuthContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import { useLanguage } from "../../../contexts/LanguageContext";
// import { timezoneService } from "../../configurations/services/timezoneService";
// import { TimeZone } from "../../configurations/types/timezone";

export default function UserProfilePage() {
  const { user: authUser } = useAuth();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // const [timezones, setTimezones] = useState<TimeZone[]>([]);
  // const [isLoadingTimezones, setIsLoadingTimezones] = useState(false);
  // const [sessions, setSessions] = useState<UserSession[]>([]);
  // const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  // const [isEndingSession, setIsEndingSession] = useState<number | null>(null);
  // const [isEndingAllSessions, setIsEndingAllSessions] = useState(false);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    first_name: "",
    last_name: "",
    middle_name: null,
    preferred_name: null,
    phone_number: null,
    department: null,
    job_title: null,
    timezone: "",
  });

  useEffect(() => {
    if (authUser?.user_id) {
      loadUserProfile();
      // loadActiveSessions(); // TODO: Uncomment when backend confirms /user-sessions endpoints
    } else {
      setIsLoading(false);
      showError(t.profile.profileUpdated, t.profile.errorUserInfoNotAvailable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // Timezone selection moved to Settings page
  // useEffect(() => {
  //   loadTimezones();
  // }, []);

  // const loadTimezones = async () => {
  //   try {
  //     setIsLoadingTimezones(true);
  //     const data = await timezoneService.getTimezones();
  //     setTimezones(data);
  //   } catch (err) {
  //     console.error("Failed to load timezones:", err);
  //   } finally {
  //     setIsLoadingTimezones(false);
  //   }
  // };

  const loadUserProfile = async () => {
    if (!authUser?.user_id) return;

    try {
      setIsLoading(true);
      const response = await userService.getUserById(authUser.user_id, true);

      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          middle_name: userData.middle_name || null,
          preferred_name: userData.preferred_name || null,
          phone_number: userData.phone_number || null,
          department: userData.department || null,
          job_title: userData.job_title || null,
          timezone: userData.timezone || "",
        });
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      showError(t.profile.profileUpdated, t.profile.errorLoadProfile);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Uncomment when backend confirms /user-sessions endpoints
  // const loadActiveSessions = async () => {
  //   if (!authUser?.user_id) return;

  //   try {
  //     setIsLoadingSessions(true);
  //     const response = await sessionService.getAllSessions(authUser.user_id, {
  //       limit: 100,
  //       offset: 0,
  //       skipCache: true,
  //     });

  //     if (response.success && response.data) {
  //       setSessions(response.data);
  //     }
  //   } catch (err) {
  //     console.error("Error loading sessions:", err);
  //   } finally {
  //     setIsLoadingSessions(false);
  //   }
  // };

  // const handleEndSession = async (sessionId: number) => {
  //   try {
  //     setIsEndingSession(sessionId);
  //     const response = await sessionService.endSession(sessionId);

  //     if (response.success) {
  //       setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  //       success("Session Ended", "The session has been successfully ended");
  //     } else {
  //       showError("Failed to End Session", response.message || "Unable to end session");
  //     }
  //   } catch (err) {
  //     console.error("Error ending session:", err);
  //     showError("Failed to End Session", "An error occurred while ending the session");
  //   } finally {
  //     setIsEndingSession(null);
  //   }
  // };

  // const handleEndAllSessions = async () => {
  //   if (!authUser?.user_id) return;

  //   if (!window.confirm("Are you sure? This will log you out from all devices.")) {
  //     return;
  //   }

  //   try {
  //     setIsEndingAllSessions(true);
  //     const response = await sessionService.endAllSessions(authUser.user_id);

  //     if (response.success) {
  //       setSessions([]);
  //       success("Logged Out", "You have been logged out from all devices");
  //       // Redirect to login after a short delay
  //       setTimeout(() => {
  //         window.location.href = "/auth/login";
  //       }, 1500);
  //     } else {
  //       showError("Failed to Logout", response.message || "Unable to logout from all devices");
  //     }
  //   } catch (err) {
  //     console.error("Error ending all sessions:", err);
  //     showError("Failed to Logout", "An error occurred while logging out");
  //   } finally {
  //     setIsEndingAllSessions(false);
  //   }
  // };

  const nullableFields = useMemo(
    () =>
      new Set([
        // "middle_name",
        // "preferred_name",
        "phone_number",
        "department",
        "job_title",
      ]),
    []
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === "" && nullableFields.has(name)
          ? (null as string | null)
          : value,
    }));
  };

  const handleSelectChange = (name: keyof UpdateUserRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  // const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       const dataUrl = reader.result as string;
  //       setUser((prev) => prev ? { ...prev, photo_url: dataUrl } : null);
  //       setFormData((prev) => ({
  //         ...prev,
  //         photo_url: dataUrl,
  //       }));
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // const handleUploadClick = () => {
  //   fileInputRef.current?.click();
  // };

  // const handleRemovePhoto = () => {
  //   setUser((prev) => prev ? { ...prev, photo_url: null } : null);
  //   setFormData((prev) => ({
  //     ...prev,
  //     photo_url: null,
  //   }));
  // };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const response = await userService.updateUser(user.id, formData);

      if (response.success && response.data) {
        setUser(response.data);
        // Update formData with response to keep them in sync
        setFormData({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          middle_name: response.data.middle_name || null,
          preferred_name: response.data.preferred_name || null,
          phone_number: response.data.phone_number || null,
          department: response.data.department || null,
          job_title: response.data.job_title || null,
          timezone: response.data.timezone || "",
        });
        setIsEditing(false);
        success(t.profile.profileUpdated, t.profile.profileUpdatedSuccess);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showError(t.profile.profileUpdated, t.profile.errorUpdateProfile);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        middle_name: user.middle_name || null,
        preferred_name: user.preferred_name || null,
        phone_number: user.phone_number || null,
        department: user.department || null,
        job_title: user.job_title || null,
        timezone: user.timezone || "",
      });
    }
    setIsEditing(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      case "locked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t.profile.unableToLoad}</p>
      </div>
    );
  }

  const statusValue = (user.status || "unknown")?.toLowerCase() ?? "unknown";
  const statusLabel =
    statusValue === "unknown"
      ? t.profile.statusUnknown
      : statusValue
          .split("_")
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
  const lastLoginValue = user.last_login || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            {t.profile.title}
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            {t.profile.description}
          </p>
        </div>
        <div className="flex items-center gap-3 w-auto">
          {/* TODO: Uncomment when backend confirms /user-sessions endpoints */}
          {/* {!isEditing && (
            <button
              onClick={handleEndAllSessions}
              disabled={isEndingAllSessions || sessions.length === 0}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 ${tw.rounded} hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-auto`}
              title="Logout from all devices"
            >
              {isEndingAllSessions ? (
                <>
                  <LoadingSpinner variant="modern" size="sm" color="white" />
                  <span className="ml-2">Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout All Devices
                </>
              )}
            </button>
          )} */}
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center transition-colors w-auto"
                style={getButtonStyles(button.bordered)}
              >
                {t.profile.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center text-sm font-medium text-white ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-auto`}
                style={{
                  backgroundColor: button.action.background,
                  color: button.action.color,
                  borderRadius: button.action.borderRadius,
                  padding: `${button.action.paddingY} ${button.action.paddingX}`,
                }}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner variant="modern" size="sm" color="white" />
                    <span className="ml-2">{t.profile.saving}</span>
                  </>
                ) : (
                  "Update"
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`inline-flex items-center text-sm font-medium text-white ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-offset-2 w-auto`}
              style={{
                backgroundColor: button.action.background,
                color: button.action.color,
                borderRadius: button.action.borderRadius,
                padding: `${button.action.paddingY} ${button.action.paddingX}`,
              }}
            >
              <User className="w-4 h-4 mr-2" />
              {t.profile.editProfile}
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className={`bg-white ${tw.rounded} shadow-sm p-6`}>
        {/* Profile Header */}
        <div className="mb-8">
          {/* Avatar + User Info Row */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center  text-4xl font-bold flex-shrink-0`}
              style={{ backgroundColor: color.primary.accent, color: 'white' }}
            >
              {user.first_name?.[0]?.toUpperCase() || ""}
              {user.last_name?.[0]?.toUpperCase() || ""}
            </div>

            {/* User Info Beside Avatar */}
            <div>
              <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                {user.first_name} {user.last_name}
              </h2>
              <p className={`text-sm ${tw.textSecondary} mt-1`}>
                {user.email_address || user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    statusValue
                  )}`}
                >
                  {statusLabel}
                </span>
                {user.role_name && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {user.role_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Upload Button - Commented Out */}
          {/* {isEditing && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleUploadClick}
                className={`inline-flex items-center text-sm font-medium  focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{
                  backgroundColor: button.action.background,
                  color: button.action.color,
                  borderRadius: button.action.borderRadius,
                  padding: `${button.action.paddingY} ${button.action.paddingX}`,
                }}
              >
                Upload Photo
              </button>
              {user.photo_url && (
                <button
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          )}

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          /> */}
        </div>

        {/* Profile Information */}
        <div className="space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              {t.profile.personalInformation}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {isEditing ? (
                <Input
                  label={t.profile.firstName}
                  name="first_name"
                  value={formData.first_name}
                  onChange={(val) => setFormData({ ...formData, first_name: val })}
                />
              ) : (
                <div>
                  <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>
                    {t.profile.firstName}
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {user.first_name || "N/A"}
                  </p>
                </div>
              )}
            </div>

            {/* <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                Middle Name
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.middle_name || "N/A"}
                </p>
              )}
            </div> */}

            <div>
              {isEditing ? (
                <Input
                  label={t.profile.lastName}
                  name="last_name"
                  value={formData.last_name}
                  onChange={(val) => setFormData({ ...formData, last_name: val })}
                />
              ) : (
                <div>
                  <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>
                    {t.profile.lastName}
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {user.last_name || "N/A"}
                  </p>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Middle Name"
                  name="middle_name"
                  value={formData.middle_name || ""}
                  onChange={(val) => setFormData({ ...formData, middle_name: val || null })}
                />
              ) : (
                <div>
                  <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>
                    Middle Name
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {user.middle_name || "N/A"}
                  </p>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Preferred Name"
                  name="preferred_name"
                  value={formData.preferred_name || ""}
                  onChange={(val) => setFormData({ ...formData, preferred_name: val || null })}
                />
              ) : (
                <div>
                  <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>
                    Preferred Name
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {user.preferred_name || "N/A"}
                  </p>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label={t.profile.phoneNumber}
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={(val) => setFormData({ ...formData, phone_number: val || null })}
                />
              ) : (
                <div>
                  <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>
                    {t.profile.phoneNumber}
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {user.phone_number || "N/A"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.emailAddress}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.email_address || user.email || "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t.profile.emailCannotBeChanged}
              </p>
            </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              {t.profile.professionalInformation}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {isEditing ? (
                <Input
                  label={t.profile.department}
                  name="department"
                  value={formData.department || ""}
                  onChange={(val) => setFormData({ ...formData, department: val || null })}
                />
              ) : (
                <div>
                  <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>
                    {t.profile.department}
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {user.department || "N/A"}
                  </p>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label={t.profile.jobTitle}
                  name="job_title"
                  value={formData.job_title || ""}
                  onChange={(val) => setFormData({ ...formData, job_title: val || null })}
                />
              ) : (
                <div>
                  <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>
                    {t.profile.jobTitle}
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {user.job_title || "N/A"}
                  </p>
                </div>
              )}
            </div>

            {/* Timezone selection moved to Settings page */}
            {/* <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.timezone}
              </label>
              {isEditing ? (
                <HeadlessSelect
                  options={timezones.map((tz) => ({
                    value: tz.value,
                    label: `${tz.label} (${tz.utc_offset})`,
                  }))}
                  value={formData.timezone || ""}
                  onChange={(val) => setFormData({ ...formData, timezone: val })}
                  placeholder={t.profile.timezonePlaceholder}
                  isLoading={isLoadingTimezones}
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.timezone || "N/A"}
                </p>
              )}
            </div> */}
            </div>
          </div>
        </div>

        {/* Account Information (Read-only) */}
        <div className="mt-8 pt-6">
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
            {t.profile.accountInformation}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.username}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{user.username}</p>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.dataAccessLevel}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.data_access_level || "N/A"}
              </p>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.piiAccess}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.can_access_pii || user.pii_access ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.lastLogin}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {lastLoginValue ? (
                  <DateFormatter date={lastLoginValue} includeTime useLocale />
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.accountCreated}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.created_at ? (
                  <DateFormatter date={user.created_at} includeTime useLocale />
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.lastUpdated}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.updated_at ? (
                  <DateFormatter date={user.updated_at} includeTime useLocale />
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* TODO: Uncomment when backend confirms /user-sessions endpoints
        Active Sessions / Manage Devices
        <div className="mt-8 pt-6">
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
            Active Sessions
          </h3>

          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner variant="modern" size="md" color="primary" />
            </div>
          ) : sessions.length === 0 ? (
            <p className={`text-sm ${tw.textSecondary} py-4`}>
              No active sessions found.
            </p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Device</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">IP Address</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Last Activity</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {session.device_type ? session.device_type.charAt(0).toUpperCase() + session.device_type.slice(1) : "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {session.session_type ? session.session_type.toUpperCase() : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {session.ip_address || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {session.last_activity_at ? (
                          <DateFormatter date={session.last_activity_at} includeTime useLocale />
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEndSession(session.id)}
                          disabled={isEndingSession === session.id}
                          className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="End this session"
                        >
                          {isEndingSession === session.id ? (
                            <>
                              <LoadingSpinner variant="modern" size="sm" color="red" />
                              <span className="ml-2">Ending...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              End
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        */}
      </div>
    </div>
  );
}
