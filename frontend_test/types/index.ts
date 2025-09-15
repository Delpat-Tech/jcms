export interface User {
  _id: string
  username: string
  email: string
  role: Role
  tenant?: Tenant
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Role {
  _id: string
  name: 'superadmin' | 'admin' | 'editor' | 'viewer'
  description: string
}

export interface Tenant {
  _id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Image {
  _id: string
  title: string
  user: string
  tenant?: string
  tenantName: string
  internalPath: string
  fileUrl: string
  format: string
  notes: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: {
    id: string
    username: string
    email: string
    role: string
  }
}