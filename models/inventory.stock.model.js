// Used for creating the schema for the stock of the products in the inventory
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Inventory Model
const InventorySchema = new Schema({
    inventoryId: { type: String, required: true, unique: true }, // Inventory ID
    categoryId: { type: String, required: true }, // Category ID
    productId: { type: String, required: true }, // Product ID
    companyId: { type: String, required: true }, // Company ID
    shopId: { type: String, required: true }, // Shop ID
    supplierId: { type: Array, required: false }, // Supplier ID
    lastPurchaseCost: { type: String, required: true }, // Last Purchase Cost
    totalQuantity: { type: Number, required: true }, // Total Quantity
    weightedAverageCost: { type: String, required: false }, // WAC
    minimumQuantity: { type: Number, ref: 'Product', required: true }, // Minimum quantity alert
    toggle: { type: String, required: true }, // Enable/Disable
    createdBy: { type: String, required: true } // Created by user
}, { timestamps: true });
InventorySchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastInventory = await mongoose.model('Inventory_Stock').findOne().sort({ createdAt: -1 });
        this.inventoryId = `InventoryID-${(lastInventory ? parseInt(lastInventory.inventoryId.split('-')[1]) : 0) + 1}`;
    }
    next();
});
export default mongoose.model('Inventory_Stock', InventorySchema);