import React, { useState } from "react";
import { auth } from "../../services/firebase";
import { sileo } from "sileo";
import { Link } from "react-router-dom";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

const ChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    if (!form.currentPassword) {
      sileo.error({ title: "Enter current password", fill: "black" });
      return;
    }

    if (!form.newPassword) {
      sileo.error({ title: "Enter new password", fill: "black" });
      return;
    }

    if (form.newPassword.length < 6) {
      sileo.error({
        title: "Password must be at least 6 characters",
        fill: "black",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      sileo.error({ title: "Passwords do not match", fill: "black" });
      return;
    }

    const updatePasswordProcess = async () => {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        form.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, form.newPassword);
    };

    await sileo.promise(updatePasswordProcess(), {
      loading: { title: "Updating password..." },
      success: { title: "Password updated successfully!" },
      error: { title: "Failed to update password" },
    });

    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className=" max-w-4xl mx-auto relative flex flex-col items-center min-h-screen justify-center bg-white p-6 rounded-xl ">
      <Link to="/enrollment" className=" absolute top-5 left-0">Back</Link>
      <h2 className="text-3xl font-semibold mb-2">Change Password</h2>
      <p className="text-gray-400 mb-6">Update your account password</p>

      <div className="flex flex-col gap-4">
        <input
          type="password"
          name="currentPassword"
          placeholder="Current Password"
          value={form.currentPassword}
          onChange={handleChange}
          className="border p-2 px-4 rounded-full w-80"
        />

        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={form.newPassword}
          onChange={handleChange}
          className="border p-2 px-4 rounded-full w-80"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="border p-2 px-4 rounded-full w-80"
        />
      </div>

      <button
        onClick={handleChangePassword}
        className="mt-6 bg-black text-white px-6 py-2 rounded-full"
      >
        Update Password
      </button>
    </div>
  );
};

export default ChangePassword;