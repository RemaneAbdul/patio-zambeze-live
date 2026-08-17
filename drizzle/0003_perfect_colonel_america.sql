CREATE TABLE `table_qr_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableNumber` varchar(64) NOT NULL,
	`qrToken` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `table_qr_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `table_qr_codes_tableNumber_unique` UNIQUE(`tableNumber`),
	CONSTRAINT `table_qr_codes_qrToken_unique` UNIQUE(`qrToken`)
);
