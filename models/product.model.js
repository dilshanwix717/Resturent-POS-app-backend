
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Product Model
const ProductSchema = new Schema({
  productId: { type: String, required: false }, // Product ID
  pluCode: { type: String, required: true, unique: true }, // Barcode
  companyId: { type: String, required: true }, // Company ID
  name: { type: String, required: true }, // Product Name
  productType: { type: String, required: true }, // Product Type
  uomId: { type: String, required: false }, // Unit of Material
  size: { type: String, required: false }, // Size
  activeShopIds: { type: Array, required: true }, // Active shops
  toggle: { type: String, required: true }, // Enable/Disable
  createdBy: { type: String, required: true }, // Created by user
  categoryId: { type: String, required: true }, // Category ID
  minQty: { type: Number, required: true }, // Minimum quantity
  deviceLocation: { type: String, required: false }, // Printer location
  bomId: { type: String, required: false }, // BOM ID

  // New fields
  requiresGRN: { type: Boolean, default: false }, // Whether product needs GRN tracking
  hasRawMaterials: { type: Boolean, default: false }, // Whether product has associated raw materials
}, { timestamps: true });

ProductSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastProduct = await mongoose.model('Product').findOne().sort({ createdAt: -1 });
    this.productId = `ProductID-${(lastProduct ? parseInt(lastProduct.productId.split('-')[1]) : 0) + 1}`;
  }
  next();
});

export default mongoose.model('Product', ProductSchema);
