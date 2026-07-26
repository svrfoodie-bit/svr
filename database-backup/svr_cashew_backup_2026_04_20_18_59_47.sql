-- ============================================================
-- SVR Cashew Management System - Full SQL Backup
-- Database  : svr_cashew_db
-- Generated : 2026-04-20T18:59:47.256Z
-- ============================================================

CREATE DATABASE IF NOT EXISTS `svr_cashew_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `svr_cashew_db`;

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;
SET time_zone="+05:30";

-- --------------------------------------------------------
-- Table: `app_settings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `app_settings`;
CREATE TABLE `app_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `company_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`company_info`)),
  `payment_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payment_config`)),
  `user_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`user_preferences`)),
  `notification_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_settings`)),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `single_row` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No data in `app_settings`

-- --------------------------------------------------------
-- Table: `attendance`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workerId` int(11) NOT NULL,
  `attendanceDate` date NOT NULL,
  `status` enum('Present','Absent','Half Day','Leave') DEFAULT 'Present',
  `hoursWorked` decimal(4,2) DEFAULT 8.00,
  `overtimeHours` decimal(4,2) DEFAULT 0.00,
  `notes` varchar(255) DEFAULT NULL,
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_worker_date` (`workerId`,`attendanceDate`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`workerId`) REFERENCES `workers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `attendance`

-- --------------------------------------------------------
-- Table: `audit_logs`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `userName` varchar(100) DEFAULT NULL,
  `userRole` varchar(50) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity` varchar(80) NOT NULL,
  `entityId` varchar(50) DEFAULT NULL,
  `entityLabel` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity`),
  KEY `idx_userId` (`userId`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `audit_logs` : 13 row(s)
INSERT INTO `audit_logs` (`id`, `userId`, `userName`, `userRole`, `action`, `entity`, `entityId`, `entityLabel`, `description`, `ipAddress`, `createdAt`) VALUES
  (1, 1, 'Admin User', 'Admin', 'LOGIN', 'auth', NULL, 'Admin User', 'User logged in', '::1', '2026-04-12 05:28:34'),
  (2, 1, 'System', 'Admin', 'CREATE', 'raw_purchases', '9', 'Nookaraju', NULL, '::1', '2026-04-13 12:54:25'),
  (3, 1, 'Admin User', 'Admin', 'LOGIN', 'auth', NULL, 'Admin User', 'User logged in', '::1', '2026-04-20 09:57:58'),
  (4, 1, 'Admin User', 'Admin', 'LOGIN', 'auth', NULL, 'Admin User', 'User logged in', '::1', '2026-04-20 11:07:27'),
  (5, 1, 'Admin User', 'Admin', 'LOGIN', 'auth', NULL, 'Admin User', 'User logged in', '::1', '2026-04-20 11:08:05'),
  (6, 1, 'System', 'Admin', 'CREATE', 'expenses', '9', 'Phone / Internet', NULL, '::1', '2026-04-20 11:18:08'),
  (7, 1, 'System', 'Admin', 'CREATE', 'sales_orders', '4', 'SO-2026-001', NULL, '::1', '2026-04-20 17:51:06'),
  (8, 1, 'System', 'Admin', 'CREATE', 'sales_orders', '5', 'SO-2026-002', NULL, '::1', '2026-04-20 18:06:04'),
  (9, 1, 'System', 'Admin', 'UPDATE', 'raw_purchases', '9', 'Nookaraju', NULL, '::1', '2026-04-20 18:49:42'),
  (10, 1, 'System', 'Admin', 'UPDATE', 'raw_purchases', '9', 'Nookaraju', NULL, '::1', '2026-04-20 18:49:51'),
  (11, 1, 'System', 'Admin', 'UPDATE', 'raw_purchases', '9', 'Nookaraju', NULL, '::1', '2026-04-20 18:50:14'),
  (12, 1, 'System', 'Admin', 'UPDATE', 'raw_purchases', '9', 'Nookaraju', NULL, '::1', '2026-04-20 18:50:43'),
  (13, 1, 'System', 'Admin', 'UPDATE', 'raw_purchases', '9', 'Nookaraju', NULL, '::1', '2026-04-20 18:50:53');

-- --------------------------------------------------------
-- Table: `automation_logs`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `automation_logs`;
CREATE TABLE `automation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jobType` enum('payment_reminder','stock_alert','depreciation','gst_compile') NOT NULL,
  `status` enum('success','failed','skipped') NOT NULL,
  `summary` varchar(500) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `runAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `automation_logs` : 8 row(s)
INSERT INTO `automation_logs` (`id`, `jobType`, `status`, `summary`, `details`, `runAt`) VALUES
  (1, 'payment_reminder', 'skipped', 'Disabled in settings', '{}', '2026-04-12 12:11:32'),
  (2, 'stock_alert', 'skipped', 'Disabled in settings', '{}', '2026-04-12 12:11:34'),
  (3, 'depreciation', 'skipped', 'Disabled in settings', '{}', '2026-04-12 12:11:37'),
  (4, 'gst_compile', 'skipped', 'Disabled in settings', '{}', '2026-04-12 12:11:39'),
  (5, 'gst_compile', 'skipped', 'Disabled in settings', '{}', '2026-04-12 12:13:35'),
  (6, 'gst_compile', 'skipped', 'Disabled in settings', '{}', '2026-04-12 12:13:36'),
  (7, 'stock_alert', 'skipped', 'Disabled in settings', '{}', '2026-04-13 12:30:00'),
  (8, 'stock_alert', 'skipped', 'Disabled in settings', '{}', '2026-04-20 18:30:00');

-- --------------------------------------------------------
-- Table: `automation_settings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `automation_settings`;
CREATE TABLE `automation_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `settingKey` varchar(100) NOT NULL,
  `settingValue` text DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `settingKey` (`settingKey`)
) ENGINE=InnoDB AUTO_INCREMENT=868 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `automation_settings` : 17 row(s)
INSERT INTO `automation_settings` (`id`, `settingKey`, `settingValue`, `updatedAt`) VALUES
  (1, 'payment_reminder_enabled', 'false', '2026-04-12 12:03:16'),
  (3, 'payment_reminder_days', '30', '2026-04-12 12:03:16'),
  (5, 'payment_reminder_channel', 'whatsapp', '2026-04-12 12:03:16'),
  (7, 'payment_reminder_schedule', '0 9 * * *', '2026-04-12 12:03:16'),
  (9, 'stock_alert_enabled', 'false', '2026-04-12 12:03:16'),
  (11, 'stock_alert_threshold_kg', '100', '2026-04-12 12:03:16'),
  (13, 'stock_alert_phone', '', '2026-04-12 12:03:16'),
  (15, 'stock_alert_schedule', '0 */6 * * *', '2026-04-12 12:03:16'),
  (17, 'depreciation_enabled', 'false', '2026-04-12 12:03:16'),
  (19, 'depreciation_day_of_month', '1', '2026-04-12 12:03:16'),
  (21, 'gst_compile_enabled', 'false', '2026-04-12 12:03:16'),
  (23, 'gst_compile_day_of_month', '5', '2026-04-12 12:03:16'),
  (25, 'twilio_account_sid', '', '2026-04-12 12:03:16'),
  (27, 'twilio_auth_token', '', '2026-04-12 12:03:16'),
  (29, 'twilio_whatsapp_from', 'whatsapp:+14155238886', '2026-04-12 12:03:16'),
  (31, 'twilio_sms_from', '', '2026-04-12 12:03:16'),
  (33, 'owner_phone', '', '2026-04-12 12:03:16');

-- --------------------------------------------------------
-- Table: `capital_investments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `capital_investments`;
CREATE TABLE `capital_investments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capitalCode` varchar(20) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `investmentDate` date NOT NULL,
  `description` varchar(200) NOT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `capitalCode` (`capitalCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `capital_investments`

-- --------------------------------------------------------
-- Table: `customers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customerId` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('Retail','Wholesale') NOT NULL,
  `contactNumber` varchar(20) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customerId` (`customerId`),
  KEY `customerId_2` (`customerId`),
  KEY `type` (`type`),
  KEY `isActive` (`isActive`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `customers` : 1 row(s)
INSERT INTO `customers` (`id`, `customerId`, `name`, `type`, `contactNumber`, `area`, `email`, `address`, `isActive`, `createdAt`, `updatedAt`, `createdBy`, `isDeleted`) VALUES
  (11, 'CUST-0001', 'Naresh customer d', 'Retail', '9000728565', 'Hyd', NULL, NULL, 1, '2026-04-05 12:48:18', '2026-04-05 12:48:36', 1, 0);

-- --------------------------------------------------------
-- Table: `daily_work`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `daily_work`;
CREATE TABLE `daily_work` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workerId` int(11) NOT NULL,
  `workDate` date NOT NULL,
  `workType` varchar(50) DEFAULT NULL,
  `assignedQuantity` decimal(10,2) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `bonusAmount` decimal(12,2) DEFAULT 0.00,
  `bonusEligible` tinyint(1) DEFAULT 0,
  `status` enum('Pending','In Progress','Completed') DEFAULT 'In Progress',
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `workerId` (`workerId`),
  KEY `workDate` (`workDate`),
  CONSTRAINT `daily_work_ibfk_1` FOREIGN KEY (`workerId`) REFERENCES `workers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `daily_work` : 7 row(s)
INSERT INTO `daily_work` (`id`, `workerId`, `workDate`, `workType`, `assignedQuantity`, `quantity`, `rate`, `totalAmount`, `bonusAmount`, `bonusEligible`, `status`, `notes`, `createdAt`, `updatedAt`, `createdBy`) VALUES
  (5, 9, '2026-04-11 18:30:00', 'Steaming', NULL, '20.00', '12.00', '1239.40', '999.40', 1, 'In Progress', 'test ', '2026-04-05 11:55:33', '2026-04-13 12:45:40', 1),
  (6, 9, '2026-04-12 18:30:00', 'Shelling', NULL, '30.00', '20.00', '900.00', '300.00', 1, 'In Progress', NULL, '2026-04-13 12:44:34', '2026-04-13 12:44:50', 1),
  (7, 9, '2026-04-19 18:30:00', 'Peeling', NULL, '50.00', '50.00', '3000.00', '500.00', 1, 'Completed', NULL, '2026-04-20 10:59:27', '2026-04-20 11:54:42', 1),
  (8, 11, '2026-04-19 18:30:00', 'Grading', '30.00', '30.00', '16.00', '0.00', '0.00', 1, 'Completed', NULL, '2026-04-20 10:59:52', '2026-04-20 14:07:17', 1),
  (9, 9, '2026-04-19 18:30:00', 'Steaming', '100.00', '100.00', '10.00', '0.00', '0.00', 1, 'Completed', NULL, '2026-04-20 11:00:19', '2026-04-20 14:07:21', 1),
  (10, 12, '2026-04-19 18:30:00', 'Roasting', '19.99', '19.99', '10.00', '0.00', '0.00', 1, 'Completed', NULL, '2026-04-20 11:09:55', '2026-04-20 14:07:25', 1),
  (11, 9, '2026-04-19 18:30:00', 'Roasting', '100.00', '100.00', '10.00', '0.00', '0.00', 1, 'Completed', NULL, '2026-04-20 11:10:50', '2026-04-20 14:07:29', 1);

-- --------------------------------------------------------
-- Table: `expenses`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expenseCode` varchar(50) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `paymentMode` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `paidTo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `expenses` : 5 row(s)
INSERT INTO `expenses` (`id`, `expenseCode`, `category`, `description`, `amount`, `paymentMode`, `date`, `notes`, `createdAt`, `updatedAt`, `createdBy`, `paidTo`) VALUES
  (5, 'EXP-0005', 'Water', 'water bill ', '500.00', 'Cash', '2026-04-04 18:30:00', NULL, '2026-04-05 13:02:04', '2026-04-05 13:10:21', 1, 'fdsf'),
  (6, 'EXP-0006', 'Rent', 'may rent paid', '10000.00', 'PhonePe', '2026-04-04 18:30:00', NULL, '2026-04-05 13:02:46', '2026-04-05 13:09:00', 1, NULL),
  (7, 'EXP-0007', 'Fuel', 'auto driver', '9000.00', 'Cash', '2026-04-04 18:30:00', NULL, '2026-04-05 13:06:58', '2026-04-05 13:09:00', 1, NULL),
  (8, 'EXP-0004', 'Loading', 'f', '1000.00', 'Cash', '2026-04-04 18:30:00', NULL, '2026-04-05 13:10:55', '2026-04-05 13:10:55', 1, 'kalsalue '),
  (9, 'EXP-0005', 'Phone / Internet', 'a', '500.00', 'Cash', '2026-04-19 18:30:00', NULL, '2026-04-20 11:18:08', '2026-04-20 11:18:08', 1, 'Abc');

-- --------------------------------------------------------
-- Table: `export_history`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `export_history`;
CREATE TABLE `export_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('EMAIL','SCHEDULED','MANUAL') NOT NULL,
  `module` enum('SALES','PAYMENTS','RAW_PURCHASE','JOB_WORK','EXPENSES','CUSTOMERS') NOT NULL,
  `format` enum('EXCEL','PDF') NOT NULL,
  `recipients` text DEFAULT NULL,
  `status` enum('SUCCESS','FAILED','IN_PROGRESS') DEFAULT 'IN_PROGRESS',
  `record_count` int(11) DEFAULT 0,
  `file_size` int(11) DEFAULT 0,
  `file_path` varchar(500) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `executed_by` varchar(100) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_module` (`module`),
  KEY `idx_status` (`status`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No data in `export_history`

-- --------------------------------------------------------
-- Table: `export_schedules`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `export_schedules`;
CREATE TABLE `export_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `module` enum('SALES','PAYMENTS','RAW_PURCHASE','JOB_WORK','EXPENSES','CUSTOMERS') NOT NULL,
  `frequency` enum('DAILY','WEEKLY','MONTHLY') NOT NULL,
  `time` time NOT NULL,
  `format` enum('EXCEL','PDF') NOT NULL,
  `recipients` text NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `status` enum('ACTIVE','PAUSED') DEFAULT 'ACTIVE',
  `last_run` timestamp NULL DEFAULT NULL,
  `next_run` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_next_run` (`next_run`),
  KEY `idx_frequency` (`frequency`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `export_schedules_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `export_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No data in `export_schedules`

-- --------------------------------------------------------
-- Table: `export_templates`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `export_templates`;
CREATE TABLE `export_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `module` enum('SALES','PAYMENTS','RAW_PURCHASE','JOB_WORK','EXPENSES','CUSTOMERS') NOT NULL,
  `columns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`columns`)),
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filters`)),
  `is_default` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_module` (`module`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No data in `export_templates`

-- --------------------------------------------------------
-- Table: `finished_goods_stock`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `finished_goods_stock`;
CREATE TABLE `finished_goods_stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batchId` int(11) DEFAULT NULL,
  `grade` varchar(100) NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `dateAdded` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `batchId` (`batchId`),
  KEY `grade` (`grade`),
  KEY `dateAdded` (`dateAdded`),
  CONSTRAINT `finished_goods_stock_ibfk_1` FOREIGN KEY (`batchId`) REFERENCES `processing_batches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `finished_goods_stock` : 8 row(s)
INSERT INTO `finished_goods_stock` (`id`, `batchId`, `grade`, `quantity`, `dateAdded`, `createdAt`, `createdBy`) VALUES
  (7, 9, 'Full Kaju', '80.00', '2026-04-11 18:30:00', '2026-04-20 17:38:43', 1),
  (8, 9, 'Split Kaju', '70.00', '2026-04-11 18:30:00', '2026-04-20 17:38:43', 1),
  (9, 9, '4 Pieces', '50.00', '2026-04-11 18:30:00', '2026-04-20 17:38:43', 1),
  (10, 9, '8 Pieces', '120.00', '2026-04-11 18:30:00', '2026-04-20 17:38:43', 1),
  (11, 9, 'Chura', '80.00', '2026-04-11 18:30:00', '2026-04-20 17:38:43', 1),
  (12, NULL, 'Full Kaju', '-20.00', '2026-04-19 18:30:00', '2026-04-20 17:51:06', 1),
  (13, NULL, 'Split Kaju', '-10.00', '2026-04-19 18:30:00', '2026-04-20 17:51:06', 1),
  (14, NULL, 'Full Kaju', '-10.00', '2026-04-19 18:30:00', '2026-04-20 18:06:04', 1);

-- --------------------------------------------------------
-- Table: `fixed_assets`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `fixed_assets`;
CREATE TABLE `fixed_assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assetCode` varchar(20) NOT NULL,
  `assetName` varchar(150) NOT NULL,
  `assetType` enum('Machinery','Land','Building','Vehicle','Furniture','Equipment','Other') NOT NULL,
  `purchaseDate` date NOT NULL,
  `purchaseCost` decimal(14,2) NOT NULL,
  `currentValue` decimal(14,2) NOT NULL,
  `depreciationRate` decimal(5,2) DEFAULT 10.00,
  `lastDepreciationDate` date DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `status` enum('Active','Disposed','Under Maintenance') DEFAULT 'Active',
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `assetCode` (`assetCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `fixed_assets`

-- --------------------------------------------------------
-- Table: `grade_prices`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `grade_prices`;
CREATE TABLE `grade_prices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grade` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `pricePerKg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `minPrice` decimal(10,2) DEFAULT 0.00,
  `maxPrice` decimal(10,2) DEFAULT 0.00,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `grade` (`grade`)
) ENGINE=InnoDB AUTO_INCREMENT=840 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `grade_prices` : 13 row(s)
INSERT INTO `grade_prices` (`id`, `grade`, `description`, `pricePerKg`, `minPrice`, `maxPrice`, `isActive`, `createdAt`, `updatedAt`) VALUES
  (1, 'W180', 'Whole W180 - Premium (180 kernels/lb)', '1050.00', '900.00', '1200.00', 0, '2026-04-11 16:42:11', '2026-04-20 17:59:17'),
  (2, 'W210', 'Whole W210 (210 kernels/lb)', '950.00', '800.00', '1100.00', 0, '2026-04-11 17:15:46', '2026-04-20 17:59:17'),
  (3, 'W240', 'Whole W240 (240 kernels/lb)', '850.00', '700.00', '1000.00', 0, '2026-04-11 17:15:46', '2026-04-20 17:59:17'),
  (4, 'W320', 'Whole W320 - Standard (320 kernels/lb)', '750.00', '600.00', '900.00', 0, '2026-04-11 17:15:46', '2026-04-20 17:59:17'),
  (5, 'W450', 'Whole W450 (450 kernels/lb)', '650.00', '500.00', '800.00', 0, '2026-04-11 17:15:46', '2026-04-20 17:59:17'),
  (6, 'Splits', 'Split cashews (broken in halves)', '520.00', '400.00', '650.00', 0, '2026-04-11 17:15:46', '2026-04-20 17:59:17'),
  (7, 'Broken', 'Broken pieces (multiple pieces)', '420.00', '300.00', '550.00', 0, '2026-04-11 17:15:46', '2026-04-20 17:59:17'),
  (8, 'Pieces', 'Small pieces / bits', '300.00', '200.00', '400.00', 0, '2026-04-11 17:15:46', '2026-04-20 17:59:17'),
  (820, 'Full Kaju', 'Whole kaju / full kernels', '1000.00', '800.00', '1200.00', 1, '2026-04-20 17:58:23', '2026-04-20 17:58:23'),
  (821, 'Split Kaju', 'Split kaju pieces', '800.00', '600.00', '950.00', 1, '2026-04-20 17:58:23', '2026-04-20 17:58:23'),
  (822, '4 Pieces', 'Kaju broken into 4 pieces', '600.00', '450.00', '750.00', 1, '2026-04-20 17:58:23', '2026-04-20 17:58:23'),
  (823, '8 Pieces', 'Kaju broken into 8 pieces', '420.00', '300.00', '550.00', 1, '2026-04-20 17:58:23', '2026-04-20 17:58:23'),
  (824, 'Chura', 'Small kaju bits / chura', '250.00', '150.00', '350.00', 1, '2026-04-20 17:58:23', '2026-04-20 17:58:23');

-- --------------------------------------------------------
-- Table: `job_work`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `job_work`;
CREATE TABLE `job_work` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jobDate` date NOT NULL,
  `jobWorkerName` varchar(255) NOT NULL,
  `cashewType` varchar(50) NOT NULL DEFAULT 'Premium',
  `quantitySent` decimal(10,2) NOT NULL,
  `quantityReceived` decimal(10,2) NOT NULL,
  `ratePerKg` decimal(10,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `status` enum('In Progress','Completed','Cancelled') DEFAULT 'In Progress',
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `job_work` : 2 row(s)
INSERT INTO `job_work` (`id`, `jobDate`, `jobWorkerName`, `cashewType`, `quantitySent`, `quantityReceived`, `ratePerKg`, `remarks`, `startDate`, `endDate`, `status`, `notes`, `createdAt`, `updatedAt`, `createdBy`) VALUES
  (3, '2026-04-05 18:30:00', 'Test Worker', 'Premium', '100.00', '50.00', '150.00', '', NULL, NULL, 'In Progress', NULL, '2026-04-05 10:28:14', '2026-04-05 11:03:57', 1),
  (4, '2026-04-04 18:30:00', 'naresh job work', 'Premium', '10.00', '5.00', '800.00', 'this is testinh ', NULL, NULL, 'In Progress', NULL, '2026-04-05 11:03:27', '2026-04-05 11:03:27', 1);

-- --------------------------------------------------------
-- Table: `job_work_payments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `job_work_payments`;
CREATE TABLE `job_work_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jobWorkId` int(11) NOT NULL,
  `paymentDate` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentMode` enum('Cash','Cheque','Bank Transfer','UPI') NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `paymentDate` (`paymentDate`),
  KEY `jobWorkId` (`jobWorkId`),
  CONSTRAINT `job_work_payments_ibfk_1` FOREIGN KEY (`jobWorkId`) REFERENCES `job_work` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No data in `job_work_payments`

-- --------------------------------------------------------
-- Table: `leads`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `leads`;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('New','Contacted','Qualified','Converted','Lost') DEFAULT 'New',
  `source` varchar(100) DEFAULT NULL,
  `campaignId` int(11) DEFAULT NULL,
  `waSent` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `normalizedPhone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `phone` (`phone`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=160 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `leads` : 155 row(s)
INSERT INTO `leads` (`id`, `name`, `phone`, `status`, `source`, `campaignId`, `waSent`, `notes`, `location`, `createdAt`, `updatedAt`, `createdBy`, `address`, `category`, `normalizedPhone`) VALUES
  (5, 'Unknown', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, NULL, NULL),
  (6, 'Unknown', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, NULL, NULL),
  (7, 'Raja Pulav Foods & Caterers', '077789 95123', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY, SHOP 5 JAL VAYU VIHAR SHOPPING COMPLEX, JAL VAYU VIHAR, opp. MIND EDUCATION FUNCTION', 'Restaurant', '917778995123'),
  (8, 'Vevina Kitchen & Caterers private limited', '094949 67878', 'New', 'Google Forms', NULL, 0, 'https://www.instagram.com/vevina_kitchen_caterers?igsh=bmt2bm1hcXIyYXE1', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '3rd floor, opp. patel kunta park', 'Caterer', '919494967878'),
  (9, 'Padmaja Vegetarian Catering & Kitchen ( బ్రాహ్మణ బోజనము )™ Best Brahmin Bhojanam Catering Service', '086396 62601', 'New', 'Google Forms', NULL, 0, 'https://www.brahminbhojanam.co.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Phase 3, LIG 55/7, eSeva Ln', 'Vegetarian', '918639662601'),
  (10, 'Best Caterer\'s', '091774 59943', 'New', 'Google Forms', NULL, 0, 'http://bestcaterers.co.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Road No. 6', 'Caterer', '919177459943'),
  (11, 'Unnathi Caterers', '095737 88799', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Gokul plots, Plot no 12', 'Caterer', '919573788799'),
  (12, 'Abhilasha Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, 'Caterer', NULL),
  (13, 'Abhi Caterings Veg and Nonveg', '099661 24412', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'MIG - 300', 'Caterer', '919966124412'),
  (14, 'Manikantaa Catering Services', '073372 32299', 'New', 'Google Forms', NULL, 0, 'https://whatsapp.com/channel/0029VbCPZeE6xCSLC1Z18x3E', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'opposite Bhavya Apartments', 'Caterer', '917337232299'),
  (15, 'Kamal catering services best catering in Hyderabad', '091105 81904', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Catering food and drink supplier', '919110581904'),
  (16, 'Sree Deepika Caterers', '099125 74784', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '2-1-MN/50/453/ER', 'Caterer', '919912574784'),
  (17, 'NAGA MAYURI CATERERS', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'lake', 'Catering food and drink supplier', NULL),
  (18, 'Master Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '32-1721/3, Plot No.3 Sapthagiri Colony, Kukatpally Opp: Arekapudi Gandhi Residence Lane', 'Caterer', NULL),
  (19, 'Madhura caterers', '097012 62680', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '184/c, near Dhanalakshmi center', 'Restaurant', '919701262680'),
  (20, 'Vaaraahi Caterers', '083674 44488', 'New', 'Google Forms', NULL, 0, 'http://vaaraahicaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '2nd, Rd Number 1, opp. Forum Mall', 'Caterer', '918367444488'),
  (21, 'HN Caterers', '088854 67894', 'New', 'Google Forms', NULL, 0, 'https://www.hncaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot no 70', 'Restaurant supply store', '918885467894'),
  (22, 'Vengalas Caterers - Best Caterers in Hyderabad', '093924 36309', 'New', 'Google Forms', NULL, 0, 'https://vengalascaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Caterer', '919392436309'),
  (23, 'Sri Venkat Sai Krishna Catering', '093912 49446', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'hno2-1+23|h|120, hmt hills, near st joseph school hyd', 'Caterer', '919391249446'),
  (24, 'Lakshmee Caterers', '090592 80580', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot-450, opp. KPHB Colony', 'Caterer', '919059280580'),
  (25, 'Meenakshi Parcel & Catering', '096522 22005', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'MIG - 650 & 651', 'Caterer', '919652222005'),
  (26, 'Grandma\'s Catering/Kitchen', '094485 15607', 'New', 'Google Forms', NULL, 0, 'https://whatsform.com/nw4imi', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Food manufacturer', '919448515607'),
  (27, 'Kinnera Caterers', '096666 55634', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot no. 1,2, x Roads, 3/part, Jagan Studios Rd', 'Caterer', '919666655634'),
  (28, 'Lakshmi Balaji Home Foods And Caterers', '090004 33532', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Shop No 1', 'Caterer', '919000433532'),
  (29, 'Joshi\'s Me Kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Joshi\'s ME Kitchen Near Gram panchayat, Nizampet, Medchal - Malkajgiri, Telangana, 500072', 'Caterer', NULL),
  (30, 'Sindhuja kitchen, vivaaha foods and caterers', '087900 67799', 'New', 'Google Forms', NULL, 0, 'https://www.sindhujakitchen.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'As raju nagar, nizampet, near Vinyakamandapam', 'Caterer', '918790067799'),
  (31, 'VIJAYA JAITHRA CATERERS', '090598 95354', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'PLOT NO:217&218', 'Restaurant supply store', '919059895354'),
  (32, 'SREE NANDHU CATERING services Best Catering services in Hyderabad', '083414 74749', 'New', 'Google Forms', NULL, 0, 'http://sreenandhucaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Catering food and drink supplier', '918341474749'),
  (33, 'Sri Lakshmi Caterers', '098666 33513', 'New', 'Google Forms', NULL, 0, 'http://srilakshmicaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'H.No. 5-5-35/258/2A1, behind Metro Cash & Carry', 'Caterer', '919866633513'),
  (34, 'caterings kukatpally', '099122 01960', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'ssd grammer high school, Allwyn colony, west, near Ssd grammer high school', 'Catering food and drink supplier', '919912201960'),
  (35, 'Sri vatsa Caterers', '090009 21364', 'New', 'Google Forms', NULL, 0, 'http://srivatsacaterers.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '3', 'Caterer', '919000921364'),
  (36, 'Abhiruchi Caterers', '096527 71122', 'New', 'Google Forms', NULL, 0, 'https://abhiruchicaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Shop No Mig 2 Phase, 3, Road No. 4, near Manjeera Trinity Homes', 'Caterer', '919652771122'),
  (37, 'Trinetra Caterers', '099596 09509', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'No 4 A Road, Road No. 4', 'Caterer', '919959609509'),
  (38, 'Sri Jyothi Veg Catering', '073825 15113', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '15-21-99, ysr statue circle', 'Catering food and drink supplier', '917382515113'),
  (39, 'JYOTHIRMAYEE CATERERS', '091334 55145', 'New', 'Google Forms', NULL, 0, 'http://www.jyothirmayeecaterers.co.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'MIG-204', 'Restaurant supply store', '919133455145'),
  (40, 'Miss Chef By WEMART', '091779 99708', 'New', 'Google Forms', NULL, 0, 'https://misschef.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Caterer', '919177999708'),
  (41, 'Kshatriyas Radha Krishna Curries and Catering', '092912 18629', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'manjeera, water tank, Sudhakar\'s pride, Lane, road, opposite to More Super Market', 'Caterer', '919291218629'),
  (42, 'SRI BHARATHI Caterers & Event Management', '093815 68119', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Restaurant supply store', '919381568119'),
  (43, 'Amrut Vintage Caterers (Pure Veg –Authentic Heritage Cooking in Traditional Bronze Utensils)', '091334 15666', 'New', 'Google Forms', NULL, 0, 'https://www.bestvintagecaterers.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'P-33, Plot No: 5-3-326/5/1/B, Road No. 6', 'Caterer', '919133415666'),
  (44, 'Om Sree Sai Foods central kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'opp. to akshara international school', 'Caterer', NULL),
  (45, 'Prasidh Caterers', '090595 30560', 'New', 'Google Forms', NULL, 0, 'https://www.prasidhcaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '2-62/102/21p, near Madhura nagar, opposite to abhijna high school', 'Caterer', '919059530560'),
  (46, 'Piegeon Company Outlet Nizampet', '079955 66888', 'New', 'Google Forms', NULL, 0, 'http://www.masalafoodservices.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Caterer', '917995566888'),
  (47, 'Aadhya caterers', '094940 55353', 'New', 'Google Forms', NULL, 0, 'http://www.aadhyacaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Caterer', '919494055353'),
  (48, 'PR CATERING AND EVENTS', '090904 64683', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No 1270, near Bhavya\'s Tarakarama Nagar', 'Catering food and drink supplier', '919090464683'),
  (49, 'Manikanta Caterers', '086863 32288', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot-no-92, High Tension Rd', 'Caterer', '918686332288'),
  (50, 'Meghana Catering services', '063009 39160', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Caterer', '916300939160'),
  (51, 'Sangeetha catering', '075691 49844', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Shirdi hills road no 6B. Sainagar', 'Catering food and drink supplier', '917569149844'),
  (52, 'Sreedevi Tiffins and catering services', '077022 43523', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot number 113, Street Number 1, near MNR college', 'Restaurant', '917702243523'),
  (53, 'Suruchi Food Catering', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Block 6,6103 panchavati apartment Pragathi Nagar,Kukatpali,Hydearabad', 'Restaurant supply store', NULL),
  (54, 'Baala\'s Caterers', '093981 95852', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '15-21-87/1', 'Caterer', '919398195852'),
  (55, 'VRV Home Foods(Veeramachaneni\'s)', '063090 36380', 'New', 'Google Forms', NULL, 0, 'https://chat.whatsapp.com/DwfEQdgv3cX4ye9Pp9VWar', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'G9MR+FX4', 'Caterer', '916309036380'),
  (56, 'anu caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'GC75+32C', 'Caterer', NULL),
  (57, 'Aum Foods', '062813 14370', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '4-32-326/C96', 'Caterer', '916281314370'),
  (58, 'Dwaraka Grand Veg & Non Veg Caterers', '091210 31499', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'S. No: 2, Bhavyas Anandam, Nizampet Rd, opp. Kamma Sangam', 'Caterer', '919121031499'),
  (59, 'Vijay Caterers', NULL, 'New', 'Google Forms', NULL, 0, 'https://www.instagram.com/vijaycaterers_?igsh=Y2p3NGNmdmhhOXU=&utm_source=qr', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Survey No: 484 & 492, beside Ashok Gardens', 'Caterer', NULL),
  (60, 'Lokshita Home Foods', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'KPHB 5th Phase', 'Caterer', NULL),
  (61, 'VHC Ram Caterers', NULL, 'New', 'Google Forms', NULL, 0, 'http://vhcramcaterers.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Road 9A', 'Caterer', NULL),
  (62, 'Aswini foods & caterers', '088853 02347', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Road no 5B', 'Catering food and drink supplier', '918885302347'),
  (63, 'Lotus Kitchen', '075490 10203', 'New', 'Google Forms', NULL, 0, 'https://lotuskitchen.co/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot no 99 & 100', 'Caterer', '917549010203'),
  (64, 'Sri Sai Catering & Tiffins', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'BLOCK-14, f5', 'Restaurant supply store', NULL),
  (65, 'Home\'s Kitchen: Corporate Catering Services and Wedding Catering', '087904 06852', 'New', 'Google Forms', NULL, 0, 'https://homeskitchen.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Road No. 26', 'Caterer', '918790406852'),
  (66, 'MOGHULS PARADIEZ RESTAURANT & BANQUET HALLS', '091001 24477', 'New', 'Google Forms', NULL, 0, 'https://moghulsparadiez.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '2nd floor, A-706, opp. to Metro Pillar No', 'Caterer', '919100124477'),
  (67, 'Royal Table Catering Services', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'F9MR+74V, KPHB 5th Phase', 'Catering food and drink supplier', NULL),
  (68, 'Sri Sai bhavitha food caters', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '5-5-33/V/16/A', 'Caterer', NULL),
  (69, 'Shree Dwaraka Caterers - Pure Veg.Only', '081211 75035', 'New', 'Google Forms', NULL, 0, 'http://wa.me/918121175035', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Flat No: 103, Neeladri Towers', 'Caterer', '918121175035'),
  (70, 'Srinivasa Tiffins Centre', '099634 36409', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot. 16-29-76/1, Rd Number 3, near NRI Junior Academy', 'Caterer', '919963436409'),
  (71, 'Vindu Caterers', '099126 25469', 'New', 'Google Forms', NULL, 0, 'https://newvinducaterershyd.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot no 132, 4th St', 'Caterer', '919912625469'),
  (72, 'SRI KRISHNA CATERERS & EVENTS', '091774 67957', 'New', 'Google Forms', NULL, 0, 'https://www.srikrishnacaterersandevents.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No: 5/C, Road No: 17A, Gopal Nagar, KPHP Colony, Hyderabad, 500072', 'Caterer', '919177467957'),
  (73, 'Annapurna Caterers', '098497 18809', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'PNR Residency, Plot 62, Chaitanya College Rd', 'Caterer', '919849718809'),
  (74, 'Bheeshma Catering Services', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Flat no 102, Hapkos cloud 9, Apartments, Cineplanet lane, near Runway 9', 'Caterer', NULL),
  (75, 'Venkateswara caterers & takeaway', '091008 49369', 'New', 'Google Forms', NULL, 0, 'https://www.instagram.com/stories/vct_pragathinagar/3595982067664216775?utm_source=ig_story_item_share&igsh=dHVvNTdqb2l0anU4', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Pragathi Nagar Rd, near green ridge apartments', 'Caterer', '919100849369'),
  (76, 'QUALITY FOODS', '099858 74541', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '2, Pragathi Nagar Rd', 'Caterer', '919985874541'),
  (77, 'AV Caterers and Events', '088970 02223', 'New', 'Google Forms', NULL, 0, 'http://www.avcaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Catering food and drink supplier', '918897002223'),
  (78, 'Padmavati Delux Mess', '097049 19144', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'FCV2+W7F', 'Restaurant', '919704919144'),
  (79, 'Vasavi Cloud Kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, 'Caterer', NULL),
  (80, 'Rama Catering', '098858 36012', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No 5', 'Caterer', '919885836012'),
  (81, 'Jaya Raghavendra aritaku bojanam', '099897 59990', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot no 3', 'Caterer', '919989759990'),
  (82, 'Amma Caterers', '081212 01417', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No 19/B, MMTS Rd', 'Caterer', '918121201417'),
  (83, 'sree venkateswara catering', '099493 12678', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'NRSA space colony', 'Caterer', '919949312678'),
  (84, 'THE HOME-SHANKER’s KITCHEN(Events & Catering Services)', '099666 96623', 'New', 'Google Forms', NULL, 0, 'http://www.thehomeshankerskitchen.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No 113, near Ring Road', 'Caterer', '919966696623'),
  (85, 'Lotus Caterers', '088850 10203', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No 99', 'Caterer', '918885010203'),
  (86, 'Hungry Kya / హంగ్రీ క్యా', NULL, 'New', 'Google Forms', NULL, 0, 'https://magicpin.in/Hyderabad/Kukatpally/Restaurant/Hungry-Kya/store/934892/?utm_source=gbp', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '57, HMT Sathavahana Nagar Rd', 'Family-friendly', NULL),
  (87, 'Prasanna Catering', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'H, 42-479/45', 'Caterer', NULL),
  (88, 'Trinetra cafe & restaurant', '091000 16663', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Addagutta cooperative society', 'Restaurant', '919100016663'),
  (89, 'Naga Mayuri Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Krishna Vani Nagar Colony, 2-1, 22/50/1', 'Caterer', NULL),
  (90, 'Vijaya Lakshmi Caterers', '099483 21138', 'New', 'Google Forms', NULL, 0, 'http://vijayalakshmicaterer.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '1-60/15, Plot no:15, Aditya Nagar, IDA Bollaram Road', 'Caterer', '919948321138'),
  (91, 'ME Home Foods(Cloud Kitchen & Catering)', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'G94X+W8M', 'Indian', NULL),
  (92, 'Siri Tea Point & Tiffin', '081420 49369', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Medak Road', 'Tiffin Service Provider', '918142049369'),
  (93, 'Jaya Chandra Tiffins', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Green Avenue, Plot No-3, Nizampet Rd', 'Breakfast', NULL),
  (94, 'Praveen catering services', '083416 78586', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Chintal, Hmt road, opp. Gilgal prayer house, near Tvr model school', 'Caterer', '918341678586'),
  (95, 'Talasila Caterers', '099926 84499', 'New', 'Google Forms', NULL, 0, 'http://www.talasilacaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '1/A, H.no-2-49', 'Caterer', '919992684499'),
  (96, 'Aastik Catering & Events', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No 03, Mumbai Highway Rd, nearby SAI Swagath Paradise', 'Caterer', NULL),
  (97, 'Vigneshwara tiffin center', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Takeaway serving classic snacks & meals', 'Breakfast', NULL),
  (98, 'Rishika events & caterers', '090001 81534', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Bhudevi Hills, Plot no-38/39, near Shivaji statute', 'Restaurant supply store', '919000181534'),
  (99, 'New Chillies Restaurant & Banquets', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, 'North Indian', NULL),
  (100, 'MAHA RUCHE', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '127/A ROAD NO 6 SAMATHA NAGAR, opp. JNTU', 'Restaurant supply store', NULL),
  (101, 'GODAVARI SPICE', '098493 83336', 'New', 'Google Forms', NULL, 0, 'http://www.rvgodavarispice.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No 286, Pragathi Nagar Rd', 'Restaurant', '919849383336'),
  (102, 'The Indian Plate : Catering : Pure Veg', '097401 57852', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'first floor, RR enclave, Plot No 231, part 232 survey no: 29 & 30 Flat No 102', 'Catering food and drink supplier', '919740157852'),
  (103, 'Platform 65 - The Train Theme Restaurant', '091541 31340', 'New', 'Google Forms', NULL, 0, 'https://platform65.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Andhra', '919154131340'),
  (104, 'Ongole vari shakahari bojanam(pure veg)', '073866 89099', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'MIG - 314, Road No. 4', 'Andhra', '917386689099'),
  (105, 'Ammaji Caterers', '084988 49964', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '4-40-214', 'Caterer', '918498849964'),
  (106, 'TRISHUL Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'FCX8+7PX', 'Caterer', NULL),
  (107, 'Tanmayee Event\'s and Catering Services', '062816 55618', 'New', 'Google Forms', NULL, 0, 'http://www.tanmayeecaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'H.no:, Railway Station, c3-285, near Chandanagar', 'Caterer', '916281655618'),
  (108, 'Kismis Shop Dry Fruits', '088979 24239', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Vasant Eye Care, 191a, JNTU Rd', 'Caterer', '918897924239'),
  (109, 'Prism Hospitality Services Pvt.Ltd.', '075759 90202', 'New', 'Google Forms', NULL, 0, 'http://prismhospitality.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '22/A, Mini Industrial Estate, Hafeezpet', 'Caterer', '917575990202'),
  (110, 'Shree Sai Caterers BN raju', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, 'Caterer', NULL),
  (111, 'Eat & Meet Catering Services', '083400 40015', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Railway Station, Plot No 38, Surabhi Colony Rd, near to Chanda Nagar', 'Restaurant supply store', '918340040015'),
  (112, 'Eruvaka Kitchen', '063090 97184', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Eruvaka Kitchen, Street, 10, Pragathi Nagar Rd', 'Catering food and drink supplier', '916309097184'),
  (113, 'Chaitanya Food court Nizampet', '099662 92888', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '2nd floor, GPR Multiplex, Nizampet Rd', 'Restaurant', '919966292888'),
  (114, 'DWARAKA GRAND', '063008 60692', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, 'Biryani', '916300860692'),
  (115, 'Sri Rudra\'s Caterings & Kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Road No 6C, Sumanth Sai Greenlands, Flat No 107, Praveen Kumar Gopagoni', 'Non Vegetarian Restaurant', NULL),
  (116, 'Abhiruchi Caterers', '090001 60619', 'New', 'Google Forms', NULL, 0, 'https://www.abhiruchicaterers.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Caterer', '919000160619'),
  (117, 'Vasista catering and Eventmanagement', '096036 71555', 'New', 'Google Forms', NULL, 0, 'http://www.vasistaevents.com/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'suchitra X Roads, opp. Arya Samaj', 'Caterer', '919603671555'),
  (118, 'Dikonda Caterers & Cooking Services', '073370 76649', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '·', 'Caterer', '917337076649'),
  (119, 'Bandhan Catering Services', '077290 96666', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Near, H.No: 1-57/187,Sriram Nagar Colony, Botanical Garden Rd', 'Restaurant supply store', '917729096666'),
  (120, 'Samosa catering', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'G94X+JVH', 'Bakery and Cake Shop', NULL),
  (121, 'SN Caterer\'s', '099491 00032', 'New', 'Google Forms', NULL, 0, 'https://sncaterers.com/about-us/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No: 6', 'Caterer', '919949100032'),
  (122, 'Teluginti Ruchulu', '083746 70325', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Plot No:246, MIG 2, Road, No:4, Near, Remedy Hospital Ln', 'Andhra', '918374670325'),
  (123, 'Finest Caterers', '096768 07424', 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'Old Airport Rd, near Balanagar vegitable Market', 'Tiffin Service Provider', '919676807424'),
  (124, 'Aathidyam catering', '078935 09021', 'New', 'Google Forms', NULL, 0, 'https://www.aathidyamcatering.in/', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, '115/1, 3-4, opposite D-Mart Lane', 'Catering food and drink supplier', '917893509021'),
  (125, 'Katyayani home caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'F9MG+MX3, 9th Phase Rd', 'Caterer', NULL),
  (126, 'Sree Harsha Caterers', '096401 69680', 'New', 'Google Forms', NULL, 0, 'https://sites.google.com/view/sree-harsha-caterers/home', NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, 'MIG - 44, Rd Number 1, opp. Global Eye Hospital', 'Restaurant', '919640169680'),
  (127, 'Unknown', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:09', '2026-04-12 10:15:09', 1, NULL, NULL, NULL),
  (128, 'Unknown', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, NULL, NULL, NULL),
  (129, 'Unknown', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, NULL, NULL, NULL),
  (130, 'Abhilasha Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, NULL, 'Caterer', NULL),
  (131, 'NAGA MAYURI CATERERS', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'lake', 'Catering food and drink supplier', NULL),
  (132, 'Master Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, '32-1721/3, Plot No.3 Sapthagiri Colony, Kukatpally Opp: Arekapudi Gandhi Residence Lane', 'Caterer', NULL),
  (133, 'Joshi\'s Me Kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Joshi\'s ME Kitchen Near Gram panchayat, Nizampet, Medchal - Malkajgiri, Telangana, 500072', 'Caterer', NULL),
  (134, 'Om Sree Sai Foods central kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'opp. to akshara international school', 'Caterer', NULL),
  (135, 'Suruchi Food Catering', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Block 6,6103 panchavati apartment Pragathi Nagar,Kukatpali,Hydearabad', 'Restaurant supply store', NULL),
  (136, 'anu caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'GC75+32C', 'Caterer', NULL),
  (137, 'Vijay Caterers', NULL, 'New', 'Google Forms', NULL, 0, 'https://www.instagram.com/vijaycaterers_?igsh=Y2p3NGNmdmhhOXU=&utm_source=qr', NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Survey No: 484 & 492, beside Ashok Gardens', 'Caterer', NULL),
  (138, 'Lokshita Home Foods', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'KPHB 5th Phase', 'Caterer', NULL),
  (139, 'VHC Ram Caterers', NULL, 'New', 'Google Forms', NULL, 0, 'http://vhcramcaterers.in/', NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Road 9A', 'Caterer', NULL),
  (140, 'Sri Sai Catering & Tiffins', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'BLOCK-14, f5', 'Restaurant supply store', NULL),
  (141, 'Royal Table Catering Services', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'F9MR+74V, KPHB 5th Phase', 'Catering food and drink supplier', NULL),
  (142, 'Sri Sai bhavitha food caters', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, '5-5-33/V/16/A', 'Caterer', NULL),
  (143, 'Bheeshma Catering Services', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Flat no 102, Hapkos cloud 9, Apartments, Cineplanet lane, near Runway 9', 'Caterer', NULL),
  (144, 'Vasavi Cloud Kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, NULL, 'Caterer', NULL),
  (145, 'Hungry Kya / హంగ్రీ క్యా', NULL, 'New', 'Google Forms', NULL, 0, 'https://magicpin.in/Hyderabad/Kukatpally/Restaurant/Hungry-Kya/store/934892/?utm_source=gbp', NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, '57, HMT Sathavahana Nagar Rd', 'Family-friendly', NULL),
  (146, 'Prasanna Catering', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'H, 42-479/45', 'Caterer', NULL),
  (147, 'Naga Mayuri Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Krishna Vani Nagar Colony, 2-1, 22/50/1', 'Caterer', NULL),
  (148, 'ME Home Foods(Cloud Kitchen & Catering)', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'G94X+W8M', 'Indian', NULL),
  (149, 'Jaya Chandra Tiffins', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Green Avenue, Plot No-3, Nizampet Rd', 'Breakfast', NULL),
  (150, 'Aastik Catering & Events', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Plot No 03, Mumbai Highway Rd, nearby SAI Swagath Paradise', 'Caterer', NULL),
  (151, 'Vigneshwara tiffin center', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Takeaway serving classic snacks & meals', 'Breakfast', NULL),
  (152, 'New Chillies Restaurant & Banquets', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, NULL, 'North Indian', NULL),
  (153, 'MAHA RUCHE', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, '127/A ROAD NO 6 SAMATHA NAGAR, opp. JNTU', 'Restaurant supply store', NULL),
  (154, 'TRISHUL Caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'FCX8+7PX', 'Caterer', NULL),
  (155, 'Shree Sai Caterers BN raju', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, NULL, 'Caterer', NULL),
  (156, 'Sri Rudra\'s Caterings & Kitchen', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'Road No 6C, Sumanth Sai Greenlands, Flat No 107, Praveen Kumar Gopagoni', 'Non Vegetarian Restaurant', NULL),
  (157, 'Samosa catering', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'G94X+JVH', 'Bakery and Cake Shop', NULL),
  (158, 'Katyayani home caterers', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, 'F9MG+MX3, 9th Phase Rd', 'Caterer', NULL),
  (159, 'Unknown', NULL, 'New', 'Google Forms', NULL, 0, NULL, NULL, '2026-04-12 10:15:26', '2026-04-12 10:15:26', 1, NULL, NULL, NULL);

-- --------------------------------------------------------
-- Table: `lead_campaigns`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `lead_campaigns`;
CREATE TABLE `lead_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `template` text DEFAULT NULL,
  `contactIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`contactIds`)),
  `sentIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sentIds`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `lead_campaigns`

-- --------------------------------------------------------
-- Table: `lead_templates`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `lead_templates`;
CREATE TABLE `lead_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `lead_templates`

-- --------------------------------------------------------
-- Table: `loans`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `loans`;
CREATE TABLE `loans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `loanCode` varchar(20) NOT NULL,
  `loanType` enum('Bank','Hand') NOT NULL,
  `lenderName` varchar(100) NOT NULL,
  `lenderPhone` varchar(15) DEFAULT NULL,
  `principalAmount` decimal(12,2) NOT NULL,
  `interestRate` decimal(5,2) NOT NULL,
  `interestPaymentType` enum('Monthly','EndOfTerm') NOT NULL DEFAULT 'Monthly',
  `repaymentType` enum('EMI','Custom') NOT NULL DEFAULT 'Custom',
  `tenureMonths` int(11) DEFAULT NULL,
  `startDate` date NOT NULL,
  `purpose` varchar(200) DEFAULT NULL,
  `bankAccountNo` varchar(30) DEFAULT NULL,
  `status` enum('Active','Closed') NOT NULL DEFAULT 'Active',
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `loanCode` (`loanCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `loans`

-- --------------------------------------------------------
-- Table: `loan_payments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `loan_payments`;
CREATE TABLE `loan_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `loanId` int(11) NOT NULL,
  `paymentDate` date NOT NULL,
  `principalAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `interestAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paymentMode` enum('Cash','Bank Transfer','PhonePe','Cheque') NOT NULL DEFAULT 'Cash',
  `paymentType` enum('EMI','InterestOnly','PrincipalOnly','Prepayment','FullSettlement') NOT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `loanId` (`loanId`),
  CONSTRAINT `loan_payments_ibfk_1` FOREIGN KEY (`loanId`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `loan_payments`

-- --------------------------------------------------------
-- Table: `payment_reconciliations`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `payment_reconciliations`;
CREATE TABLE `payment_reconciliations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) DEFAULT NULL,
  `expectedAmount` decimal(12,2) DEFAULT NULL,
  `receivedAmount` decimal(12,2) DEFAULT NULL,
  `reconciliationDate` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Pending','Reconciled','Mismatch') DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `payment_reconciliations`

-- --------------------------------------------------------
-- Table: `payment_reminders`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `payment_reminders`;
CREATE TABLE `payment_reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) DEFAULT NULL,
  `customerId` int(11) DEFAULT NULL,
  `reminderDate` date DEFAULT NULL,
  `status` enum('Pending','Notified','Completed') DEFAULT 'Pending',
  `notifiedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `payment_reminders`

-- --------------------------------------------------------
-- Table: `payroll`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `payroll`;
CREATE TABLE `payroll` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workerId` int(11) NOT NULL,
  `payrollMonth` int(11) NOT NULL COMMENT '1-12',
  `payrollYear` int(11) NOT NULL,
  `presentDays` int(11) DEFAULT 0,
  `halfDays` int(11) DEFAULT 0,
  `absentDays` int(11) DEFAULT 0,
  `overtimeHours` decimal(6,2) DEFAULT 0.00,
  `basicSalary` decimal(10,2) DEFAULT 0.00,
  `overtimePay` decimal(10,2) DEFAULT 0.00,
  `bonus` decimal(10,2) DEFAULT 0.00,
  `deductions` decimal(10,2) DEFAULT 0.00,
  `advanceDeduction` decimal(10,2) DEFAULT 0.00,
  `netSalary` decimal(10,2) DEFAULT 0.00,
  `paymentMode` enum('Cash','UPI','Bank Transfer') DEFAULT 'Cash',
  `paymentDate` date DEFAULT NULL,
  `status` enum('Draft','Paid') DEFAULT 'Draft',
  `notes` varchar(255) DEFAULT NULL,
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_worker_month` (`workerId`,`payrollMonth`,`payrollYear`),
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`workerId`) REFERENCES `workers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `payroll` : 1 row(s)
INSERT INTO `payroll` (`id`, `workerId`, `payrollMonth`, `payrollYear`, `presentDays`, `halfDays`, `absentDays`, `overtimeHours`, `basicSalary`, `overtimePay`, `bonus`, `deductions`, `advanceDeduction`, `netSalary`, `paymentMode`, `paymentDate`, `status`, `notes`, `createdBy`, `createdAt`, `updatedAt`) VALUES
  (1, 9, 4, 2026, 0, 0, 0, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 'Cash', '2026-04-10 18:30:00', 'Paid', NULL, 1, '2026-04-11 17:07:15', '2026-04-11 17:07:31');

-- --------------------------------------------------------
-- Table: `processing_batches`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `processing_batches`;
CREATE TABLE `processing_batches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batchNumber` varchar(50) NOT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `rawInputQuantity` decimal(10,2) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `grade` varchar(100) DEFAULT NULL,
  `finishedGrade` varchar(100) DEFAULT NULL,
  `status` enum('In Progress','Completed','Cancelled') DEFAULT 'In Progress',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `wastage` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `batchNumber` (`batchNumber`),
  KEY `batchNumber_2` (`batchNumber`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `processing_batches` : 5 row(s)
INSERT INTO `processing_batches` (`id`, `batchNumber`, `startDate`, `endDate`, `rawInputQuantity`, `quantity`, `grade`, `finishedGrade`, `status`, `createdAt`, `updatedAt`, `createdBy`, `wastage`) VALUES
  (7, 'BATCH-0001', '2026-04-04 18:30:00', NULL, '500.00', '99.98', 'RWA', 'Full Kaju', 'Completed', '2026-04-05 12:05:11', '2026-04-05 12:25:25', 1, '0.00'),
  (8, 'BATCH-0002', '2026-04-04 18:30:00', NULL, '5000.00', '100.00', 'White', 'Full Kaju', 'Completed', '2026-04-05 12:05:37', '2026-04-05 12:26:15', 1, '0.00'),
  (9, 'BATCH-0003', '2026-04-11 18:30:00', NULL, '500.00', '400.00', 'White', 'Full Kaju, Split Kaju, 4 Pieces, 8 Pieces, Chura', 'Completed', '2026-04-12 12:10:06', '2026-04-20 17:38:43', 1, '99.98'),
  (10, 'BATCH-0004', '2026-04-19 18:30:00', NULL, '100.00', '0.00', 'White', NULL, 'In Progress', '2026-04-20 16:23:01', '2026-04-20 16:23:01', 1, '0.00'),
  (11, 'BATCH-0005', '2026-04-19 18:30:00', NULL, '499.99', '0.00', 'RWA', NULL, 'In Progress', '2026-04-20 16:47:51', '2026-04-20 16:47:51', 1, '0.00');

-- --------------------------------------------------------
-- Table: `raw_purchases`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `raw_purchases`;
CREATE TABLE `raw_purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplierId` int(11) NOT NULL,
  `purchaseDate` date NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `ratePerUnit` decimal(10,2) NOT NULL,
  `totalAmount` decimal(12,2) NOT NULL,
  `grade` varchar(100) DEFAULT NULL,
  `moisture` decimal(5,2) DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `fundedByLoanId` int(11) DEFAULT NULL,
  `fundedByLoanCode` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supplierId` (`supplierId`),
  KEY `purchaseDate` (`purchaseDate`),
  CONSTRAINT `raw_purchases_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `raw_purchases` : 3 row(s)
INSERT INTO `raw_purchases` (`id`, `supplierId`, `purchaseDate`, `quantity`, `ratePerUnit`, `totalAmount`, `grade`, `moisture`, `weight`, `notes`, `createdAt`, `updatedAt`, `createdBy`, `fundedByLoanId`, `fundedByLoanCode`) VALUES
  (7, 8, '2026-04-03 18:30:00', '90.00', '150.00', '13500.00', 'Premium', NULL, NULL, NULL, '2026-04-04 19:57:53', '2026-04-04 19:57:53', 1, NULL, NULL),
  (8, 8, '2026-04-03 18:30:00', '90.00', '162.00', '14580.00', 'Premium', NULL, NULL, NULL, '2026-04-04 19:58:31', '2026-04-04 19:58:31', 1, NULL, NULL),
  (9, 9, '2026-04-12 18:30:00', '80.00', '1350.00', '108000.00', 'Premium', NULL, NULL, 'Narsipatnam', '2026-04-13 12:54:25', '2026-04-20 18:50:53', 1, NULL, NULL);

-- --------------------------------------------------------
-- Table: `raw_purchase_payments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `raw_purchase_payments`;
CREATE TABLE `raw_purchase_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rawPurchaseId` int(11) NOT NULL,
  `paymentDate` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentMode` enum('Cash','Cheque','Bank Transfer','UPI') NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `paymentDate` (`paymentDate`),
  KEY `rawPurchaseId` (`rawPurchaseId`),
  CONSTRAINT `raw_purchase_payments_ibfk_1` FOREIGN KEY (`rawPurchaseId`) REFERENCES `raw_purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for `raw_purchase_payments` : 1 row(s)
INSERT INTO `raw_purchase_payments` (`id`, `rawPurchaseId`, `paymentDate`, `amount`, `paymentMode`, `reference`, `notes`, `createdBy`, `createdAt`, `updatedAt`) VALUES
  (1, 9, '2026-04-12 18:30:00', '50000.00', 'Cash', NULL, NULL, 1, '2026-04-13 12:54:25', '2026-04-13 12:54:25');

-- --------------------------------------------------------
-- Table: `sales_orders`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `sales_orders`;
CREATE TABLE `sales_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `salesOrderId` varchar(50) NOT NULL,
  `customerId` int(11) NOT NULL,
  `orderDate` date DEFAULT NULL,
  `productGrade` varchar(100) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `ratePerUnit` decimal(10,2) DEFAULT NULL,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `deliveryDate` date DEFAULT NULL,
  `paymentType` varchar(30) DEFAULT 'Cash',
  `status` enum('Pending','Delivered','Partial','Cancelled') DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `salesOrderId` (`salesOrderId`),
  KEY `salesOrderId_2` (`salesOrderId`),
  KEY `customerId` (`customerId`),
  KEY `status` (`status`),
  CONSTRAINT `sales_orders_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `sales_orders` : 2 row(s)
INSERT INTO `sales_orders` (`id`, `salesOrderId`, `customerId`, `orderDate`, `productGrade`, `quantity`, `ratePerUnit`, `totalAmount`, `deliveryDate`, `paymentType`, `status`, `notes`, `createdAt`, `updatedAt`, `createdBy`) VALUES
  (4, 'SO-2026-001', 11, '2026-04-19 18:30:00', 'Full Kaju, Split Kaju', '30.00', '766.67', '23000.00', NULL, 'Cash', 'Pending', NULL, '2026-04-20 17:51:06', '2026-04-20 17:51:06', 1),
  (5, 'SO-2026-002', 11, '2026-04-19 18:30:00', 'Full Kaju', '10.00', '500.00', '5000.00', NULL, 'Cash', 'Pending', NULL, '2026-04-20 18:06:04', '2026-04-20 18:06:04', 1);

-- --------------------------------------------------------
-- Table: `sales_payments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `sales_payments`;
CREATE TABLE `sales_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `salesOrderId` int(11) NOT NULL,
  `paymentDate` date DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `paymentMode` enum('Cash','Cheque','Bank Transfer','UPI') NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `salesOrderId` (`salesOrderId`),
  KEY `paymentDate` (`paymentDate`),
  CONSTRAINT `sales_payments_ibfk_1` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `sales_payments` : 2 row(s)
INSERT INTO `sales_payments` (`id`, `salesOrderId`, `paymentDate`, `amount`, `paymentMode`, `reference`, `notes`, `createdAt`, `createdBy`) VALUES
  (3, 4, '2026-04-19 18:30:00', '23000.00', 'Cash', NULL, 'Auto-recorded from sales order', '2026-04-20 17:51:06', 1),
  (4, 5, '2026-04-19 18:30:00', '5000.00', 'Cash', NULL, 'Auto-recorded from sales order', '2026-04-20 18:06:04', 1);

-- --------------------------------------------------------
-- Table: `seasons`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `seasons`;
CREATE TABLE `seasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `targetProcurementKg` decimal(12,2) DEFAULT 0.00,
  `targetRevenueAmount` decimal(12,2) DEFAULT 0.00,
  `budgetAmount` decimal(12,2) DEFAULT 0.00,
  `expectedWorkers` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `status` enum('Planned','Active','Completed','Cancelled') DEFAULT 'Planned',
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No data in `seasons`

-- --------------------------------------------------------
-- Table: `stock_adjustments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `stock_adjustments`;
CREATE TABLE `stock_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grade` varchar(100) DEFAULT NULL,
  `adjustmentType` enum('Issue','Damage') NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `dateAdded` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `approvedBy` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `grade` (`grade`),
  KEY `adjustmentType` (`adjustmentType`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `stock_adjustments` : 4 row(s)
INSERT INTO `stock_adjustments` (`id`, `grade`, `adjustmentType`, `quantity`, `dateAdded`, `reason`, `approvedBy`, `createdAt`, `createdBy`) VALUES
  (1, 'Full Kaju', 'Damage', '10.00', NULL, 'ws', NULL, '2026-04-05 12:44:21', 1),
  (2, 'Split Kaju', 'Damage', '10.00', NULL, 'd', NULL, '2026-04-05 12:45:26', 1),
  (3, 'Full Kaju', 'Damage', '10.00', NULL, 'damage', NULL, '2026-04-20 17:45:54', 1),
  (4, '4 Pieces', 'Damage', '10.00', NULL, 'damag', NULL, '2026-04-20 17:46:25', 1);

-- --------------------------------------------------------
-- Table: `suppliers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplierId` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contactPerson` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplierId` (`supplierId`),
  KEY `supplierId_2` (`supplierId`),
  KEY `isActive` (`isActive`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `suppliers` : 3 row(s)
INSERT INTO `suppliers` (`id`, `supplierId`, `name`, `contactPerson`, `phone`, `area`, `address`, `notes`, `isActive`, `createdAt`, `updatedAt`, `createdBy`, `isDeleted`) VALUES
  (7, 'test-supplier-1775332373443', 'Test Supplier', '9876543210', '9876543210', 'Test Area', 'Test Area', NULL, 1, '2026-04-04 19:52:53', '2026-04-04 19:52:53', 1, 0),
  (8, 'naresh-1775332567173', 'Naresh', '9000728565', '9000728565', 'Hyderabad', 'Hyderabad', NULL, 1, '2026-04-04 19:56:07', '2026-04-04 19:56:07', 1, 0),
  (9, 'nookaraju-1776084662684', 'Nookaraju', '9058745128', '9058745128', 'Narsipatnam', 'Narsipatnam', NULL, 1, '2026-04-13 12:51:02', '2026-04-13 12:51:02', 1, 0);

-- --------------------------------------------------------
-- Table: `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Manager','User') DEFAULT 'User',
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `username_2` (`username`),
  KEY `role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `users` : 5 row(s)
INSERT INTO `users` (`id`, `name`, `email`, `username`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`, `createdBy`) VALUES
  (1, 'Admin User', 'admin@svr.com', 'admin', '$2a$10$4AUmMH0oDSOcR0wHWqwGvOCbFEGSQ8ULfzwGAmbELMqx/u8ug7ITa', 'Admin', 1, '2026-04-04 17:09:18', '2026-04-04 17:44:42', 1),
  (2, 'Manager User', 'manager@svr.com', 'manager', '$2a$10$YwaVS68Ntj17NGub0Wyvf.4fReL4o0vXLWX/J19SjSoXot6AhxVxO', 'Manager', 1, '2026-04-04 17:09:18', '2026-04-04 17:09:18', 1),
  (5, 'Owner', 'owner@svr.com', 'owner', '$2a$10$nB/TuoZ91hILun4QUXwH5uz7avxzFFsA1oZg/3/5t7zrEq25/Ctc2', 'User', 1, '2026-04-04 19:46:43', '2026-04-04 19:47:36', 1),
  (10, 'Supervisor', 'supervisor@svr.com', 'supervisor', '$2a$10$381gZftVgnYYqlvLt2nvNepmL5WmSful5YwdCy3cIUnE0LDEMI5mG', 'User', 1, '2026-04-04 19:46:43', '2026-04-04 19:47:36', 1),
  (11, 'Accountant', 'accountant@svr.com', 'accountant', '$2a$10$xZpZfk4.52bRuHdTEy7IJ.xOZv3HJx7rHk1gmFJ5dNYmNdyCTa/iS', 'User', 1, '2026-04-04 19:46:43', '2026-04-04 19:47:36', 1);

-- --------------------------------------------------------
-- Table: `workers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `workers`;
CREATE TABLE `workers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workerId` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `fatherName` varchar(255) DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `areaOfWork` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive','On Leave') DEFAULT 'Active',
  `dailyWages` decimal(10,2) DEFAULT NULL,
  `monthlyWages` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `workerId` (`workerId`),
  KEY `workerId_2` (`workerId`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `workers` : 3 row(s)
INSERT INTO `workers` (`id`, `workerId`, `name`, `fatherName`, `dateOfBirth`, `mobileNumber`, `areaOfWork`, `status`, `dailyWages`, `monthlyWages`, `notes`, `createdAt`, `updatedAt`, `createdBy`) VALUES
  (9, 'W0001', 'Naresh work d', NULL, NULL, '9000728565', 'Permanent', 'Active', '0.00', '0.00', NULL, '2026-04-05 11:22:41', '2026-04-13 04:40:40', 1),
  (11, 'W0002', 'P Swami', NULL, NULL, '9177513835', 'Permanent', 'Active', '0.00', '0.00', NULL, '2026-04-12 12:49:07', '2026-04-13 04:40:38', 1),
  (12, 'W0003', 'P kondababu', NULL, NULL, '9849137929', 'Permanent', 'Active', '0.00', '0.00', NULL, '2026-04-12 12:50:19', '2026-04-13 04:40:41', 1);

-- --------------------------------------------------------
-- Table: `worker_advances`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `worker_advances`;
CREATE TABLE `worker_advances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workerId` int(11) NOT NULL,
  `advanceDate` date DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Settled','Cancelled') DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `workerId` (`workerId`),
  KEY `status` (`status`),
  CONSTRAINT `worker_advances_ibfk_1` FOREIGN KEY (`workerId`) REFERENCES `workers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `worker_advances` : 1 row(s)
INSERT INTO `worker_advances` (`id`, `workerId`, `advanceDate`, `amount`, `reason`, `status`, `createdAt`, `updatedAt`, `createdBy`) VALUES
  (3, 9, '2026-04-04 18:30:00', '500.00', 'cash given', 'Approved', '2026-04-05 12:02:16', '2026-04-05 12:02:16', 1);

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================
-- Backup summary
--   Tables  : 36
--   Total rows : 259
--   Completed  : 2026-04-20T18:59:47.378Z
-- ============================================================