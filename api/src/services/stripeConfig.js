require('dotenv').config();
const Stripe = require('stripe');

// Single shared Stripe client configured from environment variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

module.exports = stripe;
