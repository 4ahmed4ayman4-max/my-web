using AutoMapper;
using Business.DTOs.Deliveries;
using Infrastructure.Entities;

namespace Business.Mapping;

public class DeliveryProfile : Profile
{
    public DeliveryProfile()
    {
        CreateMap<Delivery, DeliveryResponseDto>();

        CreateMap<DeliveryCreateRequestDto, Delivery>();

        CreateMap<DeliveryUpdateRequestDto, Delivery>()
            .ForAllMembers(opts => opts.Condition(
                (src, dest, srcMember) => srcMember != null));
    }
}