import React, { useState } from "react";
import { auth } from "../../services/firebase";
import { sileo} from "sileo";
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
  // 🔎 Validation
  if (!form.currentPassword) {
    sileo.error({ title: "Current password required.", 
      fill:"black",
    }
    );
    return;
  }

  if (!form.password) {
    sileo.error({ title: "Enter new password.",
       fill:"black"
     });
    return;
  }

  if (form.password.length < 6) {
    sileo.error({ title: "Password must be at least 6 characters.",
       fill:"black"
     });
    return;
  }

  if (form.password !== form.confirmPassword) {
    sileo.error({ title: "Passwords do not match.",
       fill:"black"
     });
    return;
  }

  const updateUserPassword = async () => {
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      form.currentPassword
    );

    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, form.password);
  };

  await sileo.promise(updateUserPassword(), {
    loading: { title: "Updating Password..." },
    success: { title: "Password Updated Successfully!" },
    error: { title: "Update Failed" }
  });

  // clear form after success
  setForm({
    password: "",
    confirmPassword: "",
    currentPassword: "",
  });
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