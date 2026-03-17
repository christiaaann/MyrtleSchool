import { useState } from "react";
import axios from "axios";

export default function ForgotPasswordStepper() {
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP, 3 = new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!email) return setMessage("Please enter your email.");
    setLoading(true);
    try {
      const res = await axios.post("https://myrtlebackend.vercel.app/send-otp", { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        if (!otp) return setMessage("Enter OTP.");
        setLoading(true);
        try {
        const res = await axios.post("https://myrtlebackend.vercel.app/verify-otp", { email, otp });
        setMessage(res.data.message);
        setStep(3);
        } catch (err) {
        setMessage(err.response?.data?.message || "OTP verification failed");
        } finally {
        setLoading(false);
        }
    };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6)
      return setMessage("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const res = await axios.post("https://myrtlebackend.vercel.app/reset-password", { email, newPassword });
      setMessage(res.data.message);
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-lg flex flex-col gap-6">

      {/* -------- STEPPER -------- */}
      <div className="flex items-center justify-between mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            {/* Circle */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
              ${step >= s ? "bg-blue-600" : "bg-gray-300"}`}>
              {s}
            </div>
            {/* Line */}
            {s < totalSteps && (
              <div className={`flex-1 h-1 ${step > s ? "bg-blue-600" : "bg-gray-300"}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* -------- FORM CONTENT -------- */}
      {step === 1 && (
        <>
          <h2 className="text-xl font-semibold">Forgot Password</h2>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            onClick={handleSendOTP}
            className="bg-blue-600 text-white py-2 rounded mt-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl font-semibold">Verify OTP</h2>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            onClick={handleVerifyOTP}
            className="bg-green-600 text-white py-2 rounded mt-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={() => setStep(1)}
            className="text-sm text-gray-500 mt-2 underline"
          >
            Back
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-xl font-semibold">Reset Password</h2>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            onClick={handleResetPassword}
            className="bg-purple-600 text-white py-2 rounded mt-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <button
            onClick={() => setStep(2)}
            className="text-sm text-gray-500 mt-2 underline"
          >
            Back
          </button>
        </>
      )}

      {message && <p className="text-red-600 mt-2">{message}</p>}
    </div>
  );
}