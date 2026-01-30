import { useState } from "react";
import KPIPickerModal from "../components/KPIPickerModal";
import { DummyKPI } from "../types/dummyData";

export default function KPIModalDemoPage() {
  const [modalCategory, setModalCategory] = useState<
    null | DummyKPI["category"]
  >(null);
  const [selectedKPI, setSelectedKPI] = useState<DummyKPI | null>(null);

  const openModal = (category: DummyKPI["category"]) =>
    setModalCategory(category);
  const closeModal = () => setModalCategory(null);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">KPI Picker Modal Demo</h1>
      <div className="space-x-4 mb-8">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => openModal("Customer Device Info")}
        >
          Select Customer Device Info KPI
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => openModal("Usage Metric")}
        >
          Select Usage Metric KPI
        </button>
        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded"
          onClick={() => openModal("Revenue Metric")}
        >
          Select Revenue Metric KPI
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded"
          onClick={() => openModal("Customer Profile Info")}
        >
          Select Customer Profile Info KPI
        </button>
      </div>
      {selectedKPI && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Selected KPI:</h2>
          <div>
            <b>Name:</b> {selectedKPI.name}
          </div>
          <div>
            <b>Description:</b> {selectedKPI.description}
          </div>
          <div>
            <b>Example Value:</b> {String(selectedKPI.exampleValue)}
          </div>
        </div>
      )}
      {/* Render the modal for the selected category */}
      {modalCategory && (
        <KPIPickerModal
          isOpen={!!modalCategory}
          onClose={closeModal}
          onSelect={setSelectedKPI}
          category={modalCategory}
          title={`Select ${modalCategory} KPI`}
        />
      )}
    </div>
  );
}
