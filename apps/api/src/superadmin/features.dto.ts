import { IsBoolean, IsIn, IsString } from 'class-validator';

export class SetBusinessFeatureDto {
  @IsString()
  businessId: string;

  @IsIn(['payments', 'crm', 'whatsapp', 'analytics', 'support', 'ai', 'queue'])
  key: 'payments' | 'crm' | 'whatsapp' | 'analytics' | 'support' | 'ai' | 'queue';

  @IsBoolean()
  enabled: boolean;
}

