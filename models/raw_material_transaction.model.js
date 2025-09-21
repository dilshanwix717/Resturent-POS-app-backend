// Raw Material Transaction Model (RMT)
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Raw Material Transaction Model (RMT)
const RMTSchema = new Schema({
    rmtId: { type: String, required: true, unique: true }, // RMT ID
    companyId: { type: String, required: true }, // Company ID
    shopId: { type: String, required: true }, // Shop ID
    supplierId: { type: String, required: true }, // Supplier ID
    categoryId: { type: String, required: true }, // Category ID
    productId: { type: String, required: true }, // Product ID
    transactionDateTime: { type: Date, required: true }, // Transaction DateTime
    transactionType: { type: String, required: true }, // Transaction Type
    transactionCode: { type: String, required: true }, // Transaction Code
    rawMatInOut: { type: String, required: true }, // Material In/Out
    unitCost: { type: Number, required: true }, // Unit Cost
    quantity: { type: Number, required: true }, // Quantity
    totalCost: { type: Number, required: true }, // Total Cost
    createdBy: { type: String, required: true }, // Created by user
    transactionStatus: { type: String, required: true } // Status
}, { timestamps: true });



RMTSchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastRMT = await mongoose.model('raw_material_transaction').findOne().sort({ createdAt: -1 });
        const lastRMTID = lastRMT ? parseInt(lastRMT.rmtId.split('-')[1]) : 0;
        this.rmtId = `RMTID-${lastRMTID + 1}`;
    }
    next();
});

export default mongoose.model("raw_material_transaction", RMTSchema);
