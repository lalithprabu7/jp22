-- ========================================================
-- ContractWatch — Advanced Analytical SQL Queries
-- Designed for Java + DBMS Evaluation / Assessment
-- Demonstrates: CTEs, Window Functions, Complex JOINs,
-- Aggregations, Date Arithmetic, and Analytical Metrics.
-- ========================================================

USE contractwatch;

-- --------------------------------------------------------
-- QUERY 1: Contracts Nearing Expiration (Urgency Ranking)
-- Categorizes urgency into 'CRITICAL', 'HIGH', 'MEDIUM', 'STABLE'
-- --------------------------------------------------------
SELECT 
    c.id,
    c.contract_number,
    c.title,
    v.name AS vendor_name,
    c.end_date,
    c.renewal_review_date,
    DATEDIFF(c.end_date, CURDATE()) AS days_until_expiration,
    DATEDIFF(c.renewal_review_date, CURDATE()) AS days_until_review,
    CASE 
        WHEN DATEDIFF(c.end_date, CURDATE()) < 0 THEN 'EXPIRED'
        WHEN DATEDIFF(c.end_date, CURDATE()) <= 15 THEN 'CRITICAL'
        WHEN DATEDIFF(c.end_date, CURDATE()) <= 30 THEN 'HIGH'
        WHEN DATEDIFF(c.renewal_review_date, CURDATE()) <= 0 THEN 'RENEWAL_WINDOW_OPEN'
        ELSE 'STABLE'
    END AS urgency_level,
    c.contract_value
FROM contracts c
JOIN vendors v ON c.vendor_id = v.id
WHERE c.status IN ('ACTIVE', 'RENEWAL_DUE')
ORDER BY c.end_date ASC;

-- --------------------------------------------------------
-- QUERY 2: Total Financial Exposure by Vendor
-- Aggregate spending, contract count, and average contract size
-- --------------------------------------------------------
SELECT 
    v.id AS vendor_id,
    v.name AS vendor_name,
    COUNT(c.id) AS total_contracts,
    SUM(CASE WHEN c.status IN ('ACTIVE', 'RENEWAL_DUE') THEN 1 ELSE 0 END) AS active_contracts,
    COALESCE(SUM(c.contract_value), 0.00) AS total_committed_value,
    COALESCE(SUM(CASE WHEN c.status IN ('ACTIVE', 'RENEWAL_DUE') THEN c.contract_value ELSE 0 END), 0.00) AS active_committed_value,
    COALESCE(AVG(c.contract_value), 0.00) AS avg_contract_value
FROM vendors v
LEFT JOIN contracts c ON v.id = c.vendor_id
GROUP BY v.id, v.name
ORDER BY active_committed_value DESC;

-- --------------------------------------------------------
-- QUERY 3: Status Distribution & Value Breakdown
-- Breakdown of contracts, percentage of portfolio, and value
-- --------------------------------------------------------
SELECT 
    status,
    COUNT(*) AS contract_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts), 2) AS pct_of_total_contracts,
    SUM(contract_value) AS total_value,
    ROUND(AVG(contract_value), 2) AS avg_value,
    MIN(contract_value) AS min_value,
    MAX(contract_value) AS max_value
FROM contracts
GROUP BY status
ORDER BY total_value DESC;

-- --------------------------------------------------------
-- QUERY 4: Window Function: Value Ranking within Each Vendor
-- Demonstrates DENSE_RANK() partitioning by vendor
-- --------------------------------------------------------
SELECT 
    v.name AS vendor_name,
    c.contract_number,
    c.title,
    c.contract_value,
    DENSE_RANK() OVER (PARTITION BY c.vendor_id ORDER BY c.contract_value DESC) AS rank_within_vendor,
    SUM(c.contract_value) OVER (PARTITION BY c.vendor_id) AS total_vendor_spend
FROM contracts c
JOIN vendors v ON c.vendor_id = v.id
ORDER BY v.name, rank_within_vendor;

-- --------------------------------------------------------
-- QUERY 5: Contracts Entering Renewal Review Window in Next 30 Days
-- Matches the Spring Boot scheduled cron job logic
-- --------------------------------------------------------
SELECT 
    c.id,
    c.contract_number,
    c.title,
    v.name AS vendor_name,
    v.email AS vendor_email,
    c.end_date,
    c.renewal_notice_days,
    c.renewal_review_date,
    c.status
FROM contracts c
JOIN vendors v ON c.vendor_id = v.id
WHERE c.status = 'ACTIVE'
  AND c.renewal_review_date <= CURDATE()
  AND c.end_date >= CURDATE();

-- --------------------------------------------------------
-- QUERY 6: Full Audit History with Latest Decision per Contract
-- Demonstrates Common Table Expression (CTE) & ROW_NUMBER()
-- --------------------------------------------------------
WITH RankedDecisions AS (
    SELECT 
        rd.id AS decision_id,
        rd.contract_id,
        rd.decision,
        rd.decision_date,
        rd.decided_by,
        rd.notes,
        rd.new_end_date,
        rd.new_value,
        ROW_NUMBER() OVER (PARTITION BY rd.contract_id ORDER BY rd.decision_date DESC, rd.id DESC) AS rn
    FROM renewal_decisions rd
)
SELECT 
    c.contract_number,
    c.title,
    v.name AS vendor_name,
    c.status AS current_status,
    rd.decision AS latest_decision,
    rd.decision_date,
    rd.decided_by,
    rd.notes,
    rd.new_end_date,
    rd.new_value
FROM contracts c
JOIN vendors v ON c.vendor_id = v.id
JOIN RankedDecisions rd ON c.id = rd.contract_id AND rd.rn = 1
ORDER BY rd.decision_date DESC;

-- --------------------------------------------------------
-- QUERY 7: Unread Notifications with Associated Contract & Vendor
-- --------------------------------------------------------
SELECT 
    n.id AS notification_id,
    n.type,
    n.title AS notification_title,
    n.message,
    n.created_at,
    c.contract_number,
    c.title AS contract_title,
    v.name AS vendor_name,
    v.contact_person,
    v.email
FROM notifications n
JOIN contracts c ON n.contract_id = c.id
JOIN vendors v ON c.vendor_id = v.id
WHERE n.is_read = FALSE
ORDER BY n.created_at DESC;

-- --------------------------------------------------------
-- QUERY 8: Monthly Expiration Forecast for the Next 12 Months
-- --------------------------------------------------------
SELECT 
    DATE_FORMAT(end_date, '%Y-%m') AS expiration_month,
    COUNT(*) AS contracts_expiring,
    SUM(contract_value) AS total_expiring_value
FROM contracts
WHERE end_date >= CURDATE()
  AND end_date <= DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
  AND status IN ('ACTIVE', 'RENEWAL_DUE')
GROUP BY DATE_FORMAT(end_date, '%Y-%m')
ORDER BY expiration_month ASC;
