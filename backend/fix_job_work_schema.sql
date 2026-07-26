-- Fix the job_work table to match frontend expectations
ALTER TABLE job_work 
DROP COLUMN jobWorkId,
DROP COLUMN description,
DROP COLUMN vendorName,
DROP COLUMN vendorPhone,
DROP COLUMN quantityIn,
DROP COLUMN quantityOut,
DROP COLUMN ratePerUnit,
DROP COLUMN totalAmount,
ADD COLUMN jobDate DATE NOT NULL AFTER id,
ADD COLUMN jobWorkerName VARCHAR(255) NOT NULL AFTER jobDate,
ADD COLUMN cashewType VARCHAR(50) NOT NULL DEFAULT 'Premium' AFTER jobWorkerName,
ADD COLUMN quantitySent DECIMAL(10,2) NOT NULL AFTER cashewType,
ADD COLUMN quantityReceived DECIMAL(10,2) NOT NULL AFTER quantityReceived,
ADD COLUMN ratePerKg DECIMAL(10,2) NOT NULL AFTER quantityReceived,
ADD COLUMN remarks TEXT AFTER ratePerKg;

DESCRIBE job_work;
