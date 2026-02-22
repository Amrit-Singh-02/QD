import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ProductModel from "./src/models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

if (!process.env.MONGODB_URL) {
  throw new Error(
    "MONGODB_URL is missing. Ensure Backend/.env exists or set the variable before running the seed script.",
  );
}

const products = [

/* ================= FRESH VEGETABLES ================= */
{
name: "Fresh Tomatoes 1kg",
description: "Farm fresh red tomatoes",
brand: "Farm Fresh",
price: 40,
discount: 5,
stocks: 120,
images: [{
  url: "https://placehold.co/400x400?text=Tomatoes",
  asset_id: "asset_tomato_1",
  public_id: "public_tomato_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Potatoes 1kg",
description: "Premium quality potatoes",
brand: "Farm Fresh",
price: 30,
discount: 3,
stocks: 150,
images: [{
  url: "https://placehold.co/400x400?text=Potatoes",
  asset_id: "asset_potato_1",
  public_id: "public_potato_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},

/* ================= PERSONAL CARE ================= */
{
name: "Dove Soap 100g",
description: "Moisturizing bathing bar",
brand: "Dove",
price: 45,
discount: 5,
stocks: 100,
images: [{
  url: "https://placehold.co/400x400?text=Soap",
  asset_id: "asset_soap_1",
  public_id: "public_soap_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f772")],
subCategory: []
},
{
name: "Colgate Toothpaste 200g",
description: "Strong teeth protection",
brand: "Colgate",
price: 110,
discount: 10,
stocks: 90,
images: [{
  url: "https://placehold.co/400x400?text=Toothpaste",
  asset_id: "asset_toothpaste_1",
  public_id: "public_toothpaste_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f772")],
subCategory: []
},

/* ================= BAKERY & BREAD ================= */
{
name: "Britannia White Bread",
description: "Fresh soft bread loaf",
brand: "Britannia",
price: 45,
discount: 5,
stocks: 120,
images: [{
  url: "https://placehold.co/400x400?text=Bread",
  asset_id: "asset_bread_1",
  public_id: "public_bread_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76f")],
subCategory: []
},
{
name: "Chocolate Muffins Pack",
description: "Soft chocolate muffins",
brand: "Britannia",
price: 35,
discount: 3,
stocks: 80,
images: [{
  url: "https://placehold.co/400x400?text=Muffin",
  asset_id: "asset_muffin_1",
  public_id: "public_muffin_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76f")],
subCategory: []
},

/* ================= SNACKS & MUNCHIES ================= */
{
name: "Lay's Classic Chips",
description: "Salted potato chips",
brand: "Lay's",
price: 20,
discount: 2,
stocks: 200,
images: [{
  url: "https://placehold.co/400x400?text=Chips",
  asset_id: "asset_chips_1",
  public_id: "public_chips_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},
{
name: "Haldiram Bhujia",
description: "Spicy bhujia pack",
brand: "Haldiram",
price: 60,
discount: 5,
stocks: 120,
images: [{
  url: "https://placehold.co/400x400?text=Bhujia",
  asset_id: "asset_bhujia_1",
  public_id: "public_bhujia_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},

/* ================= BEVERAGES ================= */
{
name: "Coca Cola 750ml",
description: "Chilled soft drink",
brand: "Coca Cola",
price: 40,
discount: 5,
stocks: 150,
images: [{
  url: "https://placehold.co/400x400?text=Coke",
  asset_id: "asset_coke_1",
  public_id: "public_coke_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f769")],
subCategory: []
},
{
name: "Real Mango Juice",
description: "Fruit mango juice 1L",
brand: "Real",
price: 110,
discount: 10,
stocks: 90,
images: [{
  url: "https://placehold.co/400x400?text=Juice",
  asset_id: "asset_juice_1",
  public_id: "public_juice_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f769")],
subCategory: []
},

/* ================= DAIRY & MILK ================= */
{
name: "Amul Butter 500g",
description: "Salted butter pack",
brand: "Amul",
price: 275,
discount: 20,
stocks: 80,
images: [{
  url: "https://placehold.co/400x400?text=Butter",
  asset_id: "asset_butter_1",
  public_id: "public_butter_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f766")],
subCategory: []
},

/* ================= MILK ================= */
{
name: "Amul Taaza Milk 1L",
description: "Toned milk 1 litre",
brand: "Amul",
price: 75,
discount: 10,
stocks: 110,
images: [{
  url: "https://placehold.co/400x400?text=Milk",
  asset_id: "asset_milk_1",
  public_id: "public_milk_1"
}],
category: [new mongoose.Types.ObjectId("69819ba4cc726905f0740db7")],
subCategory: []
},

/* ================= MORE FRESH VEGETABLES ================= */
{
name: "Fresh Onions 1kg",
description: "Crisp red onions for daily cooking",
brand: "Farm Fresh",
price: 32,
discount: 2,
stocks: 140,
images: [{
  url: "https://placehold.co/400x400?text=Onions",
  asset_id: "asset_onion_1",
  public_id: "public_onion_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Carrots 500g",
description: "Sweet and crunchy carrots",
brand: "Farm Fresh",
price: 28,
discount: 3,
stocks: 120,
images: [{
  url: "https://placehold.co/400x400?text=Carrots",
  asset_id: "asset_carrot_1",
  public_id: "public_carrot_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Spinach 250g",
description: "Leafy spinach bunch, washed",
brand: "Farm Fresh",
price: 20,
discount: 2,
stocks: 100,
images: [{
  url: "https://placehold.co/400x400?text=Spinach",
  asset_id: "asset_spinach_1",
  public_id: "public_spinach_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Green Peas 500g",
description: "Sweet green peas, shelled",
brand: "Farm Fresh",
price: 55,
discount: 5,
stocks: 90,
images: [{
  url: "https://placehold.co/400x400?text=Peas",
  asset_id: "asset_peas_1",
  public_id: "public_peas_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Cucumbers 500g",
description: "Cool and crunchy cucumbers",
brand: "Farm Fresh",
price: 25,
discount: 2,
stocks: 110,
images: [{
  url: "https://placehold.co/400x400?text=Cucumbers",
  asset_id: "asset_cucumber_1",
  public_id: "public_cucumber_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Capsicum 500g",
description: "Green bell peppers, 500g",
brand: "Farm Fresh",
price: 55,
discount: 5,
stocks: 80,
images: [{
  url: "https://placehold.co/400x400?text=Capsicum",
  asset_id: "asset_capsicum_1",
  public_id: "public_capsicum_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Ginger 200g",
description: "Aromatic ginger for cooking",
brand: "Farm Fresh",
price: 30,
discount: 3,
stocks: 90,
images: [{
  url: "https://placehold.co/400x400?text=Ginger",
  asset_id: "asset_ginger_1",
  public_id: "public_ginger_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},

/* ================= FRUITS ================= */
{
name: "Fresh Apples 1kg",
description: "Juicy red apples",
brand: "Fresh",
price: 160,
discount: 10,
stocks: 80,
images: [{
  url: "https://placehold.co/400x400?text=Apples",
  asset_id: "asset_apples_1",
  public_id: "public_apples_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Bananas 6 pcs",
description: "Naturally ripe bananas",
brand: "Fresh",
price: 45,
discount: 5,
stocks: 140,
images: [{
  url: "https://placehold.co/400x400?text=Bananas",
  asset_id: "asset_banana_1",
  public_id: "public_banana_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},
{
name: "Fresh Oranges 1kg",
description: "Sweet and juicy oranges",
brand: "Fresh",
price: 120,
discount: 8,
stocks: 75,
images: [{
  url: "https://placehold.co/400x400?text=Oranges",
  asset_id: "asset_orange_1",
  public_id: "public_orange_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f775")],
subCategory: []
},

/* ================= MORE DAIRY & MILK ================= */
{
name: "Amul Cheese Slices 10 pcs",
description: "Processed cheese slices for sandwiches",
brand: "Amul",
price: 140,
discount: 10,
stocks: 80,
images: [{
  url: "https://placehold.co/400x400?text=Cheese",
  asset_id: "asset_cheese_1",
  public_id: "public_cheese_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f766")],
subCategory: []
},
{
name: "Mother Dairy Curd 400g",
description: "Thick set curd, 400g cup",
brand: "Mother Dairy",
price: 48,
discount: 5,
stocks: 110,
images: [{
  url: "https://placehold.co/400x400?text=Curd",
  asset_id: "asset_curd_1",
  public_id: "public_curd_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f766")],
subCategory: []
},
{
name: "Nestle Milkmaid 400g",
description: "Sweetened condensed milk",
brand: "Nestle",
price: 145,
discount: 10,
stocks: 70,
images: [{
  url: "https://placehold.co/400x400?text=Milkmaid",
  asset_id: "asset_milkmaid_1",
  public_id: "public_milkmaid_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f766")],
subCategory: []
},
{
name: "Amul Paneer 200g",
description: "Soft paneer block, 200g",
brand: "Amul",
price: 95,
discount: 8,
stocks: 85,
images: [{
  url: "https://placehold.co/400x400?text=Paneer",
  asset_id: "asset_paneer_1",
  public_id: "public_paneer_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f766")],
subCategory: []
},

/* ================= MORE BAKERY & BREAD ================= */
{
name: "Brown Bread 400g",
description: "High-fiber brown bread loaf",
brand: "Britannia",
price: 50,
discount: 5,
stocks: 90,
images: [{
  url: "https://placehold.co/400x400?text=Brown+Bread",
  asset_id: "asset_bread_2",
  public_id: "public_bread_2"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76f")],
subCategory: []
},
{
name: "Burger Buns 6 pcs",
description: "Soft burger buns pack",
brand: "Harvest Gold",
price: 55,
discount: 4,
stocks: 75,
images: [{
  url: "https://placehold.co/400x400?text=Buns",
  asset_id: "asset_buns_1",
  public_id: "public_buns_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76f")],
subCategory: []
},
{
name: "Pav Bread 6 pcs",
description: "Soft pav for vada pav",
brand: "Modern",
price: 30,
discount: 2,
stocks: 100,
images: [{
  url: "https://placehold.co/400x400?text=Pav",
  asset_id: "asset_pav_1",
  public_id: "public_pav_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76f")],
subCategory: []
},
{
name: "Eggless Cake Slice",
description: "Vanilla cake slice, 200g",
brand: "Britannia",
price: 60,
discount: 5,
stocks: 60,
images: [{
  url: "https://placehold.co/400x400?text=Cake",
  asset_id: "asset_cake_1",
  public_id: "public_cake_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76f")],
subCategory: []
},

/* ================= MORE SNACKS & MUNCHIES ================= */
{
name: "Kurkure Masala Munch",
description: "Spicy crunchy snack, 82g",
brand: "Kurkure",
price: 20,
discount: 2,
stocks: 180,
images: [{
  url: "https://placehold.co/400x400?text=Kurkure",
  asset_id: "asset_kurkure_1",
  public_id: "public_kurkure_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},
{
name: "Bingo Mad Angles",
description: "Achaari masti triangles, 72g",
brand: "Bingo",
price: 20,
discount: 2,
stocks: 160,
images: [{
  url: "https://placehold.co/400x400?text=Mad+Angles",
  asset_id: "asset_bingo_1",
  public_id: "public_bingo_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},
{
name: "Parle-G Family Pack",
description: "Glucose biscuits, 800g",
brand: "Parle",
price: 80,
discount: 5,
stocks: 120,
images: [{
  url: "https://placehold.co/400x400?text=Parle-G",
  asset_id: "asset_parle_1",
  public_id: "public_parle_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},
{
name: "Oreo Chocolate Cookies",
description: "Creamy chocolate sandwich biscuits",
brand: "Oreo",
price: 35,
discount: 4,
stocks: 130,
images: [{
  url: "https://placehold.co/400x400?text=Oreo",
  asset_id: "asset_oreo_1",
  public_id: "public_oreo_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},
{
name: "Good Day Butter Cookies",
description: "Rich buttery cookies, 600g",
brand: "Britannia",
price: 120,
discount: 8,
stocks: 90,
images: [{
  url: "https://placehold.co/400x400?text=Good+Day",
  asset_id: "asset_goodday_1",
  public_id: "public_goodday_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},
{
name: "Cadbury Dairy Milk 52g",
description: "Milk chocolate bar, 52g",
brand: "Cadbury",
price: 45,
discount: 5,
stocks: 140,
images: [{
  url: "https://placehold.co/400x400?text=Dairy+Milk",
  asset_id: "asset_dairymilk_1",
  public_id: "public_dairymilk_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f76c")],
subCategory: []
},

/* ================= MORE BEVERAGES ================= */
{
name: "Pepsi 750ml",
description: "Chilled cola soft drink",
brand: "Pepsi",
price: 40,
discount: 5,
stocks: 150,
images: [{
  url: "https://placehold.co/400x400?text=Pepsi",
  asset_id: "asset_pepsi_1",
  public_id: "public_pepsi_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f769")],
subCategory: []
},
{
name: "Red Bull Energy Drink 250ml",
description: "Energy drink can, 250ml",
brand: "Red Bull",
price: 125,
discount: 10,
stocks: 90,
images: [{
  url: "https://placehold.co/400x400?text=Red+Bull",
  asset_id: "asset_redbull_1",
  public_id: "public_redbull_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f769")],
subCategory: []
},
{
name: "Tropicana Orange Juice 1L",
description: "100% orange juice, 1L",
brand: "Tropicana",
price: 120,
discount: 10,
stocks: 85,
images: [{
  url: "https://placehold.co/400x400?text=Orange+Juice",
  asset_id: "asset_orange_juice_1",
  public_id: "public_orange_juice_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f769")],
subCategory: []
},
{
name: "Nescafe Classic 50g",
description: "Instant coffee powder, 50g",
brand: "Nescafe",
price: 155,
discount: 8,
stocks: 70,
images: [{
  url: "https://placehold.co/400x400?text=Coffee",
  asset_id: "asset_coffee_1",
  public_id: "public_coffee_1"
}],
category: [new mongoose.Types.ObjectId("698ef488b043b819d0f3f769")],
subCategory: []
}

];

// 🔥 Auto-generate remaining products up to 40
// Products list is fully defined above.

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    await ProductModel.deleteMany({});
    console.log("Old products removed");

    await ProductModel.insertMany(products);
    console.log("40 products inserted successfully!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    try {
      await mongoose.connection.close();
    } catch (closeError) {

      console.error("Failed to close DB connection:", closeError);
    }
    process.exit(1);
  }
};

seedDB();
