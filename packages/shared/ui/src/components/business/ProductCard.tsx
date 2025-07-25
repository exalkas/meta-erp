"use client";

import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Package,
  DollarSign,
  ShoppingCart,
  Star,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Truck,
  Anchor,
  Ship,
  Gauge,
  Calendar,
  Tag,
  BarChart3,
  Image,
  Heart,
  Share,
} from "lucide-react";

export interface ProductData {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode?: string;
  images?: string[];
  pricing: {
    basePrice: number;
    salePrice?: number;
    cost?: number;
    currency: string;
    vatRate: number; // Greek VAT rate (6%, 13%, 24%)
    vatIncluded: boolean;
  };
  inventory: {
    quantity: number;
    minStock: number;
    maxStock?: number;
    reserved?: number;
    available: number;
    unit: string;
    location?: string;
  };
  maritime?: {
    vesselType?:
      | "cargo"
      | "passenger"
      | "tanker"
      | "container"
      | "yacht"
      | "fishing";
    compatibility?: string[];
    certifications?: string[];
    hazardous?: boolean;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  status: "active" | "inactive" | "discontinued" | "out_of_stock";
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  onSale?: boolean;
  createdDate: Date;
  lastModified: Date;
  supplier?: {
    id: string;
    name: string;
  };
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface ProductCardProps {
  product: ProductData;
  variant?: "grid" | "list" | "compact" | "detailed";
  showActions?: boolean;
  showInventory?: boolean;
  showMaritime?: boolean;
  className?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToCart?: (quantity: number) => void;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  isFavorite?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = "grid",
  showActions = true,
  showInventory = true,
  showMaritime = false,
  className = "",
  onClick,
  onEdit,
  onDelete,
  onAddToCart,
  onToggleFavorite,
  onShare,
  isFavorite = false,
}) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "discontinued":
        return "bg-red-100 text-red-800";
      case "out_of_stock":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockStatus = () => {
    const { quantity, minStock, available } = product.inventory;

    if (available <= 0)
      return { status: "out", color: "text-red-600", icon: AlertTriangle };
    if (quantity <= minStock)
      return { status: "low", color: "text-yellow-600", icon: AlertTriangle };
    return { status: "good", color: "text-green-600", icon: CheckCircle };
  };

  const getVATAmount = () => {
    const { basePrice, vatRate, vatIncluded } = product.pricing;
    if (vatIncluded) {
      return (basePrice * vatRate) / (100 + vatRate);
    }
    return (basePrice * vatRate) / 100;
  };

  const getFinalPrice = () => {
    const { basePrice, salePrice, vatRate, vatIncluded } = product.pricing;
    const price = salePrice || basePrice;

    if (vatIncluded) return price;
    return price + (price * vatRate) / 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: product.pricing.currency,
    }).format(amount);
  };

  const getMaritimeIcon = () => {
    if (!product.maritime?.vesselType) return <Ship className="w-4 h-4" />;

    switch (product.maritime.vesselType) {
      case "cargo":
        return <Truck className="w-4 h-4" />;
      case "passenger":
        return <Ship className="w-4 h-4" />;
      case "tanker":
        return <Gauge className="w-4 h-4" />;
      case "container":
        return <Package className="w-4 h-4" />;
      case "yacht":
        return <Anchor className="w-4 h-4" />;
      case "fishing":
        return <Ship className="w-4 h-4" />;
      default:
        return <Ship className="w-4 h-4" />;
    }
  };

  const stockStatus = getStockStatus();
  const isGrid = variant === "grid";
  const isList = variant === "list";
  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 group
        ${onClick ? "cursor-pointer" : ""}
        ${isList ? "flex" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Image Section */}
      <div
        className={`relative ${
          isList ? "w-32 h-32 flex-shrink-0" : "aspect-square"
        } bg-gray-100 rounded-t-lg overflow-hidden`}
      >
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {product.images.length > 1 && !isCompact && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.featured && (
            <span className="bg-blue-500 text-white px-2 py-1 text-xs font-medium rounded">
              {t("productCard.featured")}
            </span>
          )}

          {product.onSale && (
            <span className="bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
              {t("productCard.sale")}
            </span>
          )}

          {product.maritime?.hazardous && (
            <span className="bg-orange-500 text-white px-2 py-1 text-xs font-medium rounded">
              {t("productCard.hazardous")}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? "bg-red-500 text-white"
                    : "bg-white/80 text-gray-600 hover:bg-white"
                }`}
              >
                <Heart className="w-4 h-4" />
              </button>
            )}

            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className="p-2 bg-white/80 text-gray-600 rounded-full hover:bg-white transition-colors"
              >
                <Share className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={`p-4 ${isList ? "flex-1" : ""}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-gray-900 truncate ${
                isCompact ? "text-sm" : "text-base"
              }`}
            >
              {product.name}
            </h3>

            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">{product.sku}</span>
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  product.status
                )}`}
              >
                {t(`productCard.status.${product.status}`)}
              </span>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle view details
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Eye className="w-4 h-4" />
              </button>

              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}

              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {product.description && !isCompact && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Category */}
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-500">
          <Tag className="w-4 h-4" />
          <span>{product.category}</span>
          {product.subcategory && (
            <>
              <span>•</span>
              <span>{product.subcategory}</span>
            </>
          )}
        </div>

        {/* Maritime Info */}
        {showMaritime && product.maritime && !isCompact && (
          <div className="mb-3 p-2 bg-blue-50 rounded">
            <div className="flex items-center space-x-2 text-sm">
              {getMaritimeIcon()}
              <span className="font-medium text-blue-900">
                {t(`productCard.maritime.${product.maritime.vesselType}`)}
              </span>
            </div>

            {product.maritime.certifications &&
              product.maritime.certifications.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.maritime.certifications
                    .slice(0, 2)
                    .map((cert, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {cert}
                      </span>
                    ))}
                </div>
              )}
          </div>
        )}

        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(getFinalPrice())}
            </span>

            {product.pricing.salePrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.pricing.basePrice)}
              </span>
            )}

            <span className="text-xs text-gray-500">
              {product.pricing.vatIncluded
                ? t("productCard.vatIncluded")
                : t("productCard.vatExcluded")}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            {t("productCard.vat")} {product.pricing.vatRate}%:{" "}
            {formatCurrency(getVATAmount())}
          </div>
        </div>

        {/* Inventory */}
        {showInventory && !isCompact && (
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <stockStatus.icon className={`w-4 h-4 ${stockStatus.color}`} />
                <span className="text-sm font-medium">
                  {product.inventory.available} {product.inventory.unit}{" "}
                  {t("productCard.available")}
                </span>
              </div>

              <span className={`text-xs ${stockStatus.color}`}>
                {t(`productCard.stock.${stockStatus.status}`)}
              </span>
            </div>

            {product.inventory.location && (
              <div className="text-xs text-gray-500 mt-1">
                {t("productCard.location")}: {product.inventory.location}
              </div>
            )}
          </div>
        )}

        {/* Rating */}
        {product.rating && product.reviewCount && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating!)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {product.rating.toFixed(1)} ({product.reviewCount}{" "}
              {t("productCard.reviews")})
            </span>
          </div>
        )}

        {/* Add to Cart */}
        {onAddToCart &&
          product.status === "active" &&
          product.inventory.available > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(Math.max(1, quantity - 1));
                  }}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.inventory.available}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 px-2 py-1 text-center border-0 focus:ring-0"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(
                      Math.min(product.inventory.available, quantity + 1)
                    );
                  }}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(quantity);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t("productCard.addToCart")}
              </button>
            </div>
          )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && !isCompact && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
