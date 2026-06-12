namespace FactoryApp.Domain.Entities;

public class AuthUser
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
}
