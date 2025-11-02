// lib/otpStore.ts
import fs from "fs";
import path from "path";

const otpFilePath = path.join(process.cwd(), "otpStore.json");

interface PendingRegistration {
  userId: string;
  firstName: string;
  aadharLast4: string;
  mobileNumber: string;
}

interface OtpData {
  otp: string;
  expires: number;
  pendingRegistration?: PendingRegistration;
}

const readOtpStore = (): Map<string, OtpData> => {
  try {
    if (fs.existsSync(otpFilePath)) {
      const data = fs.readFileSync(otpFilePath, "utf-8");
      return new Map(JSON.parse(data));
    }
  } catch (error) {
    console.error("Error reading OTP store:", error);
  }
  return new Map();
};

const writeOtpStore = (store: Map<string, OtpData>) => {
  try {
    fs.writeFileSync(otpFilePath, JSON.stringify(Array.from(store.entries())));
  } catch (error) {
    console.error("Error writing OTP store:", error);
  }
};

class PersistentOtpStore {
  private store: Map<string, OtpData>;

  constructor() {
    this.store = readOtpStore();
  }

  get(key: string) {
    return this.store.get(key);
  }

  set(key: string, value: OtpData) {
    this.store.set(key, value);
    writeOtpStore(this.store);
  }

  delete(key: string) {
    const result = this.store.delete(key);
    writeOtpStore(this.store);
    return result;
  }
}

export const otpStore = new PersistentOtpStore();
