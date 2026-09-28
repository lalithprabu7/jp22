-- ========================================================
-- ContractWatch — Demo Seed Data
-- ========================================================

USE contractwatch;

-- Disable FK checks during initial insert
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE renewal_decisions;
TRUNCATE TABLE contracts;
TRUNCATE TABLE vendors;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Vendors
INSERT INTO vendors (id, name, contact_person, email, phone, company_address) VALUES
(1, 'Amazon Web Services', 'John Smith', 'billing@aws.amazon.com', '+1-800-792-9073', '410 Terry Avenue North, Seattle, WA 98109, USA'),
(2, 'Microsoft Corporation', 'Sarah Johnson', 'contracts@microsoft.com', '+1-800-642-7676', 'One Microsoft Way, Redmond, WA 98052, USA'),
(3, 'Google Cloud Platform', 'Rahul Mehta', 'cloud-sales@google.com', '+1-844-613-7589', '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA'),
(4, 'Salesforce Inc.', 'Elena Rostova', 'billing@salesforce.com', '+1-800-667-6389', '415 Mission Street, 3rd Floor, San Francisco, CA 94105, USA'),
(5, 'Atlassian Pty Ltd', 'David Clark', 'finance@atlassian.com', '+61-2-9262-0777', '341 George Street, Sydney, NSW 2000, Australia'),
(6, 'Datadog Inc.', 'Marcus Wright', 'subscriptions@datadoghq.com', '+1-866-328-2364', '620 8th Avenue, 45th Floor, New York, NY 10018, USA'),
(7, 'CrowdStrike Holdings', 'Amanda Lee', 'security-renewals@crowdstrike.com', '+1-888-512-8906', '206 E 9th Street, Suite 1400, Austin, TX 78701, USA'),
(8, 'Slack Technologies', 'Kenji Sato', 'accounts@slack.com', '+1-855-752-2580', '500 Howard Street, San Francisco, CA 94105, USA');

-- 2. Contracts (Dynamically referenced relative to current date)
INSERT INTO contracts (id, contract_number, title, vendor_id, start_date, end_date, renewal_notice_days, renewal_review_date, contract_value, status, document_url, description) VALUES
-- RENEWAL_DUE (High Urgency - Expiring soon)
(1, 'CW-2024-001', 'Enterprise Cloud Hosting & Compute Services', 1, 
 DATE_SUB(CURDATE(), INTERVAL 350 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 30, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 15 DAY), INTERVAL 30 DAY), 120000.00, 'RENEWAL_DUE', 
 'https://drive.google.com/file/d/aws-enterprise-cloud-agreement.pdf', 'Core enterprise cloud infrastructure spanning US-East and EU-West regions.'),

(2, 'CW-2024-002', 'Microsoft 365 E5 Enterprise Suite', 2, 
 DATE_SUB(CURDATE(), INTERVAL 340 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 45, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 25 DAY), INTERVAL 45 DAY), 85000.00, 'RENEWAL_DUE', 
 'https://drive.google.com/file/d/m365-e5-license-agreement.pdf', '500 E5 user seats including Purview Compliance and Defender XDR suite.'),

(3, 'CW-2024-003', 'BigQuery Enterprise & ML Engine Cluster', 3, 
 DATE_SUB(CURDATE(), INTERVAL 170 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 14, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 10 DAY), INTERVAL 14 DAY), 45000.00, 'RENEWAL_DUE', 
 'https://drive.google.com/file/d/gcp-bigquery-enterprise-contract.pdf', 'Data warehouse commitment with 100TB query slot capacity.'),

-- ACTIVE (Expiring in 60-180 days)
(4, 'CW-2024-004', 'Salesforce Sales Cloud Unlimited Tier', 4, 
 DATE_SUB(CURDATE(), INTERVAL 180 DAY), DATE_ADD(CURDATE(), INTERVAL 185 DAY), 60, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 185 DAY), INTERVAL 60 DAY), 96000.00, 'ACTIVE', 
 'https://drive.google.com/file/d/salesforce-sales-cloud-unlimited.pdf', 'CRM enterprise license covering global sales and business development units.'),

(5, 'CW-2024-005', 'Jira Software & Confluence Cloud Enterprise', 5, 
 DATE_SUB(CURDATE(), INTERVAL 200 DAY), DATE_ADD(CURDATE(), INTERVAL 165 DAY), 30, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 165 DAY), INTERVAL 30 DAY), 34000.00, 'ACTIVE', 
 'https://drive.google.com/file/d/atlassian-jira-enterprise.pdf', 'Developer tooling, project trackers, and engineering documentation hub.'),

(6, 'CW-2024-006', 'Datadog Full-Stack APM & Infrastructure Monitoring', 6, 
 DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_ADD(CURDATE(), INTERVAL 275 DAY), 45, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 275 DAY), INTERVAL 45 DAY), 62000.00, 'ACTIVE', 
 'https://drive.google.com/file/d/datadog-apm-contract.pdf', 'Synthetic monitoring, distributed tracing, and log management for microservices.'),

(7, 'CW-2024-007', 'Falcon Complete Managed Detection & Response', 7, 
 DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 305 DAY), 60, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 305 DAY), INTERVAL 60 DAY), 110000.00, 'ACTIVE', 
 'https://drive.google.com/file/d/crowdstrike-falcon-mdr.pdf', '24/7 proactive threat hunting, endpoint protection, and incident remediation.'),

(8, 'CW-2024-008', 'Slack Enterprise Grid Tier 1', 8, 
 DATE_SUB(CURDATE(), INTERVAL 120 DAY), DATE_ADD(CURDATE(), INTERVAL 245 DAY), 30, DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 245 DAY), INTERVAL 30 DAY), 28000.00, 'ACTIVE', 
 'https://drive.google.com/file/d/slack-enterprise-grid-agreement.pdf', 'Company-wide messaging, HIPAA compliance data retention, and external channels.'),

-- RENEWED
(9, 'CW-2023-009', 'AWS Multi-Account Support Plan — Enterprise Tier', 1, 
 DATE_SUB(CURDATE(), INTERVAL 400 DAY), DATE_SUB(CURDATE(), INTERVAL 35 DAY), 30, DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 35 DAY), INTERVAL 30 DAY), 48000.00, 'RENEWED', 
 'https://drive.google.com/file/d/aws-enterprise-support-2023.pdf', '15-minute response SLA support across all organizational AWS accounts.'),

(10, 'CW-2023-010', 'GitHub Enterprise Cloud & Actions Runners', 2, 
 DATE_SUB(CURDATE(), INTERVAL 380 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), 30, DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 15 DAY), INTERVAL 30 DAY), 36000.00, 'RENEWED', 
 'https://drive.google.com/file/d/github-enterprise-agreement.pdf', 'Enterprise code repository hosting, security features, and large runner minutes.'),

-- TERMINATED
(11, 'CW-2023-011', 'Legacy BI Reporting System (Superset Hosted)', 3, 
 DATE_SUB(CURDATE(), INTERVAL 500 DAY), DATE_SUB(CURDATE(), INTERVAL 100 DAY), 30, DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 100 DAY), INTERVAL 30 DAY), 22000.00, 'TERMINATED', 
 'https://drive.google.com/file/d/legacy-bi-agreement.pdf', 'Terminated in favor of in-house BigQuery + Looker integration.'),

-- EXPIRED
(12, 'CW-2023-012', 'Third-Party Penetration Testing Retainer', 7, 
 DATE_SUB(CURDATE(), INTERVAL 400 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY), 14, DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 14 DAY), 30000.00, 'EXPIRED', 
 'https://drive.google.com/file/d/pentest-retainer-2023.pdf', 'Annual external security audit engagement retainer — expired without renewal.');

-- 3. Renewal Decisions
INSERT INTO renewal_decisions (id, contract_id, decision, decision_date, decided_by, notes, new_end_date, new_value) VALUES
(1, 9, 'RENEWED', DATE_SUB(CURDATE(), INTERVAL 40 DAY), 'Director of IT Operations', 'Approved renewal with 10% negotiated enterprise volume discount.', DATE_ADD(CURDATE(), INTERVAL 325 DAY), 52000.00),
(2, 10, 'RENEWED', DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Head of Engineering', 'Renewed with 50 additional developer seats and Copilot license bundle.', DATE_ADD(CURDATE(), INTERVAL 345 DAY), 42000.00),
(3, 11, 'TERMINATED', DATE_SUB(CURDATE(), INTERVAL 105 DAY), 'VP of Data Analytics', 'Contract terminated due to redundant tooling and high licensing costs.', NULL, NULL),
(4, 12, 'EXPIRED', DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'System', 'Contract reached end date without an active renewal submission.', NULL, NULL);

-- 4. Notifications
INSERT INTO notifications (id, contract_id, title, message, type, is_read, created_at) VALUES
(1, 1, 'Renewal Notice Window Entered', 'Contract CW-2024-001 (Amazon Web Services) has entered its 30-day review period. Action required within 15 days.', 'RENEWAL_DUE', FALSE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 2, 'Renewal Decision Approaching', 'Contract CW-2024-002 (Microsoft Corporation) expires in 25 days. Notice deadline is active.', 'RENEWAL_DUE', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 3, 'Critical: Expiration in 10 Days', 'Contract CW-2024-003 (Google Cloud Platform) requires immediate renewal decision. Only 10 days remain.', 'ACTION_REQUIRED', FALSE, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(4, 12, 'Contract Expired Notice', 'Contract CW-2023-012 (CrowdStrike Holdings) has expired as of 20 days ago.', 'EXPIRED', TRUE, DATE_SUB(NOW(), INTERVAL 19 DAY)),
(5, 9, 'Contract Successfully Renewed', 'Contract CW-2023-009 has been renewed until next fiscal year.', 'INFO', TRUE, DATE_SUB(NOW(), INTERVAL 39 DAY));
