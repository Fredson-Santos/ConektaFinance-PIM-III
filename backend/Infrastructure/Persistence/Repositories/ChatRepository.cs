using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Interfaces;

namespace PIM_III_Backend.Infrastructure.Persistence.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly AppDbContext _context;

    public ChatRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ChatMessage>> GetByUserIdAsync(int userId)
    {
        return await _context.ChatMessages
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(ChatMessage message)
    {
        await _context.ChatMessages.AddAsync(message);
        await _context.SaveChangesAsync();
    }

    public async Task ClearHistoryAsync(int userId)
    {
        var messages = await _context.ChatMessages.Where(x => x.UserId == userId).ToListAsync();
        if (messages.Any())
        {
            _context.ChatMessages.RemoveRange(messages);
            await _context.SaveChangesAsync();
        }
    }
}
