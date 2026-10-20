using Business.DTOs.Users;
using Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUser;

    public UsersController(IUserService userService, ICurrentUserService currentUser)
    {
        _userService = userService;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
        => Ok(await _userService.GetProfileAsync(_currentUser.UserId!));

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequestDto request)
        => Ok(await _userService.UpdateProfileAsync(_currentUser.UserId!, request));

    [HttpGet]
    [Authorize(Policy = "CanManageUsers")]
    public async Task<IActionResult> GetAll()
        => Ok(await _userService.GetAllUsersAsync());

    [HttpGet("{id}")]
    [Authorize(Policy = "CanManageUsers")]
    public async Task<IActionResult> GetById(string id)
        => Ok(await _userService.GetUserByIdAsync(id));

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanManageUsers")]
    public async Task<IActionResult> Delete(string id)
    {
        await _userService.DeleteUserAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/roles/{role}")]
    [Authorize(Policy = "CanManageUsers")]
    public async Task<IActionResult> AssignRole(string id, string role)
    {
        await _userService.AssignRoleAsync(id, role);
        return Ok(new { message = $"Role '{role}' assigned successfully." });
    }
}