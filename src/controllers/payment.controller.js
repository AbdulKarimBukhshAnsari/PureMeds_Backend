import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🧾 Create Checkout Session (when user clicks “Pay Now”)
export const createCheckoutSession = async (req, res) => {
  try {
    console.log("📦 Incoming request body:", req.body);

    const { cartItems } = req.body;

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: item.price * 100, // $ → cents
      },
      quantity: item.quantity,
    }));

    console.log("✅ Line items ready:", lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      ui_mode: "embedded",
      return_url: `${process.env.CLIENT_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    console.log("✅ Stripe session created:", session.id);

    res.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error.message);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

// 🧾 Retrieve session status after checkout
export const getSessionStatus = async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
    });
  } catch (error) {
    console.error("❌ Error retrieving session:", error.message);
    res.status(500).json({ message: "Failed to get session status" });
  }
};
