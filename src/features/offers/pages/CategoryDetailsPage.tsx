import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Eye,
  Package,
  CheckCircle,
  XCircle,
  Plus,
  X,
  MoreVertical,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { offerCategoryService } from "../services/offerCategoryService";
import { OfferCategoryType } from "../types/offerCategory";
import { Offer } from "../types/offer";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function CategoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [category, setCategory] = useState<OfferCategoryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerCount, setOfferCount] = useState<number>(0);
  const [activeOfferCount, setActiveOfferCount] = useState<number>(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<OfferCategoryType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [analytics, setAnalytics] = useState<{
    usageTrends: Record<string, unknown> | null;
    performanceByType: Record<string, unknown> | null;
  }>({
    usageTrends: null,
    performanceByType: null,
  });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close More menu when clicking outside
  useClickOutside(moreMenuRef, () => setShowMoreMenu(false));

  useEffect(() => {
    if (id) {
      loadCategoryDetails();
    }
  }, [id]);

  const loadCategoryDetails = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Load category details
      const categoryResponse = await offerCategoryService.getCategoryById(
        parseInt(id),
        true
      );
      if (categoryResponse.success && categoryResponse.data) {
        setCategory(categoryResponse.data);
      } else {
        setError("Category not found");
        return;
      }

      // Load offer counts
      const offerCountResponse =
        await offerCategoryService.getCategoryOfferCount(parseInt(id), true);
      if (offerCountResponse.success && offerCountResponse.data) {
        setOfferCount(offerCountResponse.data.totalOffers || 0);
      }

      const activeOfferCountResponse =
        await offerCategoryService.getCategoryActiveOfferCount(
          parseInt(id),
          true
        );
      if (activeOfferCountResponse.success && activeOfferCountResponse.data) {
        setActiveOfferCount(
          activeOfferCountResponse.data.activeOfferCount || 0
        );
      }

      // Load offers in this category
      const offersResponse = await offerCategoryService.getCategoryOffers(
        parseInt(id),
        { limit: 50, skipCache: true }
      );
      if (offersResponse.success && offersResponse.data) {
        setOffers(offersResponse.data || []);
      }

      // Load analytics data
      await loadAnalytics();
    } catch (err) {
      // Failed to load category details
      setError("Failed to load category details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAnalytics = useCallback(async () => {
    if (!id) return;

    try {
      // Load usage trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usageTrendsResponse = await offerCategoryService.getUsageTrends({
        limit: 50,
        skipCache: true,
      });

      // Load performance by type
      const performanceResponse =
        await offerCategoryService.getPerformanceByType({
          limit: 50,
          skipCache: true,
        });

      setAnalytics({
        usageTrends: usageTrendsResponse.success
          ? usageTrendsResponse.data
          : null,
        performanceByType: performanceResponse.success
          ? performanceResponse.data
          : null,
      });
    } catch (err) {
      // Failed to load analytics
      // Don't show error for analytics, just log it
    }
  }, [id]);

  const handleEditCategory = () => {
    if (!category) return;
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleCategorySaved = async (categoryData: {
    name: string;
    description?: string;
  }) => {
    if (!editingCategory) return;

    try {
      await offerCategoryService.updateCategory(
        editingCategory.id,
        categoryData
      );
      showToast("Category updated successfully");
      await loadCategoryDetails(); // Reload category details
      setIsEditModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      // Failed to update category
      showError("Failed to update category");
    }
  };

  const handleViewOffers = () => {
    setIsOffersModalOpen(true);
  };

  const handleDeleteCategory = () => {
    if (!category) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!category) return;

    setIsDeleting(true);
    try {
      const response = await offerCategoryService.deleteCategory(category.id);
      if (response.success) {
        showToast("Category deleted successfully");
        setShowDeleteModal(false);
        navigate("/dashboard/offer-catalogs");
      } else {
        showError("Failed to delete category");
      }
    } catch (err) {
      // Failed to delete category
      showError("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleToggleStatus = async () => {
    if (!category) return;

    try {
      if (category.is_active) {
        await offerCategoryService.deactivateCategory(category.id);
        showToast("Category deactivated");
      } else {
        await offerCategoryService.activateCategory(category.id);
        showToast("Category activated");
      }
      // Reload category details
      await loadCategoryDetails();
    } catch (err) {
      // Failed to toggle category status
      showError("Failed to update category status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" className="mb-4" />
        <p className={`${tw.textMuted} font-medium`}>
          Loading category details...
        </p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {error || "Category not found"}
        </h3>
        <button
          onClick={() => navigate("/dashboard/offer-catalogs")}
          className={`px-4 py-2 ${tw.rounded} font-medium transition-colors`}
          style={{
            backgroundColor: color.primary.action,
            color: color.text.inverse,
          }}
        >
          Back to Categories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={() => navigate("/dashboard/offer-catalogs")}
            className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors flex-shrink-0`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleEditCategory}
            className={`px-3 sm:px-4 py-2 ${tw.rounded} transition-colors font-medium text-sm sm:text-base whitespace-nowrap`}
            style={{
              backgroundColor: color.primary.action,
              color: color.text.inverse,
            }}
          >
            Edit
          </button>
          <button
            onClick={handleToggleStatus}
            className={`px-3 sm:px-4 py-2 ${tw.rounded} transition-colors font-medium text-sm sm:text-base whitespace-nowrap ${
              category.is_active
                ? "text-white border"
                : "text-green-700 bg-green-100 border border-green-300 hover:bg-green-200"
            }`}
            style={
              category.is_active
                ? {
                    backgroundColor: "#6B7280", // gray-500
                    borderColor: "#6B7280",
                  }
                : {}
            }
          >
            {category.is_active ? "Deactivate" : "Activate"}
          </button>
          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMoreMenu && (
              <div className={`absolute right-0 top-full mt-1 w-56 bg-white ${tw.rounded} shadow-lg border border-gray-200 py-1 z-10`}>
                <button
                  onClick={() => {
                    handleViewOffers();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Offers
                </button>
                <button
                  onClick={() => {
                    handleDeleteCategory();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Category
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`${tw.rounded} border border-gray-200 p-4`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Offers</p>
              <p className="text-2xl font-bold text-gray-900">{offerCount}</p>
            </div>
            <div className={`w-10 h-10 bg-gray-100 ${tw.rounded} flex items-center justify-center`}>
              <Package className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 p-4`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Offers</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeOfferCount}
              </p>
            </div>
            <div className={`w-10 h-10 bg-gray-100 ${tw.rounded} flex items-center justify-center`}>
              <CheckCircle className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 p-4`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Inactive Offers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {offerCount - activeOfferCount}
              </p>
            </div>
            <div className={`w-10 h-10 bg-gray-100 ${tw.rounded} flex items-center justify-center`}>
              <XCircle className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 p-4`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-bold text-gray-900">
                {category.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            <div className={`w-10 h-10 bg-gray-100 ${tw.rounded} flex items-center justify-center`}>
              {category.is_active ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <div
          className={`${tw.rounded} border border-gray-200 p-6`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Usage Trends (Last 12 months)
          </h3>
          {analytics.usageTrends && analytics.usageTrends.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                Monthly breakdown of offers created
              </div>
              {analytics.usageTrends
                .slice(0, 6)
                .map((trend: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">
                      <DateFormatter
                        date={new Date(trend.year, trend.month - 1)}
                        useLocale
                        month="short"
                        year="numeric"
                      />
                    </span>
                    <span className="font-medium text-gray-900">
                      {trend.offers_created} offers
                    </span>
                  </div>
                ))}
              {analytics.usageTrends.length > 6 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{analytics.usageTrends.length - 6} more months
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No usage trends available</p>
            </div>
          )}
        </div>

        {/* Performance by Type */}
        <div
          className={`${tw.rounded} border border-gray-200 p-6`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance by Type
          </h3>
          {analytics.performanceByType &&
          analytics.performanceByType.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                Performance metrics by offer type
              </div>
              {analytics.performanceByType.map((item: any, index: number) => (
                <div
                  key={index}
                  className={`space-y-2 p-3 bg-gray-50 ${tw.rounded}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.offer_type.replace("_", " ")}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.offer_count} offers
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Avg Discount:{" "}
                      {item.avg_discount_percentage > 0 ? (
                        `${item.avg_discount_percentage}%`
                      ) : (
                        <CurrencyFormatter
                          amount={item.avg_discount_amount}
                          className="inline"
                        />
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No performance data available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Offers List */}
      <div
        className={`${tw.rounded} border border-gray-200 p-6`}
        style={{ backgroundColor: color.surface.cards }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Offers in Category
          </h2>
          <button
            onClick={handleViewOffers}
            className={`flex items-center px-4 py-2 ${tw.rounded} font-medium transition-colors`}
            style={{
              backgroundColor: color.primary.action,
              color: color.text.inverse,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Offers
          </button>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No offers in this category
            </h3>
            <p className="text-gray-500 mb-6">
              Add offers to this category to get started
            </p>
            <button
              onClick={handleViewOffers}
              className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded} transition-all`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Offer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer, index) => (
              <div
                key={offer.id || index}
                className={`flex items-center justify-between p-4 border border-gray-200 ${tw.rounded} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {offer.name || "Unnamed Offer"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {offer.description || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      offer.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {offer.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => {
                      // TODO: Navigate to offer details
                      showToast("Offer details coming soon");
                    }}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Category Modal */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsEditModalOpen(false)}
            ></div>
            <div className={`relative bg-white ${tw.rounded} shadow-xl max-w-md w-full p-6`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Category
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCategorySaved(formData)}
                  className={`px-4 py-2 text-white ${tw.rounded} transition-colors`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {isOffersModalOpen && category && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsOffersModalOpen(false)}
            ></div>
            <div className={`relative bg-white ${tw.rounded} shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden`}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Offers in "{category.name}"
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {offers.length} offer{offers.length !== 1 ? "s" : ""}{" "}
                      found
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOffersModalOpen(false)}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {offers.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No offers in this category
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This category doesn't have any offers assigned yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsOffersModalOpen(false);
                        // TODO: Open assign offers modal
                        showToast("Assign offers functionality coming soon");
                      }}
                      className={`px-4 py-2 text-white ${tw.rounded} transition-colors`}
                      style={{ backgroundColor: color.primary.action }}
                    >
                      Assign Offers
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer, index) => (
                      <div
                        key={offer.id || index}
                        className={`flex items-center justify-between p-4 border border-gray-200 ${tw.rounded} hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {offer.name || "Unnamed Offer"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {offer.description || "No description"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              offer.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {offer.is_active ? "Active" : "Inactive"}
                          </span>
                          <button
                            onClick={() => {
                              // TODO: Navigate to offer details
                              showToast("Offer details coming soon");
                            }}
                            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        itemName={category?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Category"
        cancelText="Cancel"
      />
    </div>
  );
}
