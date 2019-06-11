DROP TABLE IF EXISTS `Is`;
DROP TABLE IF EXISTS `Flags`;
DROP TABLE IF EXISTS `Relations`;
DROP TABLE IF EXISTS `In`;
DROP TABLE IF EXISTS `Groups`;
DROP TABLE IF EXISTS `Have`;
DROP TABLE IF EXISTS `Items`;
DROP TABLE IF EXISTS `Charas`;
DROP TABLE IF EXISTS `Places`;
DROP TABLE IF EXISTS `Alias`;
DROP TABLE IF EXISTS `Do`;
DROP TABLE IF EXISTS `Scripts`;

CREATE TABLE `Scripts` (
  `name` VARCHAR(63) NOT NULL PRIMARY KEY,

  `trigger` ENUM('entering', 'leaving', 'using', 'getting', 'dropping') NOT NULL,
  `action` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Do` (
  `script` VARCHAR(63) NOT NULL,
  `object` VARCHAR(63) NOT NULL,

  PRIMARY KEY (`script`, `object`),
  FOREIGN KEY (`script`) REFERENCES `Scripts` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Alias` (
  `key` VARCHAR(63) NOT NULL PRIMARY KEY,
  `value` VARCHAR(63) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Places` (
  `name` VARCHAR(63) NOT NULL PRIMARY KEY,
  `desc` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Charas` (
  `name` VARCHAR(63) NOT NULL PRIMARY KEY,
  `desc` TEXT,

  `place` VARCHAR(63),

  FOREIGN KEY (`place`) REFERENCES `Places` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Items` (
  `name` VARCHAR(63) NOT NULL PRIMARY KEY,
  `desc` TEXT,

  `total` INTEGER DEFAULT 1 NOT NULL,
  `left` INTEGER DEFAULT 1 NOT NULL,

  `place` VARCHAR(63),

  `trigger` ENUM("place", "usage") NOT NULL,
  `action` TEXT,

  FOREIGN KEY (`place`) REFERENCES `Places` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Have` (
  `chara` VARCHAR(63) NOT NULL,
  `item` VARCHAR(63) NOT NULL,

  `count` INTEGER DEFAULT 1 NOT NULL,
  `skill` INTEGER DEFAULT 100 NOT NULL,

  PRIMARY KEY (`chara`, `item`),
  FOREIGN KEY (`chara`) REFERENCES `Charas` (`name`),
  FOREIGN KEY (`item`) REFERENCES `Items` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Groups` (
  `name` VARCHAR(63) NOT NULL PRIMARY KEY,
  `desc` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `In` (
  `chara` VARCHAR(63) NOT NULL,
  `group` VARCHAR(63) NOT NULL,

  PRIMARY KEY (`chara`, `group`),
  FOREIGN KEY (`chara`) REFERENCES `Charas` (`name`),
  FOREIGN KEY (`group`) REFERENCES `Groups` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Relations` (
  `chara1` VARCHAR(63) NOT NULL,
  `chara2` VARCHAR(63) NOT NULL,

  `name` VARCHAR(63) NOT NULL,
  `desc` TEXT,

  PRIMARY KEY (`chara1`, `chara2`),
  FOREIGN KEY (`chara1`) REFERENCES `Charas` (`name`),
  FOREIGN KEY (`chara2`) REFERENCES `Charas` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Flags` (
  `name` VARCHAR(63) NOT NULL PRIMARY KEY,
  `desc` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `Is` (
  `chara` VARCHAR(63) NOT NULL,
  `flag` VARCHAR(63) NOT NULL,

  PRIMARY KEY (`chara`, `flag`),
  FOREIGN KEY (`chara`) REFERENCES `Charas` (`name`),
  FOREIGN KEY (`flag`) REFERENCES `Flags` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
