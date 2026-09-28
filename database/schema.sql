-- ========================================================
-- ContractWatch — Database Schema (MySQL 8.0+)
-- Contract Renewal Reminder Tracker
-- Java + DBMS Evaluation / Enterprise Project
-- ========================================================

CREATE DATABASE IF NOT EXISTS contractwatch
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE contractwatch;

-- Drop tables in reverse order of foreign key dependency
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS renewal_decisions;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS vendors;

-- ========================================================
-- 1. Table: vendors
-- Stores third-party vendor / supplier master details
-- ========================================================
CREATE TABLE vendors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    company_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_vendor_name UNIQUE (name),
    INDEX idx_vendors_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- 2. Table: contracts
-- Stores enterprise contracts with renewal metadata
-- ========================================================
CREATE TABLE contracts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    vendor_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    renewal_notice_days INT NOT NULL DEFAULT 30,
    renewal_review_date DATE NOT NULL,
    contract_value DECIMAL(14, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    document_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_contract_number UNIQUE (contract_number),
    CONSTRAINT fk_contracts_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors(id) ON DELETE RESTRICT,
    CONSTRAINT chk_contract_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_notice_days CHECK (renewal_notice_days >= 0),
    CONSTRAINT chk_contract_value CHECK (contract_value >= 0),
    CONSTRAINT chk_contract_status CHECK (status IN ('ACTIVE', 'RENEWAL_DUE', 'RENEWED', 'TERMINATED', 'EXPIRED')),

    INDEX idx_contracts_vendor_id (vendor_id),
    INDEX idx_contracts_status (status),
    INDEX idx_contracts_end_date (end_date),
    INDEX idx_contracts_review_date (renewal_review_date),
    INDEX idx_contracts_status_review (status, renewal_review_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- 3. Table: renewal_decisions
-- Audit log and record of all renewal actions taken
-- ========================================================
CREATE TABLE renewal_decisions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    decision VARCHAR(30) NOT NULL,
    decision_date DATE NOT NULL,
    decided_by VARCHAR(100) NOT NULL,
    notes TEXT,
    new_end_date DATE,
    new_value DECIMAL(14, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_decisions_contract FOREIGN KEY (contract_id) 
        REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT chk_decision_type CHECK (decision IN ('RENEWED', 'TERMINATED', 'EXPIRED')),

    INDEX idx_decisions_contract_id (contract_id),
    INDEX idx_decisions_decision (decision),
    INDEX idx_decisions_date (decision_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- 4. Table: notifications
-- In-app alert queue for contracts reaching renewal review
-- ========================================================
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_contract FOREIGN KEY (contract_id) 
        REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT chk_notification_type CHECK (type IN ('RENEWAL_DUE', 'EXPIRED', 'ACTION_REQUIRED', 'INFO')),

    INDEX idx_notifications_contract_id (contract_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
