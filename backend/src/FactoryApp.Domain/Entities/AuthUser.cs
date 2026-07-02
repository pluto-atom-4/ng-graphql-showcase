namespace FactoryApp.Domain.Entities;

public class AuthUser
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public string Claims { get; set; } = "{}";
}
