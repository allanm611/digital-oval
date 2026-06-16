import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, User as UserIcon, Mail, Lock } from "lucide-react";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { userService } from "../../users/services/userService";
import { accountService } from "../../account/services/accountService";
import {
  UserType,
  CreateUserRequest,
  UpdateUserRequest,
} from "../../users/types/user";
import { useToast } from "../../../contexts/ToastContext";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex, button, getButtonStyles } from "../../../shared/utils/utils";
import { roleService } from "../../roles/services/roleService";
import { Role } from "../../roles/types/role";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserType | null;
  onUserSaved: () => void;
}

interface UserFormData {
  username: string;
  first_name: string;
  last_name: string;
  email_address: string;
  password?: string;
  primary_role_id?: number;
  department?: string;
}

export default function UserModal({
  isOpen,
  onClose,
  user,
  onUserSaved,
}: UserModalProps) {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    first_name: "",
    last_name: "",
    email_address: "",
    password: "",
    primary_role_id: undefined,
    department: "",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email_address: user.email_address || user.email || "",
        password: "", // Don't populate password for updates
        primary_role_id: user.primary_role_id ?? user.role_id ?? undefined,
        department: user.department || "",
      });
    } else {
      setFormData({
        username: "",
        first_name: "",
        last_name: "",
        email_address: "",
        password: "",
        primary_role_id: undefined,
        department: "",
      });
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      setRolesError(null);
      try {
        const { roles: fetchedRoles, meta } = await roleService.listRoles({
          limit: 100,
          offset: 0,
          skipCache: true,
        });

        if (isCancelled) return;

        setRoles(fetchedRoles);

        setFormData((prev) => {
          const currentRoleId = prev.primary_role_id;
          const hasCurrentRole = currentRoleId
            ? fetchedRoles.some((role) => role.id === currentRoleId)
            : false;

          if (hasCurrentRole) {
            return prev;
          }

          const fallbackRoleId =
            (user?.primary_role_id ?? user?.role_id)
              ? (user?.primary_role_id ?? user?.role_id ?? undefined)
              : (fetchedRoles.find((role) => role.is_default)?.id ??
                fetchedRoles[0]?.id);

          return {
            ...prev,
            primary_role_id: fallbackRoleId ?? prev.primary_role_id,
          };
        });

        if (meta?.total && meta.pageSize && meta.total > meta.pageSize) {
          console.warn(
            "Role list truncated. Consider implementing pagination or search for roles.",
          );
        }
      } catch (err) {
        if (isCancelled) return;
        console.error("Failed to load roles", err);
        setRolesError(
          err instanceof Error ? err.message : "Failed to load roles",
        );
        setRoles([]);
      } finally {
        if (!isCancelled) {
          setIsLoadingRoles(false);
        }
      }
    };

    fetchRoles();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, user]);

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.id,
        label: role.name,
      })),
    [roles],
  );

  const handleInputChange = (fieldName: keyof UserFormData) => (value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.primary_role_id) {
      error("Validation Error", "Role is required to create or update a user");
      setIsLoading(false);
      return;
    }

    try {
      if (user) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          department: formData.department || undefined,
        };
        await userService.updateUser(user.id, updateData);

        const previousRoleId = user.primary_role_id ?? user.role_id ?? null;
        if (
          formData.primary_role_id &&
          formData.primary_role_id !== previousRoleId
        ) {
          await userService.assignRole(user.id, {
            role_id: formData.primary_role_id,
          });
        }
        success(
          "User Updated",
          `${formData.first_name} ${formData.last_name} has been updated successfully`,
        );
      } else {
        // Create new user - need to hash password first
        if (!formData.password || formData.password.length < 8) {
          error(
            "Validation Error",
            "Password is required and must be at least 8 characters",
          );
          setIsLoading(false);
          return;
        }

        // Hash password using the dev endpoint
        const hashResponse = await accountService.hashPassword(
          formData.password,
        );
        if (!hashResponse.success) {
          console.error("❌ Hash failed:", hashResponse);
          throw new Error("Failed to hash password");
        }

        // Get hashed password from response
        const hashedPassword = hashResponse.hashedPassword || hashResponse.data?.hashedPassword;

        if (!hashedPassword) {
          console.error("❌ No hashed password in response:", hashResponse);
          throw new Error("Failed to get hashed password from response");
        }

        const createData: CreateUserRequest = {
          username: formData.username || formData.email_address.split("@")[0],
          first_name: formData.first_name,
          last_name: formData.last_name,
          email_address: formData.email_address,
          password_hash: hashedPassword,
          password_algorithm: "bcrypt",
          primary_role_id: formData.primary_role_id,
          department: formData.department || undefined,
        };

        const createResponse = await userService.createUser(createData);
        success(
          "User Created",
          `${formData.first_name} ${formData.last_name} has been created successfully`,
        );
      }

      onUserSaved();
      onClose();
    } catch (err) {
      error(
        user ? "Update Error" : "Creation Error",
        err instanceof Error ? err.message : "An error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return isOpen
    ? createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: zIndex.modal,
          }}
        >
          <div
            className={`bg-white ${tw.rounded} shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
            style={{ zIndex: zIndex.modal + 1 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${tw.borderDefault}`}
            >
              <div className="flex items-center">
                <h2 className={`text-xl font-bold ${tw.textPrimary}`}>
                  {user ? "Edit User" : "Add User"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-2 hover:bg-gray-50 ${tw.rounded} transition-colors`}
              >
                <X className={`w-5 h-5 ${tw.textMuted}`} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className={`w-5 h-5 ${tw.textMuted}`} />
                  </div>
                  <Input
                    label="First Name *"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange('first_name')}
                    required
                    className={`block w-full pl-10 pr-3 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 text-sm`}
                    placeholder="First Name"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className={`w-5 h-5 ${tw.textMuted}`} />
                  </div>
                  <Input
                    label="Last Name *"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange('last_name')}
                    required
                    className={`block w-full pl-10 pr-3 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 text-sm`}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 ${tw.textMuted}`} />
                  </div>
                  <Input
                    label="Email *"
                    name="email_address"
                    type="email"
                    value={formData.email_address}
                    onChange={handleInputChange('email_address')}
                    required
                    disabled={!!user}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      tw.borderDefault
                    } ${
                      tw.rounded
                    } focus:outline-none transition-all duration-200 text-sm ${
                      user ? "bg-gray-100 cursor-not-allowed opacity-75" : ""
                    }`}
                    placeholder="email@example.com"
                  />
                </div>
                {user && (
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed after user creation
                  </p>
                )}
              </div>

              {!user && (
                <>
                  <Input
                    label="Username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    className={`block w-full px-3 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 text-sm`}
                    placeholder="Leave empty to auto-generate from email"
                  />

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${tw.textMuted}`} />
                    </div>
                    <Input
                      label={<>Password * <span className="text-xs text-gray-500">(min 8 characters)</span></>}
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      required
                      minLength={8}
                      className={`block w-full pl-10 pr-3 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 text-sm`}
                      placeholder="Password"
                    />
                  </div>
                </>
              )}

              <div className="space-y-4">
                <div>
                  <HeadlessSelect
                    label="Role *"
                    options={roleOptions}
                    value={formData.primary_role_id ?? ""}
                    onChange={(value) => {
                      const numericValue =
                        typeof value === "string" ? Number(value) : value;
                      setFormData((prev) => ({
                        ...prev,
                        primary_role_id: Number.isNaN(numericValue)
                          ? undefined
                          : numericValue,
                      }));
                    }}
                    placeholder={
                      isLoadingRoles
                        ? "Loading roles..."
                        : roleOptions.length > 0
                          ? "Select a role"
                          : "No roles available"
                    }
                    disabled={isLoadingRoles || roleOptions.length === 0}
                    searchable
                    className="w-full"
                    zIndex={zIndex.popover}
                  />
                  {rolesError && (
                    <p className="mt-2 text-xs text-red-600">{rolesError}</p>
                  )}
                </div>
                <Input
                  label="Department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleInputChange('department')}
                  className={`block w-full px-3 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 text-sm`}
                  placeholder="Department"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                  style={getButtonStyles(button.bordered)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`text-white ${tw.rounded} transition-all duration-200 font-medium text-sm px-4 py-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner
                        variant="modern"
                        size="sm"
                        color="primary"
                        className="mr-2"
                      />
                      {user ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    user ? "Update" : "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )
    : null;
}
