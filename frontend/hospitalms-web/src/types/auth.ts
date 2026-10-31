export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  branchId?: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

