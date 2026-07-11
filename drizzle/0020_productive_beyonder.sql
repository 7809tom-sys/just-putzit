CREATE TABLE `date_night_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`matchId` int NOT NULL,
	`activityId` int,
	`externalEventId` varchar(100),
	`externalEventTitle` varchar(300),
	`amount` int NOT NULL DEFAULT 999,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`purchasedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `date_night_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_event_rsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`externalEventId` varchar(100) NOT NULL,
	`eventTitle` varchar(300) NOT NULL,
	`eventDate` varchar(50),
	`eventCity` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_event_rsvps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featured_venue_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueName` varchar(200) NOT NULL,
	`venueType` varchar(100) NOT NULL DEFAULT 'restaurant',
	`city` varchar(100) NOT NULL,
	`description` text,
	`logoUrl` varchar(500),
	`ctaUrl` varchar(500) NOT NULL,
	`ctaLabel` varchar(100) NOT NULL DEFAULT 'Book Now',
	`priceMonthly` int NOT NULL DEFAULT 4900,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`contactEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `featured_venue_listings_id` PRIMARY KEY(`id`)
);
