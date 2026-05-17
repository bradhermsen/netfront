using System.Data;

namespace NetFrontAPI.Infrastructure.Database
{
    public interface ISqlConnectionFactory
    {
        /// <summary>
        /// Creates and returns a new SQL database connection.
        /// </summary>
        /// <returns>IDbConnection instance ready for use.</returns>
        IDbConnection CreateConnection();
    }
}
