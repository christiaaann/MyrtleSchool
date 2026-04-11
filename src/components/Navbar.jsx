import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
    const dashboardRoute =
    user?.role === "admin" ? "/admin" : "/Enrollment"; 

  const closeMenu = () => setOpen(false);

  // 🔥 Scroll effect (sticky → floating)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              ...docSnap.data(),
            });
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setDropdownOpen(false);
    closeMenu();
    navigate("/");
  };


  return (
    <>
      {/* HEADER */}
      <header
        className={`sticky top-0 w-full flex justify-center z-50 px-4 transition-all duration-500 ${
          scrolled ? "pt-4" : "pt-0"
        }`}
      >
        <nav
          className={`w-full max-w-7xl px-6 py-2 flex items-center justify-between border transition-all duration-500 ${
            scrolled
              ? "bg-white/80 backdrop-blur-md shadow-lg rounded-2xl border-white/20"
              : "bg-white shadow-none rounded-none border-transparent"
          }`}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform active:scale-95"
          >
            <img
              className="w-10 phone:w-12 object-contain"
              src={logo}
              alt="logo"
            />
            <h1 className="hidden phone:block text-neutral-700 font-baloo font-bold tablet:text-lg text-nowrap text-sm uppercase tracking-tighter">
              Myrtle Christian School INC.
            </h1>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden laptop:flex gap-10 font-baloo font-semibold text-neutral-600">
            <li>
              <a href="#home" className="hover:text-teal-700 transition">
                Home
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-teal-700 transition">
                About
              </a>
            </li>
            <li>
              <a href="#courses" className="hover:text-teal-700 transition">
                Program
              </a>
            </li>
            <li>
                 <a href="#" onClick={closeMenu}>Announcements</a>
            </li>
            <li>
              <a href="#contact" className="hover:text-teal-700 transition">
                Contact
              </a>
            </li>
          </ul>

          {/* RIGHT SIDE */}
          <div className="flex items-center">
            {loading ? (
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full hidden laptop:block"></div>
            ) : !user ? (
              <Link
                to="/Auth"
                className="hidden laptop:flex bg-[#2D5B60] hover:bg-[#1d3d40] text-white px-8 py-2 rounded-full shadow-md text-sm"
              >
                Sign up
              </Link>
            ) : (
              <div
                ref={dropdownRef}
                className="relative hidden laptop:flex items-center gap-3"
              >
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-800">
                    {user.parent?.firstname || "User"}{" "}
                    {user.parent?.lastname || ""}
                  </p>
                </div>

                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="group"
                >
                  <img
                    src={
                      user.profilePicture ||
                      "https://ui-avatars.com/api/?name=" + user.email
                    }
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#2D5B60] group-hover:ring-4 group-hover:ring-teal-100 transition"
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-14 w-64 bg-white shadow-2xl rounded-2xl p-2 border animate-in fade-in">
                    <div className="p-3 border-b">
                      <p className="text-sm font-bold">
                        {user.parent?.firstname} {user.parent?.lastname}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to={dashboardRoute}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 rounded-xl"
                    >
                      <Settings size={16} /> Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl font-bold"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Button */}
            <button
              onClick={() => setOpen(true)}
              className="laptop:hidden ml-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <Menu size={28} />
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 right-0 z-[60] tablet:hidden w-72 bg-white shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 flex justify-between items-center border-b">
          <span className="font-black text-[#2D5B60]">MENU</span>
          <button onClick={closeMenu}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!loading && user && (
            <div className="flex items-center gap-2">
              <img
                className="w-12 h-12 rounded-full object-cover"
                src={user.profilePicture}
                alt=""
              />
              <div>
                <p className="font-bold text-sm">
                  {user.parent?.firstname}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
                 <Link
                  to={dashboardRoute}
                  className="flex items-center mt-1 gap-1 px-4 py-3 text-sm hover:bg-gray-50 rounded-xl"
                  >
                  <Settings size={20} /> Dashboard
                  </Link>
              </div>
            </div>
            
          )}

          <nav className="flex flex-col gap-4 font-bold text-gray-600">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#courses" onClick={closeMenu}>Program</a>
             <a href="#" onClick={closeMenu}>Announcements</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
           
          </nav>

          <div className="pt-6 border-t">
            {!loading && (!user ? (
              <Link
                to="/Auth"
                onClick={closeMenu}
                className="block w-full bg-[#2D5B60] text-white py-3 rounded-xl text-center font-bold"
              >
                Sign up
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold"
              >
                Logout
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] laptop:hidden"
        />
      )}
    </>
  );
};

export default Navbar;