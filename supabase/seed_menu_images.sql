-- Populate menu_items.image_url from curated food photos.
-- Run in Supabase SQL editor after reviewing URLs.
-- Client-side fallbacks in src/lib/menuImages.ts mirror this mapping.

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1598103442787-434a565f93dd?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%gegrilltes Hähnchen%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568901347209-07c08882a83b?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%beef burger%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1606755962772-72c4ca9f1f4b?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%chicken burger%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1520072959219-c595dc669360?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%veggie burger%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1550547660-44767806d7d0?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%spezial burger%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1544025162-8668e99e2291?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%wiener schnitzel%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1598103442787-434a565f93dd?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%jägerschnitzel%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1565299585323-38e1c5e26714?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%taco%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1529006557810-274b1c94f353?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%shawarma%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%salat%' AND name NOT ILIKE '%shrimps%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%shrimps salat%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1622976469168-8c433b763549?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%spaghetti bolognese%' OR name ILIKE '%penne vegetarisch%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1563379925779-d9e98734556?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%meeresfrüchten%';

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=640&h=420&q=80'
WHERE category_id IN (SELECT id FROM menu_categories WHERE name = 'Pizza')
  AND image_url IS NULL;

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=640&h=420&q=80'
WHERE category_id IN (SELECT id FROM menu_categories WHERE name = 'Gefüllte Pizzabrötchen')
  AND image_url IS NULL;

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1554866585-c8e0d0c4e35a?auto=format&fit=crop&w=640&h=420&q=80'
WHERE category_id IN (SELECT id FROM menu_categories WHERE name = 'Kaltgetränke')
  AND image_url IS NULL;

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1495474472281-666d21482b9f?auto=format&fit=crop&w=640&h=420&q=80'
WHERE category_id IN (SELECT id FROM menu_categories WHERE name = 'Heißgetränke')
  AND image_url IS NULL;

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1544142493-07769be42384?auto=format&fit=crop&w=640&h=420&q=80'
WHERE category_id IN (SELECT id FROM menu_categories WHERE name = 'Cocktails & Milkshakes')
  AND name NOT ILIKE '%milkshake%'
  AND image_url IS NULL;

UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1572490122745-8889e4fb7ee8?auto=format&fit=crop&w=640&h=420&q=80'
WHERE name ILIKE '%milkshake%';
