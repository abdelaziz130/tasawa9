
-- Add shipping_fee to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee numeric NOT NULL DEFAULT 0;

-- Wilayas shipping table
CREATE TABLE IF NOT EXISTS public.wilayas_shipping (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wilaya_code integer NOT NULL UNIQUE,
  wilaya_name text NOT NULL,
  home_fee numeric NOT NULL DEFAULT 0,
  desk_fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wilayas_shipping TO anon, authenticated;
GRANT ALL ON public.wilayas_shipping TO service_role;

ALTER TABLE public.wilayas_shipping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipping readable by everyone" ON public.wilayas_shipping;
CREATE POLICY "Shipping readable by everyone" ON public.wilayas_shipping FOR SELECT USING (true);

DROP POLICY IF EXISTS "Shipping manageable by authenticated" ON public.wilayas_shipping;
CREATE POLICY "Shipping manageable by authenticated" ON public.wilayas_shipping
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed all 58 wilayas
INSERT INTO public.wilayas_shipping (wilaya_code, wilaya_name, home_fee, desk_fee) VALUES
(1,'أدرار',1400,900),(2,'الشلف',700,450),(3,'الأغواط',900,550),(4,'أم البواقي',700,450),
(5,'باتنة',700,450),(6,'بجاية',700,450),(7,'بسكرة',800,500),(8,'بشار',1100,700),
(9,'البليدة',500,350),(10,'البويرة',600,400),(11,'تمنراست',1600,1000),(12,'تبسة',800,500),
(13,'تلمسان',800,500),(14,'تيارت',700,450),(15,'تيزي وزو',600,400),(16,'الجزائر',400,300),
(17,'الجلفة',800,500),(18,'جيجل',700,450),(19,'سطيف',700,450),(20,'سعيدة',800,500),
(21,'سكيكدة',700,450),(22,'سيدي بلعباس',800,500),(23,'عنابة',700,450),(24,'قالمة',700,450),
(25,'قسنطينة',700,450),(26,'المدية',600,400),(27,'مستغانم',700,450),(28,'المسيلة',700,450),
(29,'معسكر',800,500),(30,'ورقلة',1000,600),(31,'وهران',700,450),(32,'البيض',900,550),
(33,'إليزي',1600,1000),(34,'برج بوعريريج',700,450),(35,'بومرداس',500,350),(36,'الطارف',700,450),
(37,'تندوف',1600,1000),(38,'تيسمسيلت',700,450),(39,'الوادي',900,550),(40,'خنشلة',800,500),
(41,'سوق أهراس',800,500),(42,'تيبازة',500,350),(43,'ميلة',700,450),(44,'عين الدفلى',700,450),
(45,'النعامة',1000,600),(46,'عين تموشنت',800,500),(47,'غرداية',900,550),(48,'غليزان',700,450),
(49,'تيميمون',1400,900),(50,'برج باجي مختار',1600,1000),(51,'أولاد جلال',900,550),(52,'بني عباس',1400,900),
(53,'عين صالح',1600,1000),(54,'عين قزام',1600,1000),(55,'تقرت',1000,600),(56,'جانت',1600,1000),
(57,'المغير',900,550),(58,'المنيعة',1200,700)
ON CONFLICT (wilaya_code) DO NOTHING;

-- Tighten policies: only authenticated (admin) can modify products; orders remain insertable by public (COD) but manageable only by authenticated
DROP POLICY IF EXISTS "Products insertable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products updatable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products deletable by everyone" ON public.products;
CREATE POLICY "Products manageable by authenticated" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Orders updatable by everyone" ON public.orders;
DROP POLICY IF EXISTS "Orders deletable by everyone" ON public.orders;
DROP POLICY IF EXISTS "Orders readable by everyone" ON public.orders;
CREATE POLICY "Orders manageable by authenticated" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Keep public INSERT for COD checkout (existing policy "Orders insertable by everyone")
