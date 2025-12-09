#!/bin/bash

# Environment Configuration Validator
# Validates all production environment variables are set correctly

set -e

echo "🔍 Environment Configuration Validator"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check variable
check_var() {
    local var_name=$1
    local var_value=${!var_name}
    local required=${2:-false}
    
    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo "❌ $var_name (REQUIRED - NOT SET)"
            ((ERRORS++))
        else
            echo "⚠️  $var_name (optional - not set)"
            ((WARNINGS++))
        fi
    else
        if [[ "$var_name" == *"SECRET"* ]] || [[ "$var_name" == *"KEY"* ]] || [[ "$var_name" == *"PASS"* ]]; then
            # Redact sensitive values
            local display="${var_value:0:10}...${var_value: -5}"
        else
            local display="$var_value"
        fi
        echo "✅ $var_name = $display"
    fi
}

echo "Database:"
check_var "DATABASE_URL" "true"

echo ""
echo "Authentication:"
check_var "JWT_SECRET" "true"

echo ""
echo "Payment Processing:"
check_var "STRIPE_SECRET_KEY" "true"
check_var "STRIPE_PUBLISHABLE_KEY" "true"
check_var "STRIPE_WEBHOOK_SECRET" "true"
check_var "BILLING_CURRENCY" "false"
check_var "TRIAL_PERIOD_DAYS" "false"

echo ""
echo "Email (SendGrid):"
check_var "SENDGRID_API_KEY" "false"

echo ""
echo "AI Services:"
check_var "AI_SYNTHETIC_ENGINE_URL" "false"
check_var "AI_SYNTHETIC_API_KEY" "false"
check_var "AI_SECURITY_MODE" "false"

echo ""
echo "Optional Integrations:"
check_var "SLACK_WEBHOOK_URL" "false"
check_var "DISCORD_WEBHOOK_URL" "false"
check_var "PAYPAL_CLIENT_ID" "false"
check_var "PAYPAL_CLIENT_SECRET" "false"

echo ""
echo "======================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All required variables are set!"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS optional variables not configured"
    fi
else
    echo "❌ $ERRORS required variables missing!"
    echo ""
    echo "Update your .env file or Render dashboard."
    exit 1
fi
