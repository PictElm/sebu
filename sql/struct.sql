DROP TABLE IF EXISTS `Is`;
DROP TABLE IF EXISTS `Flags`;
DROP TABLE IF EXISTS `Relations`;
DROP TABLE IF EXISTS `In`;
DROP TABLE IF EXISTS `Groups`;
DROP TABLE IF EXISTS `Have`;
DROP TABLE IF EXISTS `Items`;
DROP TABLE IF EXISTS `Characters`;
DROP TABLE IF EXISTS `Locations`;

CREATE TABLE `Locations` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,

  `name` VARCHAR(255) NOT NULL,
  `desc` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Characters` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,

  `name` VARCHAR(255) NOT NULL,
  `desc` TEXT,

  `location` INTEGER,

  FOREIGN KEY (`location`) REFERENCES `Locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Items` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,

  `name` VARCHAR(255) NOT NULL,
  `desc` TEXT,

  `location` INTEGER,

  `trigger` ENUM("location", "usage") NOT NULL,
  `action` TEXT,

  FOREIGN KEY (`location`) REFERENCES `Locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Have` (
  `chara` INTEGER NOT NULL,
  `item` INTEGER NOT NULL,

  `count` INTEGER DEFAULT 1 NOT NULL,
  `skill` INTEGER DEFAULT 100 NOT NULL,

  PRIMARY KEY (`chara`, `item`),
  FOREIGN KEY (`chara`) REFERENCES `Characters` (`id`),
  FOREIGN KEY (`item`) REFERENCES `Items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Groups` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,

  `name` VARCHAR(255) NOT NULL,
  `desc` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `In` (
  `chara` INTEGER NOT NULL,
  `group` INTEGER NOT NULL,

  PRIMARY KEY (`chara`, `group`),
  FOREIGN KEY (`chara`) REFERENCES `Characters` (`id`),
  FOREIGN KEY (`group`) REFERENCES `Groups` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Relations` (
  `chara1` INTEGER NOT NULL,
  `chara2` INTEGER NOT NULL,

  `name` VARCHAR(255) NOT NULL,
  `desc` TEXT,

  PRIMARY KEY (`chara1`, `chara2`),
  FOREIGN KEY (`chara1`) REFERENCES `Characters` (`id`),
  FOREIGN KEY (`chara2`) REFERENCES `Characters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Flags` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,

  `name` VARCHAR(255) NOT NULL,
  `desc` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Is` (
  `chara` INTEGER NOT NULL,
  `flag` INTEGER NOT NULL,

  PRIMARY KEY (`chara`, `flag`),
  FOREIGN KEY (`chara`) REFERENCES `Characters` (`id`),
  FOREIGN KEY (`flag`) REFERENCES `Flags` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
