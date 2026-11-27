CREATE TABLE `meet_me_sessions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `venueType` enum('partner','gym','event') NOT NULL,
  `venueId` int NOT NULL,
  `venueKey` varchar(96) NOT NULL,
  `venueName` varchar(200) NOT NULL,
  `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` timestamp NOT NULL,
  `endedAt` timestamp NULL,
  `endReason` enum('manual','expired','superseded','safety') NULL,
  CONSTRAINT `meet_me_sessions_id` PRIMARY KEY(`id`),
  INDEX `meet_me_sessions_venue_idx` (`venueKey`,`expiresAt`),
  INDEX `meet_me_sessions_user_idx` (`userId`,`endedAt`)
);

CREATE TABLE `meet_me_encounters` (
  `id` int AUTO_INCREMENT NOT NULL,
  `lowerUserId` int NOT NULL,
  `higherUserId` int NOT NULL,
  `venueKey` varchar(96) NOT NULL,
  `venueName` varchar(200) NOT NULL,
  `dayKey` varchar(10) NOT NULL,
  `status` enum('pending','opened','greeted','dismissed','expired','reported') NOT NULL DEFAULT 'pending',
  `icebreaker` varchar(280),
  `surfacedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `openedAt` timestamp NULL,
  `greetedAt` timestamp NULL,
  `expiresAt` timestamp NOT NULL,
  CONSTRAINT `meet_me_encounters_id` PRIMARY KEY(`id`),
  CONSTRAINT `meet_me_encounters_pair_unique` UNIQUE(`lowerUserId`,`higherUserId`,`venueKey`,`dayKey`),
  INDEX `meet_me_encounters_lower_idx` (`lowerUserId`,`status`),
  INDEX `meet_me_encounters_higher_idx` (`higherUserId`,`status`)
);

CREATE TABLE `meet_me_nudges` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `encounterId` int NOT NULL,
  `kind` enum('nudge','greeting') NOT NULL DEFAULT 'nudge',
  `promptText` varchar(240) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `seenAt` timestamp NULL,
  CONSTRAINT `meet_me_nudges_id` PRIMARY KEY(`id`),
  INDEX `meet_me_nudges_user_idx` (`userId`,`createdAt`)
);
