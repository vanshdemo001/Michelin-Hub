"use server";

import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("CRITICAL: Missing Razorpay API keys in environment variables!");
}

// Instantiate lazily to prevent build-time crashes if keys are missing
let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "dummy_key_id",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret"
    });
  }
  return razorpayInstance;
}

export async function createRazorpayOrder(amount: number, receipt: string) {
  try {
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: receipt,
      payment_capture: 1 // Auto capture
    };

    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "dummy_key_id") {
      throw new Error("Missing Razorpay API keys. Please configure RAZORPAY_KEY_ID in .env.local");
    }

    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create(options);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    
    return {
      success: false,
      error: error.message || "Failed to create payment order. Make sure valid API keys are configured."
    };
  }
}
