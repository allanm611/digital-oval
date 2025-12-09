import { ReactNode } from 'react';
import { Save, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';

import { tw } from '../../../shared/utils/utils';
interface StepFlowLayoutProps {
    currentStep: number;
    stepTitle: string;
    stepDescription: string;
    onNext: () => void;
    onPrev: () => void;
    onSaveDraft?: () => void;
    onCancel?: () => void;
    isNextDisabled?: boolean;
    nextButtonText?: string;
    customNavigation?: ReactNode;
    children: ReactNode;
    className?: string;
}

export default function StepFlowLayout({
    currentStep,
    stepTitle,
    stepDescription,
    onNext,
    onPrev,
    onSaveDraft,
    onCancel,
    isNextDisabled = false,
    nextButtonText = 'Next Step',
    customNavigation,
    children,
    className = ''
}: StepFlowLayoutProps) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSaveDraft = () => {
        if (onSaveDraft) {
            onSaveDraft();
        } else {
            showToast('success', 'Draft saved successfully!');
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={`max-w-7xl space-y-6 ${className}`}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleCancel}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200`}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200`}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={onPrev}
                        disabled={currentStep === 1}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                    </button>
                    <button
                        onClick={onNext}
                        disabled={isNextDisabled}
                        className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-all duration-200 ${isNextDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : ' text-white hover:bg-[#4a6b3a] hover:shadow-md'
                            }`}
                    >
                        {nextButtonText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>

            {customNavigation && (
                <div className="mb-6">
                    {customNavigation}
                </div>
            )}

            <div className="mt-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{stepTitle}</h2>
                <p className="text-sm text-gray-600">{stepDescription}</p>
            </div>

            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}