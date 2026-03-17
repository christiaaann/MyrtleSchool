import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import FloatingInput from "../../components/FloatingInput";
import { Mail, Check, Key  } from "lucide-react";
import { sileo } from "sileo";
export default function ForgotPasswordStepper() {
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP, 3 = new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
  if (!newPassword || newPassword.length < 6) {
    return toast.error("Password must be at least 6 characters."); // direct toast na lang
  }

  setLoading(true);
  try {
    await axios.post("https://myrtlebackend.vercel.app/reset-password", { email, newPassword });

    // Show success toast
    sileo.success("Password successfully changed!");

    // Clear form
    setEmail("");
    setOtp("");
    setNewPassword("");

    // Redirect to Auth page after 2 seconds
    setTimeout(() => {
      navigate("/Auth");
    }, 2000);

  } catch (err) {
    toast.error(err.response?.data?.message || "Error resetting password");
  } finally {
    setLoading(false);
  }
};

  return (
  <div className=" min-h-screen flex">
  <div className="max-w-6xl  mx-auto p-10">
  <Link to="/Auth" >Back</Link>
        {/* -------- STEPPER -------- */}
 <ol className="flex justify-between items-center mt-3 relative">
  {[1, 2, 3].map((s, i) => (
    <li key={s} className="relative flex-1 flex flex-col items-center">
      
      {/* Circle */}
      <span
        className={`w-8 h-8  rounded-full flex justify-center items-center text-sm z-10
          ${step === s ? "bg-green-950 text-white" : step > s ? "bg-green-600 text-white" : "bg-gray-50 border-2 border-gray-200 text-gray-600"}`}
      >
      {step > s ? (
        <Check className="w-4 h-4" /> 
      ) : s === 1 ? (
        <Mail className="w-4 h-4" />
      ) : s === 2 ? (
        <h1 className="font-bold text-[11px]">OTP</h1>
      ) : (
        <Key className="w-4 h-4" />
      )}
      </span>

      {/* Connecting line */}
      {i < 2 && (
        <div className="absolute top-4 left-1/2  border w-full bg-gray-300 z-0"></div>
      )}

      {/* Step Content */}
      <div className="text-center mt-6">
        <h4 className={`text-base mb-1 ${step >= s ? "text-green-600" : "text-gray-900"}`}>
          {s === 1 && "Enter Email"}
          {s === 2 && "Verify Code"}
          {s === 3 && "Reset Password"}
        </h4>
        <p className="text-sm text-gray-600 max-w-xs">
          {s === 1 && "Type your email to receive a password reset link."}
          {s === 2 && "Open your email and click the verification link."}
          {s === 3 && "Enter your new password and confirm it."}
        </p>
      </div>
    </li>
  ))}
</ol>

<div className="flex justify-center items-center mt-10">
      <div className=" h-96 flex  flex-col gap-2 w-96 justify-center">
        <h1 className="text-center text-3xl relative mb-10">Fotgot Password?</h1>
      {/* -------- FORM CONTENT -------- */}
      {step === 1 && (
        <>
          <h1 className="flex gap-1"><span className=" text-red-600 ">*</span>Enter your email</h1>
          <FloatingInput
          label="Email"
          type="email"
          id="lastname"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
            
          />
          <button
            onClick={handleSendOTP}
            className="bg-green-950 px-6 text-white py-2 w-full rounded-2xl mt-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl font-semibold">Verify OTP</h2>
          <FloatingInput
            type="text"
            id="otp"
            label="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button
            onClick={handleVerifyOTP}
            className="bg-green-950 px-6 text-white py-2 rounded-2xl w-full mt-2 disabled:bg-gray-400"
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
          <h2 className="flex gap-1"><span className="text-red-600">*</span>Reset Password</h2>
          <FloatingInput
            type="password"
            label="Newpassword"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handleResetPassword}
            className="bg-green-950 text-white py-2 rounded-2xl mt-2 disabled:bg-gray-400"
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
      </div>
    </div></div>
  );
}