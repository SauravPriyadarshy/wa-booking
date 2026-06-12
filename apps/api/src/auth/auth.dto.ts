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

  @IsOptional()
  @IsIn(['whatsapp', 'email'])
  channel?: 'whatsapp' | 'email';

  @IsOptional()
  @IsString()
  email?: string;
}

export class OtpVerifyDto {
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @MinLength(4)
  code: string;

  /** Set on signup or password reset after OTP is verified. */
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
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

