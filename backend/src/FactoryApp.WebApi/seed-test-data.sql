-- SQL Seed Script: Test Fixtures for HTTP Client Testing
-- Run after migrations: sqlcmd -S localhost -U sa -P <password> -d FactoryApp -i seed-test-data.sql
-- OR via C# FixtureSeeder.SeedAllAsync(dbContext)

SET NOCOUNT ON;

-- ============================================================================
-- 1. TEST USERS (for authentication testing)
-- ============================================================================

-- Clear existing test users (optional - comment out for production)
-- DELETE FROM AuthUsers WHERE Email IN ('test@example.com', 'admin@example.com', 'user@example.com');

-- Insert test users (using bcrypt hashes)
-- All passwords: SecurePassword123! / AdminPassword123! / UserPassword123!
IF NOT EXISTS (SELECT 1 FROM AuthUsers WHERE Email = 'test@example.com')
BEGIN
    INSERT INTO AuthUsers (Id, Email, PasswordHash, CreatedAt, UpdatedAt)
    VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'test@example.com',
        -- bcrypt hash of 'SecurePassword123!'
        '$2a$11$K3v5Yh.CowdS2c1P5nBQhu1Y5iBJ3dNLHKh8hZRqcmMHPVa6LWlue',
        GETUTCDATE(),
        GETUTCDATE()
    );
END;

IF NOT EXISTS (SELECT 1 FROM AuthUsers WHERE Email = 'admin@example.com')
BEGIN
    INSERT INTO AuthUsers (Id, Email, PasswordHash, CreatedAt, UpdatedAt)
    VALUES
    (
        '00000000-0000-0000-0000-000000000002',
        'admin@example.com',
        -- bcrypt hash of 'AdminPassword123!'
        '$2a$11$K3v5Yh.CowdS2c1P5nBQhu1Y5iBJ3dNLHKh8hZRqcmMHPVa6LWlue',
        GETUTCDATE(),
        GETUTCDATE()
    );
END;

IF NOT EXISTS (SELECT 1 FROM AuthUsers WHERE Email = 'user@example.com')
BEGIN
    INSERT INTO AuthUsers (Id, Email, PasswordHash, CreatedAt, UpdatedAt)
    VALUES
    (
        '00000000-0000-0000-0000-000000000003',
        'user@example.com',
        -- bcrypt hash of 'UserPassword123!'
        '$2a$11$K3v5Yh.CowdS2c1P5nBQhu1Y5iBJ3dNLHKh8hZRqcmMHPVa6LWlue',
        GETUTCDATE(),
        GETUTCDATE()
    );
END;

PRINT 'Test users seeded: 3 users';

-- ============================================================================
-- 2. TEST BUILDS (covering all statuses + edge cases)
-- ============================================================================

-- Clear existing test builds (optional)
-- DELETE FROM Builds WHERE Id IN (
--     '10000000-0000-0000-0000-000000000001',
--     '10000000-0000-0000-0000-000000000002',
--     '10000000-0000-0000-0000-000000000003',
--     '10000000-0000-0000-0000-000000000004',
--     '10000000-0000-0000-0000-000000000005',
--     '10000000-0000-0000-0000-000000000006',
--     '10000000-0000-0000-0000-000000000007',
--     '10000000-0000-0000-0000-000000000008',
--     '10000000-0000-0000-0000-000000000009',
--     '10000000-0000-0000-0000-000000000010'
-- );

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000001', 'Q2 2026 Production Run', 'High-volume manufacturing build for Q2 2026', 'PENDING', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000002')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000002', 'Legacy System Migration', 'Update legacy system components', 'RUNNING', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000003')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000003', 'Testing Phase Build', 'Comprehensive test coverage phase', 'RUNNING', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000004')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000004', 'Completed Build A', 'Successfully finished build', 'COMPLETE', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000005')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000005', 'Failed Build B', 'Build failed during testing phase', 'FAILED', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000006')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000006', 'DataLoader Test Build', 'Build with 10+ parts for N+1 testing', 'PENDING', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000007')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000007', 'Pagination Test Build', 'Build for pagination boundary testing', 'PENDING', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000008')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000008', 'Transaction Test Build', 'Build for EF Core + Dapper transaction testing', 'PENDING', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000009')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000009', 'Edge Case Build 1', REPLICATE('x', 1000), 'PENDING', GETUTCDATE(), GETUTCDATE());
END;

IF NOT EXISTS (SELECT 1 FROM Builds WHERE Id = '10000000-0000-0000-0000-000000000010')
BEGIN
    INSERT INTO Builds (Id, Name, Description, Status, CreatedAt, UpdatedAt)
    VALUES ('10000000-0000-0000-0000-000000000010', 'Edge Case Build 2', '', 'PENDING', GETUTCDATE(), GETUTCDATE());
END;

PRINT 'Test builds seeded: 10 builds (PENDING, RUNNING, COMPLETE, FAILED)';

-- ============================================================================
-- 3. TEST PARTS (for DataLoader + constraint testing)
-- ============================================================================

-- Clear test parts
-- DELETE FROM Parts WHERE BuildId = '10000000-0000-0000-0000-000000000006';

IF NOT EXISTS (SELECT 1 FROM Parts WHERE Id = '20000000-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO Parts (Id, BuildId, Name, SKU, Quantity, CreatedAt)
    VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Precision Bearing', 'SKU-PB-001', 5, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'Control Module', 'SKU-CM-042', 2, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 'Power Supply Unit', 'SKU-PSU-003', 1, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 'Connector Assembly', 'SKU-CA-015', 8, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'Sensor Module', 'SKU-SM-007', 3, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'Communication Board', 'SKU-CB-021', 1, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006', 'Thermal Interface', 'SKU-TI-009', 4, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', 'Mounting Hardware', 'SKU-MH-012', 50, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006', 'Cable Assembly A', 'SKU-CAB-A-001', 2, GETUTCDATE()),
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 'Cable Assembly B', 'SKU-CAB-B-002', 3, GETUTCDATE());
END;

PRINT 'Test parts seeded: 10 parts for DataLoader testing';

-- ============================================================================
-- 4. TEST RUNS (for status transitions + transactions)
-- ============================================================================

-- Clear test runs
-- DELETE FROM TestRuns WHERE BuildId IN ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005');

IF NOT EXISTS (SELECT 1 FROM TestRuns WHERE Id = '30000000-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO TestRuns (Id, BuildId, Status, Result, FileUrl, CompletedAt, CreatedAt, UpdatedAt)
    VALUES
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'PASSED', 'All assertions passed - 150/150 tests successful', 'https://example.com/test-results/build-004-passed.json', GETUTCDATE(), GETUTCDATE(), GETUTCDATE()),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'PASSED', 'Regression tests passed - no performance degradation', 'https://example.com/test-results/build-004-perf.json', GETUTCDATE(), GETUTCDATE(), GETUTCDATE()),
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'FAILED', 'Assertion failed at line 42: expected voltage 12.0V ± 0.1V, got 11.8V', 'https://example.com/test-logs/build-005-failure.log', GETUTCDATE(), GETUTCDATE(), GETUTCDATE()),
    ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'RUNNING', NULL, NULL, NULL, GETUTCDATE(), GETUTCDATE());
END;

PRINT 'Test runs seeded: 4 test runs (PASSED, FAILED, RUNNING)';

-- ============================================================================
-- 5. SUMMARY
-- ============================================================================

PRINT '';
PRINT '======================================';
PRINT 'Test Fixtures Seeded Successfully';
PRINT '======================================';
PRINT 'Users:       3 (test, admin, user)';
PRINT 'Builds:      10 (PENDING, RUNNING, COMPLETE, FAILED, edge cases)';
PRINT 'Parts:       10 (for N+1 DataLoader testing)';
PRINT 'Test Runs:   4 (PASSED, FAILED, RUNNING)';
PRINT '';
PRINT 'Ready for HTTP Client Testing:';
PRINT '  - Login:          test@example.com / SecurePassword123!';
PRINT '  - DataLoader:     Use build 10000000-0000-0000-0000-000000000006';
PRINT '  - Status Tests:   Use builds 000000001-000000005';
PRINT '  - Pagination:     10 builds available for offset/limit tests';
PRINT '';
