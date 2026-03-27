import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { Menu, X, User } from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import DepEdLogo from "../assets/DepEDLogo.png"
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
      setUser(null);
      return;
    }

    // 🔥 get Firestore user data
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setUser({
        ...currentUser,
        ...docSnap.data(),
      });
    } else {
      setUser(currentUser);
    }
  });

  return () => unsub();
}, []);
  // 🔥 Logout
  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
    closeMenu();
  };

  return (
    <>
      {/* NAVBAR */}
      <header className="fixed top-4 w-full flex justify-center z-50">
        <nav className="w-[92%] max-w-7xl bg-white/80 backdrop-blur-md shadow-lg rounded-2xl px-6 py-2 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img className="w-12 object-contain" src={logo} alt="logo" />
            <img className="w-12 object-contain" src={DepEdLogo} alt="" />
            <h1 className="hidden phone:block duration-300 text-nowrap text-sm text-neutral-700 font-baloo font-bold tablet:text-lg">
              MYRTLE CHRISTIAN SCHOOL INC.
            </h1>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden laptop:flex gap-10 font-baloo font-semibold text-neutral-700">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#courses">Program</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          {/* 🔥 RIGHT SIDE (Desktop) */}
          {!user ? (
            <Link
              to="/Auth"
              className="hidden laptop:flex gap-2 bg-[#2D5B60] hover:bg-[#24494d] transition text-white px-10 py-1 rounded-full shadow-md"
            >
              Enroll Now
            </Link>
          ) : (
            <div ref={dropdownRef} className="relative hidden laptop:flex">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="profile"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <User size={28} className="text-[#2D5B60]" />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-xl p-2">
                  <div className="flex items-center gap-2">
                  <img className="w-10 rounded-full h-10 object-contain"
                       src={user.profilePicture} alt="" />
                      <div className="flex flex-col"> 
                      <span>{user.parent ?.firstname} {user.parent ?.lastname}</span>
                      <span className="text-sm">{user.email}</span>
                      
                      </div>
                        
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-100 rounded-lg"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(true)}
            className="laptop:hidden text-neutral-700"
          >
            <Menu size={28} />
          </button>

        </nav>
      </header>

      {/* Overlay */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 bg-black/40 laptop:hidden z-40 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* SIDEBAR MENU */}
      <aside
        className={`fixed top-0 right-0 laptop:hidden h-full w-[260px] bg-white z-50 shadow-xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="font-bold text-lg">Menu</h2>
          <button onClick={closeMenu}>
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Links */}
        <ul className="flex flex-col gap-6 p-6 text-neutral-700">
          {/* mobile */}
          {user && (
            <div className="flex items-center gap-3">
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={user?.profilePicture}
                alt=""
              />

              <div className="flex flex-col">
                <h1>
                  {user?.parent?.firstname} {user?.parent?.lastname}
                </h1>
                <h1 className="text-[12px]">{user?. email}</h1>
              </div>
            </div>
          )}
          <li><a href="#home" onClick={closeMenu}>Home</a></li>
          <li><a href="#about" onClick={closeMenu}>About</a></li>
          <li><a href="#courses" onClick={closeMenu}>Program</a></li>
          <li><a href="#contact" onClick={closeMenu}>Contact</a></li>

          {/* 🔥 MOBILE AUTH */}
          {!user ? (
            <Link
              to="/Auth"
              onClick={closeMenu}
              className="bg-[#2D5B60] text-white py-2 rounded-full text-center"
            >
              Enroll Now
            </Link>
          ) : (
            <>

              <button onClick={handleLogout} className="text-left">
                Logout
              </button>
            </>
          )}
        </ul>
      </aside>
    </>
  );
};

export default Navbar;