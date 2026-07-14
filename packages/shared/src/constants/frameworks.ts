export const SUPPORTED_FRAMEWORKS = [
  'nextjs',
  'react',
  'angular',
  'vue',
  'nestjs',
  'express',
  'fastapi',
  'django',
  'spring-boot',
  'laravel',
  'aspnet',
  'rails',
  'gin',
  'fiber',
] as const;

export type SupportedFramework = (typeof SUPPORTED_FRAMEWORKS)[number];

export const FRAMEWORK_DISPLAY_NAMES: Record<SupportedFramework, string> = {
  nextjs: 'Next.js',
  react: 'React',
  angular: 'Angular',
  vue: 'Vue',
  nestjs: 'NestJS',
  express: 'Express',
  fastapi: 'FastAPI',
  django: 'Django',
  'spring-boot': 'Spring Boot',
  laravel: 'Laravel',
  aspnet: 'ASP.NET',
  rails: 'Rails',
  gin: 'Gin',
  fiber: 'Fiber',
};

export const FRAMEWORK_INDICATORS: Record<SupportedFramework, string[]> = {
  nextjs: ['next.config', 'next/'],
  react: ['react', 'react-dom', 'createRoot'],
  angular: ['@angular/core', 'angular.json'],
  vue: ['vue', '@vue/'],
  nestjs: ['@nestjs/core', '@nestjs/common'],
  express: ['express', 'app.listen'],
  fastapi: ['fastapi', 'FastAPI'],
  django: ['django', 'DJANGO_SETTINGS'],
  'spring-boot': ['spring-boot', '@SpringBootApplication'],
  laravel: ['laravel/framework', 'artisan'],
  aspnet: ['Microsoft.AspNetCore', 'WebApplication'],
  rails: ['rails', 'ActionController'],
  gin: ['github.com/gin-gonic/gin'],
  fiber: ['github.com/gofiber/fiber'],
};
