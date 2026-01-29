import { lazy, Suspense } from "react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { DataConnectorType } from "../types";
import { getConnectionProfileTypesForDataConnector } from "../constants/dataConnectorTypes";

const ConnectionProfileFormPage = lazy(
  () => import("../../connection-profiles/pages/ConnectionProfileFormPage")
);

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectorType: DataConnectorType;
  onSuccess: () => void;
}

export default function AddConnectionModal({
  isOpen,
  onClose,
  connectorType,
  onSuccess,
}: AddConnectionModalProps) {
  const availableConnectionTypes =
    getConnectionProfileTypesForDataConnector(connectorType);
  const defaultConnectionType =
    availableConnectionTypes.length > 0 ? availableConnectionTypes[0] : "database";

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Connection Profile"
      size="2xl"
      closeOnOverlayClick={false}
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <ConnectionProfileFormPage
          mode="create"
          defaultConnectionType={defaultConnectionType}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </Suspense>
    </RegularModal>
  );
}
