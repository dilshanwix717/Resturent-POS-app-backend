// Raw Material Transaction Header Model (RMTH)
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Raw Material Transaction Header Model (RMTH)
const RMTHSchema = new Schema({
    rmthId: { type: String, required: true, unique: true }, // RMTH ID
    transactionCode: { type: String, required: true }, // Transaction Code
    companyId: { type: String, required: true }, // Company ID
    shopId: { type: String, required: true }, // Shop ID
    supplierId: { type: String, required: true }, // Supplier ID
    transactionDateTime: { type: Date, required: true }, // Transaction DateTime
    transactionType: { type: String, required: true }, // Transaction Type
    rawMatInOut: { type: String, required: true }, // Material In/Out
    transactionStatus: { type: String, required: false, enum: ['Pending', 'Cancelled', 'Completed'] }, // Status
    totalCost: { type: Number, required: true }, // Total Cost
    outStandingAmount: { type: Number, required: true }, // Outstanding Amount
    createdBy: { type: String, required: true } // Created by user
}, { timestamps: true });

RMTHSchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastRMTH = await mongoose.model('raw_material_transaction_header').findOne().sort({ createdAt: -1 });
        const lastRMTHID = lastRMTH ? parseInt(lastRMTH.rmthId.split('-')[1]) : 0;
        this.rmthId = `RMTHID-${lastRMTHID + 1}`;
    }
    next();
});
export default mongoose.model("raw_material_transaction_header", RMTHSchema);
