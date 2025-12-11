@app.route('/webhook', methods=['POST'])
def webhook_received():
    webhook_secret = 'whsec_12345'
    payload = request.data
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        return jsonify(success=False), 400
        
    # Process event based on type
    if event.type == 'payment_intent.succeeded':
        payment_intent = event.data.object  # contains a Stripe::PaymentIntent
        # Handle payment success
    
    return jsonify(success=True), 200