declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test",
    Staging = "staging"
}
declare class EnvironmentVariables {
    NODE_ENV: Environment;
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_TTL: number;
    RATE_LIMIT_MAX: number;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
