# تسوق

Build a complete, production-ready, mobile-first e-commerce web application tailored for the Algerian market. The app should feel like a native shopping application with full Supabase integration for backend database and media storage.



### 1. UI/UX & Design System (Mobile-First Approach):

- Primary Language: Arabic (RTL support, clear Arabic typography).

- Responsive mobile-app structure with a fixed Bottom Navigation Bar containing: 

  1. الرئيسية (Home)

  2. الأقسام (Categories)

  3. السلة (Cart)

  4. لوحة التحكم (Admin Dashboard)

- Header featuring brand title, dynamic cart badge, and search bar.

- Currency: All prices formatted in DZD (د.ج / دج).



### 2. Storefront & Customer Features:

- Product Grid (2 columns on mobile) displaying: High-quality image, Product title, Price, optional Discount badge (e.g., -20%), and a quick "اشترِ الآن" (Buy Now) button.

- Product Detail Modal/Page with detailed description, stock status, and image gallery.

- Quick Cash on Delivery (COD) Checkout Modal:

  - Simple form requesting: 

    1. الاسم واللقب (Full Name)

    2. رقم الهاتف (Phone Number)

    3. الولاية (Dropdown containing all 58 Algerian Wilayas, e.g., "16 - الجزائر", "31 - وهران")

    4. البلدية (Commune)

    5. نوع التوصيل (توصيل للمنزل / توصيل للمكتب)

  - Submitting an order creates a record in the `orders` database table and resets the cart without requiring customer login.



### 3. Supabase Backend Integration & Database Tables:

Set up Supabase database structure automatically:

- Table `products`: (id, title, description, price, old_price, image_url, category, stock, created_at)

- Table `orders`: (id, customer_name, phone, wilaya, commune, delivery_type, cart_items, total_price, status, created_at)

  - `status` field default: "جديد" (New). Options: ("جديد", "مؤكد", "تم الشحن", "تم التسليم", "ملغى").

- Supabase Storage Bucket named `product-images` for uploading product photos with public access.



### 4. Admin Dashboard (لوحة التحكم):

- Protected with a passcode modal (default passcode: "123456").

- **Product Management (CRUD):**

  - Form to upload new products (title, price, old price, category, stock, and image file picker that directly uploads to Supabase Storage).

  - Data table/list showing active products with Edit and Delete buttons.

- **Order Management:**

  - View all incoming orders sorted by newest first.

  - Filter orders by status (الكل، جديد، مؤكد، تم الشحن، إلخ).

  - Ability to change order status or delete test orders.

  - Basic analytics dashboard showing total revenue and total orders count.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tasawa9.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/80c2e671-1277-4cb9-8bea-80386c21c14e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
