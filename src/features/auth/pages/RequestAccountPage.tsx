import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { accountService } from "../../account/services/accountService";
import { useToast } from "../../../contexts/ToastContext";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

export default function RequestAccountPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    reason: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};

    if (!formData.department) {
      errors.department = "Department is required";
    }

    if (!formData.position.trim()) {
      errors.position = "Position is required";
    }

    if (!formData.reason.trim()) {
      errors.reason = "Reason for request is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await accountService.createAccountRequest({
        email_address: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        business_justification: formData.reason,
        created_by_source: "online_portal",
        department: formData.department || undefined,
      });

      setRequestSubmitted(true);
      success(
        t.auth.requestAccount.title,
        t.auth.requestAccount.successMessage
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
      position: "",
      reason: "",
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
            <h1 className="brand-name">Sentra</h1>
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
                      <div className="step-indicator">Step 1 of 2</div>
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
                      <label htmlFor="phone">Phone</label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: String(value),
                          }))
                        }
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                      />
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
                      <div className="step-indicator">Step 2 of 2</div>
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
                          { label: "Marketing", value: "marketing" },
                          { label: "Sales", value: "sales" },
                          { label: "IT", value: "it" },
                          { label: "Human Resources", value: "hr" },
                          { label: "Finance", value: "finance" },
                          { label: "Operations", value: "operations" },
                        ]}
                        placeholder={t.auth.requestAccount.departmentPlaceholder}
                        error={!!validationErrors.department}
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
                      <label htmlFor="position">
                        Position <span className="required">*</span>
                      </label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            position: String(value),
                          }));
                          clearError("position");
                        }}
                        type="text"
                        required
                        placeholder={t.auth.requestAccount.reasonPlaceholder}
                        className={validationErrors.position ? "invalid" : ""}
                      />
                      <span
                        className="error-message"
                        style={{
                          display: validationErrors.position ? "block" : "none",
                        }}
                      >
                        {validationErrors.position}
                      </span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="reason">
                        {t.auth.requestAccount.reasonLabel} <span className="required">*</span>
                      </label>
                      <textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            reason: e.target.value,
                          }));
                          clearError("reason");
                        }}
                        required
                        rows={4}
                        placeholder={t.auth.requestAccount.reasonPlaceholder}
                        className={validationErrors.reason ? "invalid" : ""}
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
