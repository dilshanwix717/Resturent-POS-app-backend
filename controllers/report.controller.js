import DailyBalance from "../models/daily.balance.model.js";
import billofmaterials from '../models/bom.model.js';
import finishedgood_transaction from "../models/finishedgood_transaction.model.js";
import Inventory_Stock from '../models/inventory.stock.model.js';
import Product from '../models/product.model.js';
import { createLog } from "../utils/logger.util.js";
import RawMaterialTransaction from '../models/raw_material_transaction.model.js';


export const getInventoryMovementReport = async (req, res, next) => {
    try {
        const { companyId, shopId } = req;
        const now = new Date(); // Today's date (end date)

        // Get past date from user input
        let pastDate;
        if (req.query.pastDate) {
            pastDate = new Date(req.query.pastDate);
        } else {
            // Default: 7 days ago if no date is provided
            pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 7);
        }

        // Validate the past date
        if (isNaN(pastDate.getTime()) || pastDate > now) {
            return res.status(400).json({ message: "Invalid pastDate provided. It must be a valid date in the past." });
        }

        // 1. Get all products to have product details
        const products = await Product.find({ companyId }).lean();
        const productMap = {};
        products.forEach((product) => {
            productMap[product.productId] = product;
        });

        // 2. Get all inventory items
        const inventoryItems = await Inventory_Stock.find({ companyId, shopId }).lean();
        if (!inventoryItems.length) {
            return res.status(404).json({ message: "No inventory items found." });
        }

        // Process each inventory item one by one
        const reportData = [];

        for (const item of inventoryItems) {
            const productId = item.productId;
            const product = productMap[productId];

            if (!product) {
                console.log(`Product not found for inventory item with productId: ${productId}`);
                continue;
            }

            const currentQty = item.totalQuantity;
            const productType = product.productType;
            const isRawMaterial = productType.toLowerCase().includes('raw');
            const isFinishedGood = !isRawMaterial;

            // Initialize purchases and sales counters
            let purchases = 0;
            let sales = 0;

            // 1. Find raw material transactions (purchases) for this item
            const rawMaterialTransactions = await RawMaterialTransaction.find({
                companyId,
                shopId,
                productId,
                transactionDateTime: {
                    $gte: pastDate,
                    $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Adds 1 day to `now`
                },
                transactionStatus: { $ne: "Cancelled" }
            }).lean();

            // Process purchases
            for (const tx of rawMaterialTransactions) {
                if (tx.transactionType === "GRN" && tx.rawMatInOut === "In") {
                    purchases += tx.quantity;
                    console.log(`Purchase transaction found for ${productId} (${product.name}): ${tx.quantity} units`);
                }
            }

            // 2. Find finished good transactions (sales) where this item is directly sold
            if (isFinishedGood || product.requiresGRN) {
                const finishedGoodTransactions = await finishedgood_transaction.find({
                    companyId,
                    shopId,
                    finishedgoodId: productId,
                    transactionDateTime: { $gte: pastDate, $lte: now },
                    transactionStatus: { $ne: "Cancelled" }
                }).lean();

                // Process direct sales
                for (const tx of finishedGoodTransactions) {
                    if (tx.transactionType === "Sales" && tx.transactionInOut === "Out") {
                        sales += tx.finishedgoodQty;
                        console.log(`Direct sale transaction found for ${productId} (${product.name}): ${tx.finishedgoodQty} units`);
                    }
                }
            }

            // 3. Find finished good transactions where this item is used as a raw material
            if (isRawMaterial) {
                // Get all finished good transactions that have used this product in usedProductDetails
                const finishedGoodTransactions = await finishedgood_transaction.find({
                    companyId,
                    shopId,
                    "usedProductDetails.productId": productId, // Only get transactions that used this product
                    transactionDateTime: { $gte: pastDate, $lte: now },
                    transactionStatus: { $ne: "Cancelled" },
                    transactionType: "Sales",
                    transactionInOut: "Out"
                }).lean();

                // Process each finished good transaction to find usage of this raw material
                for (const tx of finishedGoodTransactions) {
                    if (tx.usedProductDetails && Array.isArray(tx.usedProductDetails)) {
                        // Find usage of this product in the usedProductDetails array
                        const usedProduct = tx.usedProductDetails.find(up => up.productId === productId);
                        if (usedProduct) {
                            sales += usedProduct.quantity;
                            console.log(`Raw material usage found in usedProductDetails for ${productId} (${product.name}): ${usedProduct.quantity} units`);
                        }
                    }
                }
            }

            // Calculate opening inventory (current quantity minus purchases plus sales)
            const openingInventory = currentQty - purchases + sales;

            reportData.push({
                productId,
                productName: product.name,
                productType,
                pluCode: product.pluCode,
                categoryId: product.categoryId,
                openingInventory,
                currentInventory: currentQty,
                purchasesDuringPeriod: purchases,
                salesDuringPeriod: sales,
                needsRestock: currentQty < (item.minimumQuantity || product.minQty || 0)
            });

            console.log(`Processed ${productId} (${product.name}): opening=${openingInventory}, current=${currentQty}, purchases=${purchases}, sales=${sales}`);
        }

        // Sort the report alphabetically by product name
        // reportData.sort((a, b) => a.productName.localeCompare(b.productName));
        // Sort the report by most sold items first
        reportData.sort((a, b) => b.salesDuringPeriod - a.salesDuringPeriod);


        // Log the successful report generation
        createLog(
            companyId,
            shopId,
            req.userId,
            `Inventory movement report generated from ${pastDate.toISOString()} to ${now.toISOString()}`
        );

        res.status(200).json({
            message: "Inventory movement report generated successfully",
            fromDate: pastDate,
            toDate: now,
            reportData
        });
    } catch (error) {
        console.error("Error generating inventory movement report:", error);
        next(error);
    }
};






export const salesAndProfit = async (req, res, next) => {
    try {
        const transactions = await finishedgood_transaction.find();

        const results = await Promise.all(
            transactions.map(async (transaction) => {
                const finishedgoodId = transaction.finishedgoodId;
                const quantity = transaction.quantity;
                const sellingPrice = transaction.sellingPrice;
                const discountAmount = transaction.discountAmount;

                // Get the product to check if it has raw materials
                const product = await Product.findOne({ productId: finishedgoodId });

                if (!product) {
                    throw new Error(`Product not found with ID ${finishedgoodId}`);
                }

                let cost = 0;

                // Calculate cost based on whether the product has raw materials
                if (product.hasRawMaterials) {
                    // Get the bill of materials for the finished good
                    const bom = await billofmaterials.findOne({ finishedgoodId });
                    if (!bom) {
                        // Log warning but continue with cost as 0
                        console.warn(`Bill of materials not found for finished good ${finishedgoodId} although hasRawMaterials is true`);
                    } else {
                        // Calculate the cost of the finished good using raw materials
                        cost = await calculateCost(bom, quantity);
                    }
                } else {
                    // For products without raw materials, try to get cost from inventory stock if available
                    const inventory = await Inventory_Stock.findOne({ productId: finishedgoodId });
                    if (inventory && inventory.weightedAverageCost) {
                        cost = inventory.weightedAverageCost * quantity;
                    }
                    // If no inventory cost found, cost remains 0
                }

                // Calculate the total price after discount and quantity
                const totalPrice = (sellingPrice - discountAmount) * quantity;

                // Calculate the profit
                const profit = totalPrice - cost;

                // Create the sales and profit object
                const salesAndProfit = {
                    companyId: transaction.companyId,
                    shopId: transaction.shopId,
                    finishedgoodId,
                    sellingType: transaction.sellingType,
                    OrderNo: transaction.OrderNo,
                    customerId: transaction.customerId,
                    quantity,
                    discountAmount,
                    sellingPrice,
                    totalPrice,
                    cost,
                    profit,
                    transactionDateTime: transaction.transactionDateTime,
                    transactionCode: transaction.transactionCode,
                    hasRawMaterials: product.hasRawMaterials,
                };

                return salesAndProfit;
            })
        );

        res.status(200).json(results);
    } catch (error) {
        console.error(error);
        next(error);
    }
};


async function calculateCost(bom, quantity) {
    let cost = 0;
    for (const item of bom.items) {
        const productId = item.productId;
        const qty = item.qty * quantity;
        const inventory = await Inventory_Stock.findOne({ productId });
        if (!inventory) {
            throw new Error(`Inventory not found for product ${productId}`);
        }
        const productCost = inventory.weightedAverageCost * qty;
        cost += productCost;
    }
    return cost;
}
