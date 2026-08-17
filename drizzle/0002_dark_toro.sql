ALTER TABLE `table_selections` ADD `viewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `table_sessions` ADD `tableNumber` varchar(32) DEFAULT '01' NOT NULL;--> statement-breakpoint
ALTER TABLE `table_sessions` ADD `closedAt` timestamp;--> statement-breakpoint
CREATE INDEX `table_sessions_table_number_idx` ON `table_sessions` (`tableNumber`);