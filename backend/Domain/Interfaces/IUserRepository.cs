using System.Threading.Tasks;
using PIM_III_Backend.Domain.Entities;

namespace PIM_III_Backend.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task AddAsync(User user);
}
