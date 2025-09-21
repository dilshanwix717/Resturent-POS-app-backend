import mongoose from 'mongoose';
const { Schema } = mongoose;

// Bill of Materials (BOM) Model
const ItemSchema = new Schema({
  productId: { type: String, ref: 'Product', required: true }, // Product reference
  qty: { type: Number, required: true }, // Quantity
  uomId: { type: String, ref: 'UOM', required: false } // Unit of Measurement
});
const ModelSchema = new Schema({
  bomId: { type: String, required: true, unique: true }, // BOM ID
  finishedGoodId: { type: String, ref: 'Product', required: true }, // Finished good
  items: { type: [ItemSchema], required: false, validate: [val => val.length <= 100, '{PATH} exceeds the limit of 100'] },
  createdBy: { type: String, ref: 'User', required: true } // Created by user
}, { timestamps: true });
ModelSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastBOM = await mongoose.model('billofmaterials').findOne().sort({ createdAt: -1 });
    this.bomId = `BomId-${(lastBOM ? parseInt(lastBOM.bomId.split('-')[1]) : 0) + 1}`;
  }
  next();
});
export default mongoose.model('billofmaterials', ModelSchema);