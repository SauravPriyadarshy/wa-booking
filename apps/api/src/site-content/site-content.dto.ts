import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertSiteContentDto {
  @IsString()
  @MinLength(1)
  value: string;
}

export class BulkUpsertSiteContentDto {
  items: Array<{
    key: string;
    locale?: string;
    value: string;
  }>;
}

export class GetSiteContentQuery {
  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsIn(['en', 'hi'])
  locale?: string;
}
