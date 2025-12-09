import { useState, useEffect, useMemo } from "react";
import {
  User,
  Save,
  Mail,
  Phone,
  Clock,
  Shield,
  X,
  CheckCircle,
} from "lucide-react";
import { userService } from "../services/userService";
import { UserType, UpdateUserRequest } from "../types/user";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw, button } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useLanguage } from "../../../contexts/LanguageContext";

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
];

export default function UserProfilePage() {
  const { user: authUser } = useAuth();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    first_name: "",
    last_name: "",
    // middle_name: null,
    // preferred_name: null,
    phone_number: null,
    department: null,
    job_title: null,
    timezone: "",
    language_preference: "",
  });

  useEffect(() => {
    if (authUser?.user_id) {
      loadUserProfile();
    } else {
      setIsLoading(false);
      showError(t.profile.profileUpdated, t.profile.errorUserInfoNotAvailable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser?.user_id) return;

    try {
      setIsLoading(true);
      const response = await userService.getUserById(authUser.user_id);

      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          // middle_name: userData.middle_name || null,
          // preferred_name: userData.preferred_name || null,
          phone_number: userData.phone_number || null,
          department: userData.department || null,
          job_title: userData.job_title || null,
          timezone: userData.timezone || "",
          language_preference: userData.language_preference || "",
        });
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      showError(t.profile.profileUpdated, t.profile.errorLoadProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const nullableFields = useMemo(
    () =>
      new Set([
        // "middle_name",
        // "preferred_name",
        "phone_number",
        "department",
        "job_title",
        "language_preference",
      ]),
    []
  );

  const languageLookup = useMemo(() => {
    return languageOptions.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, []);

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

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const response = await userService.updateUser(user.id, formData);

      if (response.success) {
        setUser(response.data);
        setIsEditing(false);
        success(t.profile.profileUpdated, t.profile.profileUpdatedSuccess);
        // Reload profile to get latest data
        await loadUserProfile();
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
        // middle_name: user.middle_name || null,
        // preferred_name: user.preferred_name || null,
        phone_number: user.phone_number || null,
        department: user.department || null,
        job_title: user.job_title || null,
        timezone: user.timezone || "",
        language_preference: user.language_preference || "",
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

  const statusValue =
    (user.account_status || user.status || "unknown")?.toLowerCase() ??
    "unknown";
  const statusLabel =
    statusValue === "unknown"
      ? t.profile.statusUnknown
      : statusValue
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
  const lastLoginValue = user.last_login_at || user.last_login || null;

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
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                {t.profile.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-auto"
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
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t.profile.saveChanges}
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 w-auto"
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Profile Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: color.primary.accent }}
            >
              {user.first_name?.[0]?.toUpperCase() || ""}
              {user.last_name?.[0]?.toUpperCase() || ""}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                {user.first_name} {/* {user.middle_name} */} {user.last_name}
                {/* {user.preferred_name && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({user.preferred_name})
                  </span>
                )} */}
              </h2>
              <p className={`text-sm ${tw.textSecondary} mt-1`}>
                {user.email_address || user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
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
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              {t.profile.personalInformation}
            </h3>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.firstName}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.first_name || "N/A"}
                </p>
              )}
            </div>

            {/* <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                Middle Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.middle_name || "N/A"}
                </p>
              )}
            </div> */}

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.lastName}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.last_name || "N/A"}
                </p>
              )}
            </div>

            {/* <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                Preferred Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="preferred_name"
                  value={formData.preferred_name || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.preferred_name || "N/A"}
                </p>
              )}
            </div> */}

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1 flex items-center gap-2`}
              >
                <Mail className="w-4 h-4" />
                {t.profile.emailAddress}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.email_address || user.email || "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t.profile.emailCannotBeChanged}
              </p>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1 flex items-center gap-2`}
              >
                <Phone className="w-4 h-4" />
                {t.profile.phoneNumber}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.phone_number || "N/A"}
                </p>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              {t.profile.professionalInformation}
            </h3>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.department}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.department || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.jobTitle}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.job_title || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.timezone}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  placeholder={t.profile.timezonePlaceholder}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {user.timezone || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1`}
              >
                {t.profile.languagePreference}
              </label>
              {isEditing ? (
                <HeadlessSelect
                  options={languageOptions}
                  value={formData.language_preference || ""}
                  onChange={(value) =>
                    handleSelectChange(
                      "language_preference",
                      (value as string) || ""
                    )
                  }
                  placeholder={t.profile.selectLanguage}
                  searchable
                />
              ) : (
                <p className={`text-sm ${tw.textPrimary}`}>
                  {languageLookup[user.language_preference ?? ""] ||
                    user.language_preference?.toUpperCase() ||
                    "N/A"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account Information (Read-only) */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
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
                className={`block text-sm font-medium ${tw.textSecondary} mb-1 flex items-center gap-2`}
              >
                <Shield className="w-4 h-4" />
                {t.profile.dataAccessLevel}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.data_access_level || "N/A"}
              </p>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1 flex items-center gap-2`}
              >
                <CheckCircle className="w-4 h-4" />
                {t.profile.piiAccess}
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {user.can_access_pii || user.pii_access ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textSecondary} mb-1 flex items-center gap-2`}
              >
                <Clock className="w-4 h-4" />
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
                  <DateFormatter date={user.created_at} useLocale />
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
                  <DateFormatter date={user.updated_at} useLocale />
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
