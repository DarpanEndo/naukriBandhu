// Simple console-based OTP notification
export async function sendOtp(phoneNumber: string, otp: string) {
  try {
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    // In a real application, this would send an actual SMS
    // For now, we'll just log it to the console
    console.log(`
    ===============================
    📱 SMS to ${phoneNumber}:
    Your NaukriBandhu OTP is: ${otp}
    Valid for 5 minutes.
    ===============================
    `);

    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
}
