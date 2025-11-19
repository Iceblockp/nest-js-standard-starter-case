import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class AppConfigService {
    private configService;
    constructor(configService: NestConfigService);
    get port(): number;
    get nodeEnv(): string;
    get databaseUrl(): string;
    get jwtSecret(): string;
    get jwtExpiresIn(): string;
    get corsOrigin(): string;
    get rateLimitTtl(): number;
    get rateLimitMax(): number;
    get isDevelopment(): boolean;
    get isProduction(): boolean;
    get isTest(): boolean;
}
