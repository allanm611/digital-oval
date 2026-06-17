import { color, tw } from "../../../shared/utils/utils";
import { Product } from "../types/product";
import { ProductCategory } from "../types/productCategory";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";

interface ProductDetailsExpandedRowProps {
  product: Product;
  categories: ProductCategory[];
  colSpan: number;
}

export default function ProductDetailsExpandedRow({
  product,
  categories,
  colSpan,
}: ProductDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  const category = categories.find(cat => cat.id === parseInt(product.category_id || "0"));

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {product.description && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Description
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(product.description)}
            </div>
          </div>
        )}

        {product.category_id && category && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Category
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {category.name || "Uncategorized"}
            </div>
          </div>
        )}

        {product.price && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Price
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <CurrencyFormatter amount={Number(product.price)} />
            </div>
          </div>
        )}

        {product.sku && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              SKU
            </label>
            <div className={`text-sm ${tw.textPrimary} font-mono`}>
              {formatValue(product.sku)}
            </div>
          </div>
        )}

        {product.unit && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Unit
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(product.unit)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Status
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {product.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        {product.created_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(product.created_at)} useUserTimezone />
            </div>
          </div>
        )}

        {product.updated_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Last Updated
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(product.updated_at)} useUserTimezone />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
