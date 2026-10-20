using Business.DTOs.Common;
using Business.DTOs.Products;
using Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
        => _productService = productService;

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResultDto<ProductResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts([FromQuery] ProductFilterRequestDto filter)
        => Ok(await _productService.GetFilteredAsync(filter));

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProduct(int id)
        => Ok(await _productService.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Policy = "CanManageProducts")]
    public async Task<IActionResult> CreateProduct([FromBody] ProductCreateRequestDto request)
    {
        var product = await _productService.CreateAsync(request);
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "CanManageProducts")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductUpdateRequestDto request)
        => Ok(await _productService.UpdateAsync(id, request));

    [HttpPatch("{id:int}/toggle-active")]
    [Authorize(Policy = "CanManageProducts")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        await _productService.ToggleActiveAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "CanManageProducts")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        await _productService.DeleteAsync(id);
        return NoContent();
    }
}