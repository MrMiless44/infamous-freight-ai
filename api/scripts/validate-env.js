#!/usr/bin/env node

/**
 * Comprehensive Environment Validation Script
 * Validates all required environment variables and configurations
 * Run this before deployment to catch issues early
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  validate() {
    console.log(`\n${colors.blue}🔍 Environment Validation${colors.reset}\n`);

    this.validateRequired();
    this.validateStripe();
    this.validateDatabase();
    this.validateSecurity();
    this.validateOptional();
    this.validateFiles();

    this.report();
  }

  validateRequired() {
    console.log(`${colors.blue}Checking required variables...${colors.reset}`);

    const required = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
    ];

    required.forEach((key) => {
      if (!process.env[key]) {
        this.errors.push(`Missing required: ${key}`);
      } else {
        this.success.push(`✓ ${key} configured`);
      }
    });
  }

  validateStripe() {
    console.log(`${colors.blue}Checking Stripe configuration...${colors.reset}`);

    if (!process.env.STRIPE_SECRET_KEY) {
      this.errors.push('STRIPE_SECRET_KEY not configured');
      return;
    }

    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      this.warnings.push('Using Stripe test keys (OK for development)');
    } else if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      this.errors.push('STRIPE_SECRET_KEY format invalid');
    } else {
      this.success.push('✓ Stripe production keys configured');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      this.warnings.push('STRIPE_WEBHOOK_SECRET not configured (webhook validation disabled)');
    } else {
      this.success.push('✓ Stripe webhook secret configured');
    }
  }

  validateDatabase() {
    console.log(`${colors.blue}Checking database configuration...${colors.reset}`);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.errors.push('DATABASE_URL not configured');
      return;
    }

    if (!dbUrl.includes('postgresql://') && !dbUrl.includes('postgres://')) {
      this.errors.push('DATABASE_URL is not a PostgreSQL URL');
      return;
    }

    this.success.push('✓ Database URL configured');
  }

  validateSecurity() {
    console.log(`${colors.blue}Checking security configuration...${colors.reset}`);

    if (!process.env.JWT_SECRET) {
      this.errors.push('JWT_SECRET not configured');
      return;
    }

    if (process.env.JWT_SECRET.length < 32) {
      this.warnings.push('JWT_SECRET is short (recommend 32+ characters)');
    } else {
      this.success.push('✓ JWT_SECRET configured with sufficient length');
    }

    if (process.env.NODE_ENV === 'production') {
      if (process.env.CORS_ORIGINS === '*') {
        this.warnings.push('CORS_ORIGINS is "*" in production (security risk)');
      } else {
        this.success.push('✓ CORS_ORIGINS properly restricted');
      }
    }
  }

  validateOptional() {
    console.log(`${colors.blue}Checking optional features...${colors.reset}`);

    const optional = [
      { key: 'SENTRY_DSN', feature: 'Error tracking' },
      { key: 'REDIS_URL', feature: 'Response caching' },
      { key: 'AI_SYNTHETIC_API_KEY', feature: 'AI commands' },
    ];

    optional.forEach(({ key, feature }) => {
      if (process.env[key]) {
        this.success.push(`✓ ${feature} (${key}) enabled`);
      } else {
        this.warnings.push(`${feature} (${key}) disabled`);
      }
    });
  }

  validateFiles() {
    console.log(`${colors.blue}Checking required files...${colors.reset}`);

    const requiredFiles = [
      'package.json',
      '.env',
      'prisma/schema.prisma',
    ];

    requiredFiles.forEach((file) => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        this.success.push(`✓ ${file} exists`);
      } else {
        this.errors.push(`Missing file: ${file}`);
      }
    });
  }

  report() {
    console.log(`\n${colors.blue}═══════════════════════════════════${colors.reset}\n`);

    if (this.success.length > 0) {
      console.log(`${colors.green}✓ Success${colors.reset} (${this.success.length})`);
      this.success.forEach((msg) => console.log(`  ${colors.green}${msg}${colors.reset}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠ Warnings${colors.reset} (${this.warnings.length})`);
      this.warnings.forEach((msg) => console.log(`  ${colors.yellow}${msg}${colors.reset}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n${colors.red}✗ Errors${colors.reset} (${this.errors.length})`);
      this.errors.forEach((msg) => console.log(`  ${colors.red}${msg}${colors.reset}`));
    }

    console.log(`\n${colors.blue}═══════════════════════════════════${colors.reset}\n`);

    if (this.errors.length > 0) {
      console.log(`${colors.red}❌ Validation FAILED${colors.reset}`);
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log(`${colors.yellow}⚠️  Validation PASSED (with warnings)${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.green}✅ Validation PASSED${colors.reset}`);
      process.exit(0);
    }
  }
}

const validator = new EnvironmentValidator();
validator.validate();
