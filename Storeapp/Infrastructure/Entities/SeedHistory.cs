namespace Infrastructure.Entities
{
    public class SeedHistory : BaseEntity
    {
        public string LastMigration { get; set; } = string.Empty;
        public DateTime SeededAt { get; set; }
    }
}