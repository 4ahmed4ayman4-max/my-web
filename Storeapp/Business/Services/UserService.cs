using AutoMapper;
using Business.DTOs.Users;
using Business.Exceptions;
using Business.Interfaces;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Identity;

namespace Business.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMapper _mapper;
    private readonly IAuditHelper _auditHelper;

    public UserService(UserManager<ApplicationUser> userManager, IMapper mapper, IAuditHelper auditHelper)
    {
        _userManager = userManager;
        _auditHelper = auditHelper;
        _mapper = mapper;
    }

    public async Task<UserProfileResponseDto> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");

        return await MapWithRolesAsync(user);
    }

    public async Task<UserProfileResponseDto> UpdateProfileAsync(string userId, UpdateProfileRequestDto request)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.PhoneNumber;
        user.ProfileImageUrl = request.ProfileImageUrl;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new BadRequestException("Failed to update profile.",
                result.Errors.Select(e => e.Description));

        await _auditHelper
            .LogAsync("Update", "User", user.Id.ToString());

        return await MapWithRolesAsync(user);
    }

    public async Task<IEnumerable<UserProfileResponseDto>> GetAllUsersAsync()
    {
        var users = _userManager.Users
            .Where(u => !u.IsDeleted)
            .ToList();

        var result = new List<UserProfileResponseDto>();
        foreach (var user in users)
            result.Add(await MapWithRolesAsync(user));

        return result;
    }

    public async Task<UserProfileResponseDto> GetUserByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");

        return await MapWithRolesAsync(user);
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");

        // Soft delete
        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        user.Email = $"deleted_{user.Id}@deleted.local";
        user.UserName = user.Email;
        user.LockoutEnabled = true;
        user.LockoutEnd = DateTimeOffset.MaxValue;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new BadRequestException("Failed to delete user.");

        await _auditHelper
            .LogAsync("Delete", "User", user.Id.ToString());

        return true;
    }

    public async Task<bool> AssignRoleAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");

        if (!await _userManager.IsInRoleAsync(user, role))
        {
            var result = await _userManager.AddToRoleAsync(user, role);
            if (!result.Succeeded)
                throw new BadRequestException($"Failed to assign role '{role}'.");
        }

        return true;
    }

    private async Task<UserProfileResponseDto> MapWithRolesAsync(ApplicationUser user)
    {
        var dto = _mapper.Map<UserProfileResponseDto>(user);
        dto.Roles = await _userManager.GetRolesAsync(user);
        return dto;
    }
}