export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  username: string;
  accessToken: string;
}

export interface RegisterResponse {
  username: string;
  email: string;
}

export interface RefreshResponse {
  accessToken: string;
}
