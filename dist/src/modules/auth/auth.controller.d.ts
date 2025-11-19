import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            email: string;
            firstName: string | null;
            lastName: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            isActive: true;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
}
