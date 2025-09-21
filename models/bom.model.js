// Bill of Materials (BOM) Model
// This model is used to store the Bill of Materials for a finished good product
// Using this model, later we can calculate the cost of the finished good product based on the cost of the items in the BOM
import mongoose from 'mongoose';

const { Schema } = mongoose;

const ItemSchema = new Schema({
  productId: {
    type: String,
    ref: 'Product', // Reference to the Product model if needed
    required: true
  },
  qty: {
    type: Number,
    required: true
  },
  uomId: {
    type: String,
    ref: 'UOM', // Reference to the UOM model if needed
    required: false
  }
});

const ModelSchema = new Schema({
  bomId: {
    type: String,
    required: true,
    unique: true
  },
  finishedGoodId: {
    type: String,
    ref: 'Product', // Reference to the Product model if needed
    required: true
  },
  items: {
    type: [ItemSchema],
    required: false,
    validate: [itemsArrayLimit, '{PATH} exceeds the limit of 10']
  },
  createdBy: {
    type: String,
    ref: 'User', // Reference to the User model if needed
    required: true
  }
}, {
  timestamps: true // Enable timestamps for createdAt and updatedAt fields
});

// Function to limit the number of items in the BOM
function itemsArrayLimit(val) {
  return val.length <= 100;
}

ModelSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastBOM = await mongoose.model('billofmaterials').findOne().sort({ createdAt: -1 });
    const lastBOMID = lastBOM ? parseInt(lastBOM.bomId.split('-')[1]) : 0;
    this.bomId = `BomId-${lastBOMID + 1}`;
  }
  next();
});

const Model = mongoose.model('billofmaterials', ModelSchema);

export default Model;


// import mongoose from "mongoose";
// const { Schema } = mongoose;

// const ItemSchema = new Schema({
//   productId: { type: String, required: true, ref: 'Product' },
//   qty: { type: Number, required: true, min: 0 },
//   currentWAC: { type: Number, required: true, min: 0 }
// });

// const BillOfMaterialsSchema = new Schema({
//   bomId: { type: String, required: true, unique: true },
//   finishedGoodId: { type: String, required: true, ref: 'Product' },
//   items: { type: [ItemSchema], validate: [v => v.length <= 100, 'Max 100 items allowed'] },
//   createdBy: { type: String, required: true, ref: 'User' }
// }, { timestamps: true });

// BillOfMaterialsSchema.pre('save', async function (next) {
//   if (this.isNew) {
//     const lastBOM = await mongoose.model('BillOfMaterials').findOne().sort({ createdAt: -1 });
//     this.bomId = `BOMID-${lastBOM ? parseInt(lastBOM.bomId.split('-')[1]) + 1 : 1}`;
//   }
//   next();
// });

// export default mongoose.model('BillOfMaterials', BillOfMaterialsSchema);
