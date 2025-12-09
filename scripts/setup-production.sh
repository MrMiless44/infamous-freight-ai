#!/bin/bash

# Production Environment Setup Script
# Configures Render service environment variables for Stripe, SendGrid, etc.

set -e

echo "🔧 Infæmous Freight Production Setup"
echo "======================================"
echo ""

# Check if Render CLI is available
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI not found. Install with:"
    echo "   npm install -g @render/cli"
    echo ""
    echo "Alternatively, manually add these vars in Render dashboard:"
    exit 1
fi

# Prompt for environment variables
echo "Enter your production credentials (leave blank to skip):"
echo ""

read -p "Stripe Secret Key (sk_live_...): " STRIPE_SECRET_KEY
read -p "Stripe Publishable Key (pk_live_...): " STRIPE_PUBLISHABLE_KEY
read -p "Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET

read -p "SendGrid API Key: " SENDGRID_API_KEY

read -p "JWT Secret (or press Enter to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi

read -p "AI Synthetic API Key: " AI_SYNTHETIC_API_KEY

# Optional: PayPal
read -p "PayPal Client ID (optional): " PAYPAL_CLIENT_ID
read -p "PayPal Client Secret (optional): " PAYPAL_CLIENT_SECRET

echo ""
echo "Setting environment variables on Render..."
echo ""

# Get service ID from Render
SERVICE_ID=$(render services list | grep "infamous-freight-api" | awk '{print $1}')

if [ -z "$SERVICE_ID" ]; then
    echo "❌ Could not find infamous-freight-api service"
    exit 1
fi

# Set variables (requires render auth first)
render env set \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" \
    STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
    SENDGRID_API_KEY="$SENDGRID_API_KEY" \
    JWT_SECRET="$JWT_SECRET" \
    AI_SYNTHETIC_API_KEY="$AI_SYNTHETIC_API_KEY" \
    PAYPAL_CLIENT_ID="$PAYPAL_CLIENT_ID" \
    PAYPAL_CLIENT_SECRET="$PAYPAL_CLIENT_SECRET" \
    --service="$SERVICE_ID"

echo ""
echo "✅ Environment variables set! Service is redeploying..."
echo ""
echo "Monitor progress at: https://dashboard.render.com"
