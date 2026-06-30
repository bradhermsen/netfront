-- Drop the broken trigger
DROP TRIGGER IF EXISTS trg_PlayerTeams_Insert_CreateRosterEntry;

-- Recreate it without the Status column
CREATE TRIGGER trg_PlayerTeams_Insert_CreateRosterEntry
ON PlayerTeams
AFTER INSERT
AS
BEGIN
    INSERT INTO RosterEntries
    (
        Id,
        TeamId,
        PlayerId,
        Position,
        JerseyNumber,
        IsActive,
        CreatedAt,
        UpdatedAt
    )
    SELECT
        NEWID(),
        i.TeamId,
        i.PlayerId,
        p.Position,
        p.JerseyNumber,
        1,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    FROM inserted i
    JOIN Players p ON p.PlayerId = i.PlayerId
    WHERE NOT EXISTS (
        SELECT 1 FROM RosterEntries
        WHERE TeamId = i.TeamId AND PlayerId = i.PlayerId
    );
END;
