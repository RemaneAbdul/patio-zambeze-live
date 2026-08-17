CREATE TABLE `table_selection_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`selectionId` int NOT NULL,
	`productKey` varchar(160) NOT NULL,
	`productName` varchar(240) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	CONSTRAINT `table_selection_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `table_selections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`selectionNumber` int NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `table_selections_id` PRIMARY KEY(`id`),
	CONSTRAINT `table_selections_session_number_idx` UNIQUE(`sessionId`,`selectionNumber`)
);
--> statement-breakpoint
CREATE TABLE `table_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(128) NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `table_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `table_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `table_selection_items_selection_idx` ON `table_selection_items` (`selectionId`);--> statement-breakpoint
CREATE INDEX `table_selections_session_created_idx` ON `table_selections` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `table_sessions_status_idx` ON `table_sessions` (`status`);