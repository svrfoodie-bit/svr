-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 04, 2026 at 10:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `svr_cashew_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
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
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_work`
--

CREATE TABLE `daily_work` (
  `id` int(11) NOT NULL,
  `workerId` int(11) NOT NULL,
  `workDate` date NOT NULL,
  `workType` varchar(50) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `bonusEligible` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `expenseCode` varchar(50) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `paymentMode` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finished_goods_stock`
--

CREATE TABLE `finished_goods_stock` (
  `id` int(11) NOT NULL,
  `batchId` int(11) DEFAULT NULL,
  `grade` varchar(100) NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `dateAdded` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_work`
--

CREATE TABLE `job_work` (
  `id` int(11) NOT NULL,
  `jobWorkId` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `vendorName` varchar(255) DEFAULT NULL,
  `vendorPhone` varchar(20) DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `quantityIn` decimal(10,2) DEFAULT NULL,
  `quantityOut` decimal(10,2) DEFAULT NULL,
  `ratePerUnit` decimal(10,2) DEFAULT NULL,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `status` enum('In Progress','Completed','Cancelled') DEFAULT 'In Progress',
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_work_payments`
--

CREATE TABLE `job_work_payments` (
  `id` int(11) NOT NULL,
  `jobWorkId` int(11) NOT NULL,
  `paymentDate` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentMode` enum('Cash','Cheque','Bank Transfer','UPI') NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
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
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_campaigns`
--

CREATE TABLE `lead_campaigns` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_templates`
--

CREATE TABLE `lead_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_reconciliations`
--

CREATE TABLE `payment_reconciliations` (
  `id` int(11) NOT NULL,
  `orderId` int(11) DEFAULT NULL,
  `expectedAmount` decimal(12,2) DEFAULT NULL,
  `receivedAmount` decimal(12,2) DEFAULT NULL,
  `reconciliationDate` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Pending','Reconciled','Mismatch') DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_reminders`
--

CREATE TABLE `payment_reminders` (
  `id` int(11) NOT NULL,
  `orderId` int(11) DEFAULT NULL,
  `customerId` int(11) DEFAULT NULL,
  `reminderDate` date DEFAULT NULL,
  `status` enum('Pending','Notified','Completed') DEFAULT 'Pending',
  `notifiedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `processing_batches`
--

CREATE TABLE `processing_batches` (
  `id` int(11) NOT NULL,
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
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `raw_purchases`
--

CREATE TABLE `raw_purchases` (
  `id` int(11) NOT NULL,
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
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `raw_purchases`
--

INSERT INTO `raw_purchases` (`id`, `supplierId`, `purchaseDate`, `quantity`, `ratePerUnit`, `totalAmount`, `grade`, `moisture`, `weight`, `notes`, `createdAt`, `updatedAt`, `createdBy`) VALUES
(7, 8, '2026-04-04', 90.00, 150.00, 13500.00, 'Premium', NULL, NULL, NULL, '2026-04-04 19:57:53', '2026-04-04 19:57:53', 1),
(8, 8, '2026-04-04', 90.00, 162.00, 14580.00, 'Premium', NULL, NULL, NULL, '2026-04-04 19:58:31', '2026-04-04 19:58:31', 1);

-- --------------------------------------------------------

--
-- Table structure for table `raw_purchase_payments`
--

CREATE TABLE `raw_purchase_payments` (
  `id` int(11) NOT NULL,
  `rawPurchaseId` int(11) NOT NULL,
  `paymentDate` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paymentMode` enum('Cash','Cheque','Bank Transfer','UPI') NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_orders`
--

CREATE TABLE `sales_orders` (
  `id` int(11) NOT NULL,
  `salesOrderId` varchar(50) NOT NULL,
  `customerId` int(11) NOT NULL,
  `productGrade` varchar(100) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `ratePerUnit` decimal(10,2) DEFAULT NULL,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `deliveryDate` date DEFAULT NULL,
  `status` enum('Pending','Delivered','Partial','Cancelled') DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_payments`
--

CREATE TABLE `sales_payments` (
  `id` int(11) NOT NULL,
  `salesOrderId` int(11) NOT NULL,
  `paymentDate` date DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `paymentMode` enum('Cash','Cheque','Bank Transfer','UPI') NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustments`
--

CREATE TABLE `stock_adjustments` (
  `id` int(11) NOT NULL,
  `grade` varchar(100) DEFAULT NULL,
  `adjustmentType` enum('Issue','Damage') NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
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
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `supplierId`, `name`, `contactPerson`, `phone`, `area`, `address`, `notes`, `isActive`, `createdAt`, `updatedAt`, `createdBy`) VALUES
(7, 'test-supplier-1775332373443', 'Test Supplier', '9876543210', '9876543210', 'Test Area', 'Test Area', NULL, 1, '2026-04-04 19:52:53', '2026-04-04 19:52:53', 1),
(8, 'naresh-1775332567173', 'Naresh', '9000728565', '9000728565', 'Hyderabad', 'Hyderabad', NULL, 1, '2026-04-04 19:56:07', '2026-04-04 19:56:07', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Manager','User') DEFAULT 'User',
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `username`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`, `createdBy`) VALUES
(1, 'Admin User', 'admin@svr.com', 'admin', '$2a$10$4AUmMH0oDSOcR0wHWqwGvOCbFEGSQ8ULfzwGAmbELMqx/u8ug7ITa', 'Admin', 1, '2026-04-04 17:09:18', '2026-04-04 17:44:42', 1),
(2, 'Manager User', 'manager@svr.com', 'manager', '$2a$10$YwaVS68Ntj17NGub0Wyvf.4fReL4o0vXLWX/J19SjSoXot6AhxVxO', 'Manager', 1, '2026-04-04 17:09:18', '2026-04-04 17:09:18', 1),
(5, 'Owner', 'owner@svr.com', 'owner', '$2a$10$nB/TuoZ91hILun4QUXwH5uz7avxzFFsA1oZg/3/5t7zrEq25/Ctc2', 'User', 1, '2026-04-04 19:46:43', '2026-04-04 19:47:36', 1),
(10, 'Supervisor', 'supervisor@svr.com', 'supervisor', '$2a$10$381gZftVgnYYqlvLt2nvNepmL5WmSful5YwdCy3cIUnE0LDEMI5mG', 'User', 1, '2026-04-04 19:46:43', '2026-04-04 19:47:36', 1),
(11, 'Accountant', 'accountant@svr.com', 'accountant', '$2a$10$xZpZfk4.52bRuHdTEy7IJ.xOZv3HJx7rHk1gmFJ5dNYmNdyCTa/iS', 'User', 1, '2026-04-04 19:46:43', '2026-04-04 19:47:36', 1);

-- --------------------------------------------------------

--
-- Table structure for table `workers`
--

CREATE TABLE `workers` (
  `id` int(11) NOT NULL,
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
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `worker_advances`
--

CREATE TABLE `worker_advances` (
  `id` int(11) NOT NULL,
  `workerId` int(11) NOT NULL,
  `advanceDate` date DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Settled','Cancelled') DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customerId` (`customerId`),
  ADD KEY `customerId_2` (`customerId`),
  ADD KEY `type` (`type`),
  ADD KEY `isActive` (`isActive`);

--
-- Indexes for table `daily_work`
--
ALTER TABLE `daily_work`
  ADD PRIMARY KEY (`id`),
  ADD KEY `workerId` (`workerId`),
  ADD KEY `workDate` (`workDate`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category` (`category`),
  ADD KEY `date` (`date`);

--
-- Indexes for table `finished_goods_stock`
--
ALTER TABLE `finished_goods_stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batchId` (`batchId`),
  ADD KEY `grade` (`grade`),
  ADD KEY `dateAdded` (`dateAdded`);

--
-- Indexes for table `job_work`
--
ALTER TABLE `job_work`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `jobWorkId` (`jobWorkId`),
  ADD KEY `jobWorkId_2` (`jobWorkId`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `job_work_payments`
--
ALTER TABLE `job_work_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paymentDate` (`paymentDate`),
  ADD KEY `jobWorkId` (`jobWorkId`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `phone` (`phone`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `lead_campaigns`
--
ALTER TABLE `lead_campaigns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lead_templates`
--
ALTER TABLE `lead_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_reconciliations`
--
ALTER TABLE `payment_reconciliations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_reminders`
--
ALTER TABLE `payment_reminders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `processing_batches`
--
ALTER TABLE `processing_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `batchNumber` (`batchNumber`),
  ADD KEY `batchNumber_2` (`batchNumber`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `raw_purchases`
--
ALTER TABLE `raw_purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplierId` (`supplierId`),
  ADD KEY `purchaseDate` (`purchaseDate`);

--
-- Indexes for table `raw_purchase_payments`
--
ALTER TABLE `raw_purchase_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paymentDate` (`paymentDate`),
  ADD KEY `rawPurchaseId` (`rawPurchaseId`);

--
-- Indexes for table `sales_orders`
--
ALTER TABLE `sales_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `salesOrderId` (`salesOrderId`),
  ADD KEY `salesOrderId_2` (`salesOrderId`),
  ADD KEY `customerId` (`customerId`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `sales_payments`
--
ALTER TABLE `sales_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `salesOrderId` (`salesOrderId`),
  ADD KEY `paymentDate` (`paymentDate`);

--
-- Indexes for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grade` (`grade`),
  ADD KEY `adjustmentType` (`adjustmentType`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `supplierId` (`supplierId`),
  ADD KEY `supplierId_2` (`supplierId`),
  ADD KEY `isActive` (`isActive`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `username_2` (`username`),
  ADD KEY `role` (`role`);

--
-- Indexes for table `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `workerId` (`workerId`),
  ADD KEY `workerId_2` (`workerId`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `worker_advances`
--
ALTER TABLE `worker_advances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `workerId` (`workerId`),
  ADD KEY `status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `daily_work`
--
ALTER TABLE `daily_work`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `finished_goods_stock`
--
ALTER TABLE `finished_goods_stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `job_work`
--
ALTER TABLE `job_work`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `job_work_payments`
--
ALTER TABLE `job_work_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `lead_campaigns`
--
ALTER TABLE `lead_campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lead_templates`
--
ALTER TABLE `lead_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_reconciliations`
--
ALTER TABLE `payment_reconciliations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_reminders`
--
ALTER TABLE `payment_reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `processing_batches`
--
ALTER TABLE `processing_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `raw_purchases`
--
ALTER TABLE `raw_purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `raw_purchase_payments`
--
ALTER TABLE `raw_purchase_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_orders`
--
ALTER TABLE `sales_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sales_payments`
--
ALTER TABLE `sales_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `workers`
--
ALTER TABLE `workers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `worker_advances`
--
ALTER TABLE `worker_advances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `daily_work`
--
ALTER TABLE `daily_work`
  ADD CONSTRAINT `daily_work_ibfk_1` FOREIGN KEY (`workerId`) REFERENCES `workers` (`id`);

--
-- Constraints for table `finished_goods_stock`
--
ALTER TABLE `finished_goods_stock`
  ADD CONSTRAINT `finished_goods_stock_ibfk_1` FOREIGN KEY (`batchId`) REFERENCES `processing_batches` (`id`);

--
-- Constraints for table `job_work_payments`
--
ALTER TABLE `job_work_payments`
  ADD CONSTRAINT `job_work_payments_ibfk_1` FOREIGN KEY (`jobWorkId`) REFERENCES `job_work` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `raw_purchases`
--
ALTER TABLE `raw_purchases`
  ADD CONSTRAINT `raw_purchases_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `raw_purchase_payments`
--
ALTER TABLE `raw_purchase_payments`
  ADD CONSTRAINT `raw_purchase_payments_ibfk_1` FOREIGN KEY (`rawPurchaseId`) REFERENCES `raw_purchases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales_orders`
--
ALTER TABLE `sales_orders`
  ADD CONSTRAINT `sales_orders_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`);

--
-- Constraints for table `sales_payments`
--
ALTER TABLE `sales_payments`
  ADD CONSTRAINT `sales_payments_ibfk_1` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders` (`id`);

--
-- Constraints for table `worker_advances`
--
ALTER TABLE `worker_advances`
  ADD CONSTRAINT `worker_advances_ibfk_1` FOREIGN KEY (`workerId`) REFERENCES `workers` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
