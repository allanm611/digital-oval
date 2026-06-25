import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import logo from "/img/sentra.webp";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { accountService } from "../../account/services/accountService";
import { useToast } from "../../../contexts/ToastContext";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { departmentService } from "../../campaigns/services/departmentService";
import { roleService } from "../../roles/services/roleService";
import { workflowService } from "../../jobs/services/workflowService";
import { ConfigurationItem } from "../../configurations/components/ConfigurationManager";
import { Role } from "../../roles/types/role";
import Checkbox from "../../../shared/components/ui/Checkbox";

export default function RequestAccountPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    roleId: "",
    reason: "",
    workflowId: "",
    accessDurationDays: "",
    consentGiven: false,
    privacyPolicyAccepted: false,
    termsAccepted: false,
    dataProcessingConsent: false,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [departments, setDepartments] = useState<ConfigurationItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await departmentService.getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to load departments:", error);
        showError("Error", "Failed to load departments");
      } finally {
        setLoadingDepartments(false);
      }
    };

    const loadRoles = async () => {
      try {
        const response = await roleService.listRoles({ limit: 100 });
        if (response.roles) {
          setRoles(response.roles);
        }
      } catch (error) {
        console.error("Failed to load roles:", error);
        showError("Error", "Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    const loadWorkflows = async () => {
      try {
        const response = await workflowService.getActiveWorkflows({
          limit: 100,
          skipCache: true,
        });
        if (response.data && Array.isArray(response.data)) {
          setWorkflows(response.data);
        }
      } catch (error) {
        console.error("Failed to load workflows:", error);
        showError("Error", "Failed to load workflows");
      } finally {
        setLoadingWorkflows(false);
      }
    };

    loadDepartments();
    loadRoles();
    loadWorkflows();
  }, [showError]);

  const goHome = () => {
    navigate("/login");
  };

  const clearError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = t.auth.requestAccount.emailLabel;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else {
      const digitsOnly = formData.phone.replace(/\D/g, "");
      const isValid = digitsOnly.length >= 9 && digitsOnly.length <= 13;

      if (!isValid) {
        errors.phone = "Please enter a valid phone number (9-13 digits)";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};

    if (!formData.department) {
      errors.department = "Department is required";
    }

    if (!formData.roleId) {
      errors.roleId = "Role is required";
    }

    if (!formData.reason.trim()) {
      errors.reason = "Reason for request is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};

    if (!formData.workflowId) {
      errors.workflowId = "Workflow is required";
    }

    if (!formData.consentGiven) {
      errors.consentGiven = "You must consent to data processing";
    }

    if (!formData.privacyPolicyAccepted) {
      errors.privacyPolicyAccepted = "You must accept the privacy policy";
    }

    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must accept the terms of use";
    }

    if (!formData.dataProcessingConsent) {
      errors.dataProcessingConsent = "You must consent to automated data processing";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create request (Draft)
      const createData = await accountService.createAccountRequest({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email_address: formData.email,
        business_justification: formData.reason,
        created_by_source: "online_portal",
        department: formData.department || undefined,
        // requested_role_id: formData.roleId ? parseInt(formData.roleId) : undefined,
        access_duration_days: formData.accessDurationDays ? parseInt(formData.accessDurationDays) : undefined,
      });

      if (!createData.success) {
        throw new Error(createData.error || "Failed to create request");
      }

      console.log("Create response:", createData);
      const requestId = createData.data?.id || (createData.data as any)?.requestId || (createData as any)?.requestId;

      if (!requestId) {
        throw new Error("No request ID returned from backend");
      }

      console.log("Request created with ID:", requestId);

      // Step 2: Record Consents
      try {
        console.log("Recording consents for request ID:", requestId);
        await accountService.recordConsents(requestId, {
          termsVersion: "1.0",
        });
        console.log("Consents recorded successfully");
      } catch (err) {
        console.error("Failed to record consents:", err);
        throw err;
      }

      // Step 3: Submit request
      const submitData = await accountService.submitAccountRequest(requestId, {
        workflowId: parseInt(formData.workflowId),
        approvalRequiredCount: 1,
        approvalDeadlineDays: 7,
      });

      if (!submitData.success) {
        throw new Error(submitData.error || "Failed to submit request");
      }

      setRequestSubmitted(true);
      success(
        t.auth.requestAccount.title,
        `Your request (ID: ${requestId}) has been submitted for approval.`
      );
    } catch (error: unknown) {
      console.error("Account request failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (
        errorMessage.includes("Email already exists") ||
        errorMessage.includes("already exists")
      ) {
        setValidationErrors({
          email:
            "An account with this email already exists. Please try logging in or use a different email.",
        });
      } else {
        setValidationErrors({
          general: t.auth.requestAccount.errorMessage,
        });
        // Filter out HTTP errors
        const userMessage =
          errorMessage.includes("HTTP error") ||
          errorMessage.includes("status:")
            ? t.auth.requestAccount.errorMessage
            : errorMessage;
        showError("Request Failed", userMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      roleId: "",
      reason: "",
      workflowId: "",
      accessDurationDays: "",
      consentGiven: false,
      privacyPolicyAccepted: false,
      termsAccepted: false,
      dataProcessingConsent: false,
    });
    setCurrentStep(1);
    setRequestSubmitted(false);
    setValidationErrors({});
  };

  return (
    <div className="account-request-page">
      {/* Background elements */}
      <div className="bg-gradients"></div>
      <div className="bg-particles"></div>
      <div className="bg-grid"></div>

      {/* Header */}
      <header className="page-header">
        <div className="container">
          <div className="brand-logo">
            <img src={logo} alt="Sentra Logo" className="h-10 w-auto object-contain" />
          </div>
          <button className="btn-back-home" onClick={goHome}>
            <ArrowLeft size={16} />
            {t.auth.requestAccount.cancelButton}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <div className="content-wrapper">
            {/* Left side - Info */}
            <div className="info-section">
              <div className="info-content">
                <h1 className="page-title">{t.auth.requestAccount.title}</h1>
                <p className="page-subtitle">
                  {t.auth.login.subheading}
                </p>

                <div className="features-list">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <CheckCircle2 size={20} />
                    </div>
                    <span>{t.auth.login.benefits.automation}</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <CheckCircle2 size={20} />
                    </div>
                    <span>{t.auth.login.benefits.insights}</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <CheckCircle2 size={20} />
                    </div>
                    <span>{t.auth.login.benefits.dataplatform}</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <CheckCircle2 size={20} />
                    </div>
                    <span>AI-powered targeting</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="form-section">
              <div
                className="form-card"
                style={{ display: requestSubmitted ? "none" : "block" }}
              >
                <div className="form-header">
                  <h2>{t.auth.requestAccount.title}</h2>
                  <p>
                    {t.auth.requestAccount.title}. Our administrator will review your request and contact you by email.
                  </p>
                </div>

                <form onSubmit={submitRequest} className="request-form">
                  <div
                    className="form-step"
                    style={{ display: currentStep === 1 ? "block" : "none" }}
                  >
                    <div className="step-header">
                      <h3>Personal Information</h3>
                      <div className="step-indicator">Step 1 of 3</div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">
                          {t.auth.requestAccount.fullNameLabel.split(" ")[0]} <span className="required">*</span>
                        </label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              firstName: String(value),
                            }));
                            clearError("firstName");
                          }}
                          type="text"
                          required
                          className={
                            validationErrors.firstName ? "invalid" : ""
                          }
                        />
                        <span
                          className="error-message"
                          style={{
                            display: validationErrors.firstName
                              ? "block"
                              : "none",
                          }}
                        >
                          {validationErrors.firstName}
                        </span>
                      </div>

                      <div className="form-group">
                        <label htmlFor="lastName">
                          Last Name <span className="required">*</span>
                        </label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              lastName: String(value),
                            }));
                            clearError("lastName");
                          }}
                          type="text"
                          required
                          className={validationErrors.lastName ? "invalid" : ""}
                        />
                        <span
                          className="error-message"
                          style={{
                            display: validationErrors.lastName
                              ? "block"
                              : "none",
                          }}
                        >
                          {validationErrors.lastName}
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        {t.auth.requestAccount.emailLabel} <span className="required">*</span>
                      </label>
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            email: String(value),
                          }));
                          clearError("email");
                        }}
                        type="email"
                        required
                        placeholder={t.auth.requestAccount.emailPlaceholder}
                        className={validationErrors.email ? "invalid" : ""}
                      />
                      <span
                        className="error-message"
                        style={{
                          display: validationErrors.email ? "block" : "none",
                        }}
                      >
                        {validationErrors.email}
                      </span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone <span className="required">*</span></label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            phone: String(value),
                          }));
                          clearError("phone");
                        }}
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        className={validationErrors.phone ? "invalid" : ""}
                      />
                      <span
                        className="error-message"
                        style={{
                          display: validationErrors.phone ? "block" : "none",
                        }}
                      >
                        {validationErrors.phone}
                      </span>
                    </div>

                    <div className="form-navigation">
                      <button
                        type="button"
                        className="btn-next"
                        onClick={nextStep}
                      >
                        {t.common.next}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div
                    className="form-step"
                    style={{ display: currentStep === 2 ? "block" : "none" }}
                  >
                    <div className="step-header">
                      <h3>Professional Information</h3>
                      <div className="step-indicator">Step 2 of 3</div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="department">
                        {t.auth.requestAccount.departmentLabel} <span className="required">*</span>
                      </label>
                      <HeadlessSelect
                        value={formData.department}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            department: value as string,
                          }));
                          clearError("department");
                        }}
                        options={[
                          {
                            label: t.auth.requestAccount.departmentPlaceholder,
                            value: "",
                            disabled: true,
                          },
                          ...departments.map((dept) => ({
                            label: dept.name,
                            value: dept.id?.toString() || dept.name,
                          })),
                        ]}
                        placeholder={t.auth.requestAccount.departmentPlaceholder}
                        error={!!validationErrors.department}
                        disabled={loadingDepartments}
                      />
                      <span
                        className="error-message"
                        style={{
                          display: validationErrors.department
                            ? "block"
                            : "none",
                        }}
                      >
                        {validationErrors.department}
                      </span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="role">
                        Role <span className="required">*</span>
                      </label>
                      <HeadlessSelect
                        value={formData.roleId}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            roleId: value as string,
                          }));
                          clearError("roleId");
                        }}
                        options={[
                          {
                            label: "Select a role",
                            value: "",
                            disabled: true,
                          },
                          ...roles.map((role) => ({
                            label: role.name,
                            value: role.id.toString(),
                          })),
                        ]}
                        placeholder="Select a role"
                        error={!!validationErrors.roleId}
                        disabled={loadingRoles}
                      />
                      <span
                        className="error-message"
                        style={{
                          display: validationErrors.roleId ? "block" : "none",
                        }}
                      >
                        {validationErrors.roleId}
                      </span>
                    </div>

                    <div className="form-group">
                      <Textarea
                        label={<>{t.auth.requestAccount.reasonLabel} <span className="required">*</span></>}
                        value={formData.reason}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            reason: value,
                          }));
                          clearError("reason");
                        }}
                        required
                        rows={4}
                        placeholder={t.auth.requestAccount.reasonPlaceholder}
                        hasError={!!validationErrors.reason}
                      />
                      <span
                        className="error-message"
                        style={{
                          display: validationErrors.reason ? "block" : "none",
                        }}
                      >
                        {validationErrors.reason}
                      </span>
                    </div>

                    <div className="form-navigation">
                      <button
                        type="button"
                        className="btn-back"
                        onClick={prevStep}
                      >
                        <ArrowLeft size={16} />
                        {t.common.previous}
                      </button>
                      <button
                        type="button"
                        className="btn-next"
                        onClick={nextStep}
                      >
                        {t.common.next}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div
                    className="form-step"
                    style={{ display: currentStep === 3 ? "block" : "none" }}
                  >
                    <div className="step-header">
                      <h3>Approval & Consent</h3>
                      <div className="step-indicator">Step 3 of 3</div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="workflow">
                        Approval Workflow <span className="required">*</span>
                      </label>
                      <HeadlessSelect
                        value={formData.workflowId}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            workflowId: value as string,
                          }));
                          clearError("workflowId");
                        }}
                        options={[
                          {
                            label: "Select a workflow",
                            value: "",
                            disabled: true,
                          },
                          ...workflows.map((workflow) => ({
                            label: `${workflow.name} - ${workflow.description}`,
                            value: workflow.id.toString(),
                          })),
                        ]}
                        placeholder="Select approval workflow"
                        error={!!validationErrors.workflowId}
                        disabled={loadingWorkflows}
                      />
                      <span
                        className="error-message"
                        style={{
                          display: validationErrors.workflowId ? "block" : "none",
                        }}
                      >
                        {validationErrors.workflowId}
                      </span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="accessDuration">
                        Access Duration (days)
                      </label>
                      <Input
                        id="accessDuration"
                        value={formData.accessDurationDays}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            accessDurationDays: String(value),
                          }));
                        }}
                        type="number"
                        min="1"
                        placeholder="Leave empty for permanent access"
                      />
                      <small style={{ color: "#94a3b8", marginTop: "0.25rem", display: "block" }}>
                        Leave empty for permanent access
                      </small>
                    </div>

                    <div style={{ marginTop: "2rem", paddingTop: "1.5rem" }}>
                      <h4 style={{ marginBottom: "1.5rem", color: "#ffffff", fontSize: "1rem", fontWeight: "600" }}>
                        Privacy & Consent <span className="required">*</span>
                      </h4>

                      <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", marginBottom: "0" }}>
                          <Checkbox
                            checked={formData.consentGiven}
                            onChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                consentGiven: value,
                              }));
                              clearError("consentGiven");
                            }}
                          />
                          <span>I consent to data processing as described above</span>
                        </label>
                        <span
                          className="error-message"
                          style={{
                            display: validationErrors.consentGiven ? "block" : "none",
                            marginTop: "0.5rem",
                          }}
                        >
                          {validationErrors.consentGiven}
                        </span>
                      </div>

                      <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", marginBottom: "0" }}>
                          <Checkbox
                            checked={formData.privacyPolicyAccepted}
                            onChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                privacyPolicyAccepted: value,
                              }));
                              clearError("privacyPolicyAccepted");
                            }}
                          />
                          <span>I have read and accept the privacy policy</span>
                        </label>
                        <span
                          className="error-message"
                          style={{
                            display: validationErrors.privacyPolicyAccepted ? "block" : "none",
                            marginTop: "0.5rem",
                          }}
                        >
                          {validationErrors.privacyPolicyAccepted}
                        </span>
                      </div>

                      <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", marginBottom: "0" }}>
                          <Checkbox
                            checked={formData.termsAccepted}
                            onChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                termsAccepted: value,
                              }));
                              clearError("termsAccepted");
                            }}
                          />
                          <span>I accept the terms of use</span>
                        </label>
                        <span
                          className="error-message"
                          style={{
                            display: validationErrors.termsAccepted ? "block" : "none",
                            marginTop: "0.5rem",
                          }}
                        >
                          {validationErrors.termsAccepted}
                        </span>
                      </div>

                      <div className="form-group">
                        <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", marginBottom: "0" }}>
                          <Checkbox
                            checked={formData.dataProcessingConsent}
                            onChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                dataProcessingConsent: value,
                              }));
                              clearError("dataProcessingConsent");
                            }}
                          />
                          <span>I consent to automated data processing</span>
                        </label>
                        <span
                          className="error-message"
                          style={{
                            display: validationErrors.dataProcessingConsent ? "block" : "none",
                            marginTop: "0.5rem",
                          }}
                        >
                          {validationErrors.dataProcessingConsent}
                        </span>
                      </div>
                    </div>

                    <div className="form-navigation">
                      <button
                        type="button"
                        className="btn-back"
                        onClick={prevStep}
                      >
                        <ArrowLeft size={16} />
                        {t.common.previous}
                      </button>
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={isSubmitting}
                      >
                        {!isSubmitting ? (
                          t.auth.requestAccount.submitButton
                        ) : (
                          <span className="loading-content">
                            <div className="loading-spinner"></div>
                            {t.auth.requestAccount.submitButton}...
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Success Message */}
              <div
                className="success-card"
                style={{ display: requestSubmitted ? "block" : "none" }}
              >
                <div className="success-content">
                  <div className="success-icon">
                    <CheckCircle2 size={80} />
                  </div>
                  <h2>{t.auth.requestAccount.successMessage}</h2>
                  <p>
                    {t.auth.requestAccount.successMessage}
                  </p>
                  <div className="success-actions">
                    <button className="btn-primary" onClick={resetForm}>
                      {t.auth.requestAccount.submitButton}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
