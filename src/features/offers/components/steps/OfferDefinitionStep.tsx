import { useState } from "react";
import Input from '../../../../shared/components/ui/Input';
import Textarea from "../../../../shared/components/ui/Textarea";
import { ChevronDown, Search } from "lucide-react";
import StepFlowLayout from "../../../../shared/components/ui/StepFlowLayout";
import { CreateOfferRequest } from "../../../types/offer";
import { useBackendOfferTypeData } from "../../../../shared/hooks/useBackendOfferTypeData";

import { tw } from '../../../shared/utils/utils';
interface OfferDefinitionStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  formData: CreateOfferRequest & { type?: string };
  setFormData: (data: CreateOfferRequest & { type?: string }) => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
}

export default function OfferDefinitionStep({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  formData,
  setFormData,
  onSaveDraft,
  onCancel,
}: OfferDefinitionStepProps) {
  const [typeSearchTerm, setTypeSearchTerm] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const { data: offerTypes, loading: offerTypesLoading } = useBackendOfferTypeData();

  const isFormValid =
    formData.name?.trim() && formData.type && formData.description?.trim();

  return (
    <StepFlowLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepTitle="Offer Definition"
      stepDescription="Define your offer details and specifications"
      onNext={onNext}
      onPrev={onPrev}
      onSaveDraft={onSaveDraft}
      onCancel={onCancel}
      isNextDisabled={!isFormValid}
      nextButtonText="Next Step"
    >
      {/* Offer Information */}
      <div className={`bg-white border border-gray-200 ${tw.rounded} p-6 space-y-4`}>
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Offer Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Offer Name */}
          <Input
            label="Offer Name *"
            type="text"
            value={formData.name || ""}
            onChange={(value) =>
              setFormData({ ...formData, name: String(value) })
            }
            placeholder="Enter offer name"
            required
          />

          {/* Offer Type */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Type *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157] bg-white text-sm text-left flex items-center justify-between`}
                disabled={offerTypesLoading}
              >
                <span
                  className={formData.type ? "text-gray-900" : "text-gray-500"}
                >
                  {formData.type
                    ? offerTypes.find((t) => t.id.toString() === formData.type.toString())?.name
                    : offerTypesLoading ? "Loading..." : "Select type"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isTypeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isTypeDropdownOpen && (
                <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg max-h-60 overflow-auto`}>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        value={typeSearchTerm}
                        onChange={(value) => setTypeSearchTerm(String(value))}
                        className={`w-full pl-10 pr-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                        placeholder="Search types..."
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {offerTypes
                      .filter(
                        (type) =>
                          type.name
                            .toLowerCase()
                            .includes(typeSearchTerm.toLowerCase()) ||
                          (type.description &&
                            type.description
                              .toLowerCase()
                              .includes(typeSearchTerm.toLowerCase()))
                      )
                      .map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, type: type.id.toString() });
                            setIsTypeDropdownOpen(false);
                            setTypeSearchTerm("");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <div className="font-medium">{type.name}</div>
                          {type.description && (
                            <div className="text-gray-500 text-xs">
                              {type.description}
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offer Description */}
        <Textarea
          label="Offer Description *"
          value={formData.description || ""}
          onChange={(value) =>
            setFormData({ ...formData, description: value })
          }
          placeholder="Describe your offer details and benefits"
          rows={3}
          required
        />
      </div>
    </StepFlowLayout>
  );
}
