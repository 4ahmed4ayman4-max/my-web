using Business.DTOs.Categories;
using Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
        => _categoryService = categoryService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
        => Ok(await _categoryService.GetAllAsync());

    [HttpGet("roots")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRoots()
        => Ok(await _categoryService.GetRootCategoriesAsync());

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
        => Ok(await _categoryService.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Policy = "CanManageCategories")]
    public async Task<IActionResult> Create([FromBody] CategoryCreateRequestDto request)
        => Ok(await _categoryService.CreateAsync(request));

    [HttpPut("{id:int}")]
    [Authorize(Policy = "CanManageCategories")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryUpdateRequestDto request)
        => Ok(await _categoryService.UpdateAsync(id, request));

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "CanManageCategories")]
    public async Task<IActionResult> Delete(int id)
    {
        await _categoryService.DeleteAsync(id);
        return NoContent();
    }
}