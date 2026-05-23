import { Body, Controller, Get, Param, Post, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessesService } from '../businesses/businesses.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { CustomersService } from '../customers/customers.service';

@Controller('public')
export class PublicController {
  constructor(
    private businesses: BusinessesService,
    private appointments: AppointmentsService,
    private customers: CustomersService,
  ) {}

  @Get('business/:slug')
  async getBusiness(@Param('slug') slug: string) {
    const business = await this.businesses.getBySlug(slug);
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  @Get('business/:slug/slots')
  async getSlots(
    @Param('slug') slug: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('staffId') staffId?: string,
  ) {
    const business = await this.businesses.getBySlug(slug);
    if (!business) throw new NotFoundException('Business not found');
    return this.appointments.slots(business.id, serviceId, date, staffId);
  }

  @Post('business/:slug/book')
  async book(
    @Param('slug') slug: string,
    @Body() dto: { serviceId: string; startAt: string; name: string; phone: string; staffId?: string },
  ) {
    const business = await this.businesses.getBySlug(slug);
    if (!business) throw new NotFoundException('Business not found');

    if (!dto.phone || !dto.name) throw new BadRequestException('Name and phone are required');

    const customer = await this.customers.findOrCreateByPhone(business.id, dto.phone, dto.name);
    
    const appointment = await this.appointments.create(business.id, {
      customerId: customer.id,
      serviceId: dto.serviceId,
      startAt: dto.startAt,
      staffId: dto.staffId,
    });

    return { ok: true, appointment, businessName: business.name };
  }
}
