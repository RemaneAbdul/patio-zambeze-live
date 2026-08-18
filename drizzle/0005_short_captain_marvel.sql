CREATE TABLE `menu_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` varchar(64) NOT NULL DEFAULT 'default',
	`name` varchar(100) NOT NULL,
	`status` enum('ACTIVE','REMOVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` varchar(64) NOT NULL DEFAULT 'default',
	`categoryId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`preparation` text,
	`preparationEn` text,
	`price` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`status` enum('ACTIVE','INACTIVE','REMOVED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `menu_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `menu_categories_restaurant_idx` ON `menu_categories` (`restaurantId`);--> statement-breakpoint
CREATE INDEX `menu_products_restaurant_status_idx` ON `menu_products` (`restaurantId`,`status`);--> statement-breakpoint
CREATE INDEX `menu_products_category_idx` ON `menu_products` (`categoryId`);