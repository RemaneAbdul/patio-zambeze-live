ALTER TABLE `table_sessions` ADD `attendingWaiterId` int;--> statement-breakpoint
ALTER TABLE `table_sessions` ADD `attendingSince` timestamp;--> statement-breakpoint
CREATE INDEX `table_sessions_attending_waiter_idx` ON `table_sessions` (`attendingWaiterId`);