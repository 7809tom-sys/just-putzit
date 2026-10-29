-- Local event discovery cache, admin-curated calendar feeds, and venue
-- classification overrides.
--
-- Run this by hand against the Just Putzit MySQL database. It only creates new
-- tables. It does not alter community_events or any existing feature.
-- Safe to re-run.
--
-- This file is 0061 in the Manus export (7809tom-sys/just-putzit). The separate
-- Railway repo justputzit-backend already uses 0061-0063 for other sources, so
-- port this there as the next free number (0064 or later) rather than
-- replacing those files.

CREATE TABLE IF NOT EXISTS `local_discovery_areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `areaKey` varchar(160) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(32) DEFAULT NULL,
  `postalCode` varchar(16) DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `radiusMiles` double NOT NULL DEFAULT 25,
  `fetchedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` timestamp NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'fresh',
  `errorMessage` text,
  `sourceSummary` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `local_discovery_areas_area_key` (`areaKey`)
);

CREATE TABLE IF NOT EXISTS `discovered_local_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `areaKey` varchar(160) NOT NULL,
  `externalId` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `startsAt` timestamp NOT NULL,
  `endsAt` timestamp NULL DEFAULT NULL,
  `venueName` varchar(255) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(32) DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `category` varchar(32) NOT NULL DEFAULT 'community',
  `sourceAdapter` varchar(40) NOT NULL,
  `sourceLabel` varchar(160) DEFAULT NULL,
  `url` text,
  `priceCents` int DEFAULT NULL,
  `isFree` boolean NOT NULL DEFAULT false,
  `familyFriendly` boolean NOT NULL DEFAULT false,
  `organizerKind` varchar(32) NOT NULL,
  `venueOwnership` varchar(24) NOT NULL DEFAULT 'unknown',
  `brand` varchar(160) DEFAULT NULL,
  `brandWikidata` varchar(64) DEFAULT NULL,
  `osmId` varchar(64) DEFAULT NULL,
  `isSponsored` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `discovered_local_events_area_external` (`areaKey`, `externalId`)
);

CREATE TABLE IF NOT EXISTS `local_discovery_feeds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `areaKey` varchar(160) NOT NULL,
  `url` varchar(500) NOT NULL,
  `feedKind` varchar(16) NOT NULL,
  `label` varchar(160) NOT NULL,
  `organizerKind` varchar(32) NOT NULL DEFAULT 'other',
  `enabled` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `local_discovery_feeds_area_url` (`areaKey`, `url`)
);

CREATE TABLE IF NOT EXISTS `local_venue_overrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venueKey` varchar(255) NOT NULL,
  `displayName` varchar(255) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `classification` varchar(16) NOT NULL,
  `note` varchar(280) DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `local_venue_overrides_venue_key` (`venueKey`)
);
