ALTER TABLE `table_sessions` ADD `waiterId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `waiterCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `waiterActive` tinyint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_waiterCode_unique` UNIQUE(`waiterCode`);