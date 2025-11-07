import { Request } from "express";

// Contém as informações que vão dentro do token
export interface JwtPayload {
    userId: string;
    email: string;
    platform: "web" | "mobile"; // Diferencia web de mobile para expiração
    }

    // Extensão do Request do Express para incluir o usuário autenticado
    // Depois que o middleware de autenticação valida o token,
    // ele anexa essas informações ao request
    export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        platform: "web" | "mobile";
    };
    }

    export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    age: number;
    postalCode: string;
    city: string;
    state: string;
    street: string;
    houseNumber: string;
    neighborhood: string;
    biography?: string;
    phone: string;
    contactEmail: string;
    contactPhone: string;
    socialNetworks?: string;
    }

    export interface UpdateUserData {
    name?: string;
    age?: number;
    postalCode?: string;
    city?: string;
    state?: string;
    street?: string;
    houseNumber?: string;
    neighborhood?: string;
    biography?: string;
    phone?: string;
    contactEmail?: string;
    contactPhone?: string;
    socialNetworks?: string;
    }

    export interface CreateDonationData {
    title: string;
    description: string;
    pickupType: "PICK_UP_AT_LOCATION" | "ARRANGE_WITH_DONOR";
    postalCode: string;
    street: string;
    locationNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    category: "FOOD" | "APPLIANCES" | "FURNITURE" | "CLOTHING" | "ELECTRONICS" | "EQUIPMENT" | "HOME";
    }

    export interface UpdateDonationData {
    title?: string;
    description?: string;
    pickupType?: "PICK_UP_AT_LOCATION" | "ARRANGE_WITH_DONOR";
    postalCode?: string;
    street?: string;
    locationNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    category?: "FOOD" | "APPLIANCES" | "FURNITURE" | "CLOTHING" | "ELECTRONICS" | "EQUIPMENT" | "HOME";
    }

    export interface LoginData {
    email: string;
    password: string;
    platform: "web" | "mobile";
    }

    export interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    }

    export interface ForgotPasswordData {
    email: string;
    }

    export interface ResetPasswordData {
    token: string;
    newPassword: string;
    }

    export interface ProfileEditHistoryData {
    editedAt: Date;
    changedFields: Record<string, {
        oldValue: any;
        newValue: any;
    }>;
    }

    export interface DonationEditHistoryData {
    editedAt: Date;
    changedFields: Record<string, {
        oldValue: any;
        newValue: any;
    }>;
    }

    export interface PaginationParams {
    page?: number;
    limit?: number;
    }

    export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    }

    export interface DonationFilters {
    status?: "OPEN" | "IN_PROGRESS" | "PICKED_UP" | "COMPLETED";
    category?: "FOOD" | "APPLIANCES" | "FURNITURE" | "CLOTHING" | "ELECTRONICS" | "EQUIPMENT" | "HOME";
    city?: string;
    state?: string;
}