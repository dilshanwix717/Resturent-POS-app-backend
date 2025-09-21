// Raw Material Transaction Model (RMT)
import mongoose from 'mongoose';
const { Schema } = mongoose;

const RMTSchema = new Schema({
    //Raw Material Transaction ID
    rmtId: {
        type: String,
        required: true,
        unique: true,
    },
    //Company ID
    companyId: {
        type: String,
        required: true,
    },
    //Shop ID which shop these GRN belongs to
    shopId: {
        type: String,
        required: true,
    },
    // Supplier ID
    supplierId: {
        type: String,
        required: true,
    },
    // Category ID
    categoryId: {
        type: String,
        required: true,
    },
    // Product ID
    productId: {
        type: String,
        required: true,
    },
    // Finished Good ID (Same product ID as above)
    finishedGoodId: {
        type: String,
        required: false,
    },
    // Date and Time of the transaction added
    transactionDateTime: {
        type: Date,
        required: true,
    },
    // Transaction Type (GRN, GIN, Wastage, Invoice, etc.)
    transactionType: {
        type: String,
        required: true,
    },
    // Transaction Code (GRN-1, GIN-1, INVOICE-1, etc.)
    transactionCode: {
        type: String,
        required: true,
    },
    // Raw Material In/Out (In/Out) Insertion or Removal of Raw Material
    rawMatInOut: {
        type: String,
        required: true,
    },
    // Raw Material Unit Cost (Price of the Raw Material per unit Ex: 1kg = Rs.100.00)
    unitCost: {
        type: Number,
        required: true,
    },
    // Quantity of Raw Material (Total Quantity of Raw Material added or removed Ex: 10kg, 20kg, etc.)
    quantity: {
        type: Number,
        required: true,
    },
    // Total Cost of Raw Material (Total Cost of Raw Material added or removed Ex: Rs.1000.00, Rs.2000.00, etc.)
    // By Calculating the unitCost*quantity
    totalCost: {
        type: Number,
        required: true,
    },
    // Remarks (Additional Information about the transaction)
    remarks: {
        type: String,
        required: false,
    },
    // Created By (User ID who created the transaction) This will be the logged in user ID
    createdBy: {
        type: String,
        required: true,
    },
    // Transaction Status (Pending, Approved, Rejected, etc.)
    transactionStatus: {
        type: String,
        required: true,
    },


}, {
    timestamps: true
});

RMTSchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastRMT = await mongoose.model('raw_material_transaction').findOne().sort({ createdAt: -1 });
        const lastRMTID = lastRMT ? parseInt(lastRMT.rmtId.split('-')[1]) : 0;
        this.rmtId = `RMTID-${lastRMTID + 1}`;
    }
    next();
});

export default mongoose.model("raw_material_transaction", RMTSchema);
