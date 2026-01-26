CREATE TABLE `resources` (
	`locator` text PRIMARY KEY NOT NULL,
	`domain` text NOT NULL,
	`path` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_resources_domain` ON `resources` (`domain`);--> statement-breakpoint
CREATE INDEX `idx_resources_type` ON `resources` (`type`);--> statement-breakpoint
CREATE INDEX `idx_resources_created_at` ON `resources` (`created_at`);