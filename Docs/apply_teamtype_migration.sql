IF COL_LENGTH('dbo.Teams', 'TeamType') IS NULL
BEGIN
    ALTER TABLE dbo.Teams ADD TeamType NVARCHAR(20) NULL;
END;

IF COL_LENGTH('dbo.Teams', 'TeamMascot') IS NULL
BEGIN
    ALTER TABLE dbo.Teams ADD TeamMascot NVARCHAR(80) NULL;
END;

EXEC(N'
UPDATE t
SET TeamMascot = COALESCE(NULLIF(t.TeamMascot, ''''), o.Mascot)
FROM dbo.Teams t
LEFT JOIN dbo.Organizations o ON o.OrganizationId = t.OrganizationId
WHERE ISNULL(t.IsExternal, 0) = 0;

UPDATE dbo.Teams
SET TeamType = ''Co-Ed''
WHERE TeamType IS NULL OR LTRIM(RTRIM(TeamType)) = '''';
');

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Teams_OrgTypeLevelSeason_NotNullOrg' AND object_id = OBJECT_ID('dbo.Teams'))
BEGIN
    DROP INDEX UX_Teams_OrgTypeLevelSeason_NotNullOrg ON dbo.Teams;
END;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Teams_OrgTypeLevelSeason_NullOrg' AND object_id = OBJECT_ID('dbo.Teams'))
BEGIN
    DROP INDEX UX_Teams_OrgTypeLevelSeason_NullOrg ON dbo.Teams;
END;

EXEC(N'
IF NOT EXISTS (
    SELECT 1
    FROM dbo.Teams t1
    JOIN dbo.Teams t2
      ON ISNULL(t1.OrganizationId, ''00000000-0000-0000-0000-000000000000'') = ISNULL(t2.OrganizationId, ''00000000-0000-0000-0000-000000000000'')
     AND ISNULL(t1.TeamType, '''') = ISNULL(t2.TeamType, '''')
     AND t1.LevelId = t2.LevelId
     AND t1.SeasonId = t2.SeasonId
     AND t1.Id <> t2.Id
)
BEGIN
    CREATE UNIQUE INDEX UX_Teams_OrgTypeLevelSeason_NotNullOrg
    ON dbo.Teams (OrganizationId, TeamType, LevelId, SeasonId)
    WHERE OrganizationId IS NOT NULL;

    CREATE UNIQUE INDEX UX_Teams_OrgTypeLevelSeason_NullOrg
    ON dbo.Teams (TeamType, LevelId, SeasonId)
    WHERE OrganizationId IS NULL;
END;
');
