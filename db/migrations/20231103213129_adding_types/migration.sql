INSERT INTO "ItemType" (name, storage_advice, suggested_life_span_seconds, category, "updatedAt") VALUES
('Broccoli', 'Store loosely wrapped in a refrigerator crisper drawer set to "High-Humidity"', 604800, 'Vegetables', NOW()),
('Brussels sprouts', 'Store loosely wrapped in a refrigerator crisper drawer set to "High-Humidity"', 604800, 'Vegetables', NOW()),
('Citrus', 'Store in a refrigerator at 41°F to 42°F', 1814400, 'Fruit', NOW()),
('Self Destructing Spinach', 'Good luck', 60, 'Test', NOW()),
('Apples', 'Store in a cool, dark place or in the refrigerator.', 1209600, 'Fruit', NOW()),
('Bananas', 'Store at room temperature, away from direct sunlight.', 604800, 'Fruit', NOW()),
('Carrots', 'Store in a cool, dry place or in the refrigerator.', 1209600, 'Vegetables', NOW()),
('Spinach', 'Store in the refrigerator in a plastic bag.', 604800, 'Vegetables', NOW()),
('Milk', 'Refrigerate at all times.', 604800, 'Dairy', NOW()),
('Cheese', 'Store in the refrigerator in an airtight container.', 1209600, 'Dairy', NOW()),
('Eggs', 'Keep in their original carton in the refrigerator.', 1814400, 'Eggs', NOW())
ON CONFLICT DO NOTHING;
