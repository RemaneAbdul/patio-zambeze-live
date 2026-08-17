ALTER TABLE `table_selection_items` MODIFY COLUMN `productName` varchar(160) NOT NULL;--> statement-breakpoint
ALTER TABLE `table_selection_items` DROP COLUMN `productKey`;--> statement-breakpoint
ALTER TABLE `table_selection_items` DROP COLUMN `subtotal`;