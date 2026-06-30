-- Update hermiehockey@outlook.com to SuperAdmin role
UPDATE AuthUsers 
SET Role = 'SuperAdmin' 
WHERE Email = 'hermiehockey@outlook.com';

-- Verify the update
SELECT Id, Email, Role, IsActive, CreatedAt 
FROM AuthUsers 
WHERE Email = 'hermiehockey@outlook.com';
