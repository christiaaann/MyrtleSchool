import React, { useState } from "react";
import { auth } from "../../services/firebase";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

const Settings = () => {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    currentPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if (!form.currentPassword)
        return alert("Current password required.");

      if (!form.password)
        return alert("Enter new password.");

      if (form.password.length < 6)
        return alert("Password must be at least 6 characters.");

      if (form.password !== form.confirmPassword)
        return alert("Passwords do not match.");

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        form.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, form.password);

      alert("Password updated successfully!");

      setForm({
        password: "",
        confirmPassword: "",
        currentPassword: "",
      });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white p-6 flex flex-col justify-center items-center rounded-xl shadow h-full">
      <h2 className="text-4xl font-semibold mb-2">Update Password</h2>
      <p className="text-gray-400 mb-8">Change your account password</p>

      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm">
            <span className="text-red-500">*</span> New Password
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="border w-[24rem] p-2 px-6 rounded-full"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-500 text-sm">
            <span className="text-red-500">*</span> Confirm Password
          </label>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="border w-[24rem] p-2 px-6 rounded-full"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-500 text-sm">
            <span className="text-red-500">*</span> Current Password
          </label>
          <input
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            className="border w-[24rem] p-2 px-6 rounded-full"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-6 px-6 py-2 bg-black text-white rounded-full"
      >
        Update Password
      </button>
    </div>
  );
};

export default Settings;