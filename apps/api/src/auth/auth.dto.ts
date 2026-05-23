import {
  IsIn,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @MinLength(4)
  password: string;
}

export class BootstrapSuperAdminDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @MinLength(4)
  password: string;
}

export class OtpRequestDto {
  @IsPhoneNumber('IN')
  phone: string;
}

export class OtpVerifyDto {
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @MinLength(4)
  code: string;
}

export class SetRoleDto {
  @IsString()
  userId: string;

  @IsIn(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'STAFF'])
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF';

  @IsOptional()
  @IsString()
  businessId?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(4)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  // must contain upper, lower, number, special
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password too weak',
  })
  newPassword: string;
}

export class AdminSetPasswordDto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password too weak',
  })
  newPassword: string;
}

export class RefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

