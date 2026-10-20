using Business.DTOs.Common;
using Business.DTOs.Deliveries;
using Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// Deliveries are driver records (name, phone, email) managed by the admin
// section - customers must not be able to read or change them.
[Authorize(Policy = "CanManageDeliveries")]
public class DeliveriesController : ControllerBase
{
    private readonly IDeliveryService _deliveryService;

    public DeliveriesController(IDeliveryService deliveryService)
    {
        _deliveryService = deliveryService;
    }

    // ===================================================
    // GET: api/deliveries
    // ===================================================
    /// <summary>
    /// Get filtered & paged list of deliveries.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<DeliveryResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFiltered([FromQuery] DeliveryFilterRequestDto filter)
    {
        var result = await _deliveryService.GetFilteredAsync(filter);
        return Ok(result);
    }

    // ===================================================
    // GET: api/deliveries/{id}
    // ===================================================
    /// <summary>
    /// Get a delivery by id.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(DeliveryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _deliveryService.GetByIdAsync(id);
        return Ok(result);
    }

    // ===================================================
    // POST: api/deliveries
    // ===================================================
    /// <summary>
    /// Create a new delivery.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(DeliveryResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] DeliveryCreateRequestDto request)
    {
        var result = await _deliveryService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // ===================================================
    // PUT: api/deliveries/{id}
    // ===================================================
    /// <summary>
    /// Update an existing delivery.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(DeliveryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(int id, [FromBody] DeliveryUpdateRequestDto request)
    {
        var result = await _deliveryService.UpdateAsync(id, request);
        return Ok(result);
    }

    // ===================================================
    // DELETE: api/deliveries/{id}
    // ===================================================
    /// <summary>
    /// Soft-delete a delivery.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        await _deliveryService.DeleteAsync(id);
        return NoContent();
    }

    // ===================================================
    // PATCH: api/deliveries/{id}/toggle-active
    // ===================================================
    /// <summary>
    /// Toggle the active state of a delivery.
    /// </summary>
    [HttpPatch("{id:int}/toggle-active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleActive(int id)
    {
        await _deliveryService.ToggleActiveAsync(id);
        return NoContent();
    }

    // ===================================================
    // PATCH: api/deliveries/{id}/toggle-availability
    // ===================================================
    /// <summary>
    /// Toggle the availability of a delivery (on/off duty).
    /// </summary>
    [HttpPatch("{id:int}/toggle-availability")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleAvailability(int id)
    {
        await _deliveryService.ToggleAvailabilityAsync(id);
        return NoContent();
    }

    // ===================================================
    // PATCH: api/deliveries/{id}/location
    // ===================================================
    /// <summary>
    /// Update the current location of a delivery.
    /// </summary>
    [HttpPatch("{id:int}/location")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateLocation(int id, [FromBody] UpdateLocationRequestDto request)
    {
        await _deliveryService.UpdateLocationAsync(id, request);
        return NoContent();
    }
}