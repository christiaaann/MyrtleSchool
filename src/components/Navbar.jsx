import React, { useState } from "react";
import logo from "../assets/logo.png";
import { Menu, X } from "lucide-react";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
const Navbar = () => {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <>
      {/* NAVBAR */}
      <header className="fixed top-4 w-full flex justify-center z-50">
        <nav className="w-[92%] max-w-7xl bg-white/80 backdrop-blur-md shadow-lg rounded-2xl px-6 py-2 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img className="w-12 object-contain" src={logo} alt="logo" />
            <h1 className="hidden phone:block text-neutral-700 font-baloo font-bold text-lg">
              MYRTLE CHRISTIAN SCHOOL
            </h1>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden laptop:flex gap-10 font-baloo font-semibold text-neutral-700">
            <li className="hover:text-[#2D5B60] transition">
              <a href="#home">Home</a>
            </li>

            <li className="hover:text-[#2D5B60] transition">
              <a href="#about">About</a>
            </li>

            <li className="hover:text-[#2D5B60] transition">
              <a href="#courses">Program</a>
            </li>

            <li className="hover:text-[#2D5B60] transition">
              <a href="#contact">Contact</a>
            </li>
          </ul>

          {/* Desktop Button */}
          <Link to="/Auth" className="hidden laptop:flex gap-2 bg-[#2D5B60] hover:bg-[#24494d] transition text-white px-10 py-1 rounded-full shadow-md">
            Enroll Now
          </Link>

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
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* SIDEBAR MENU */}
      <aside
        className={`fixed top-0 right-0 h-full w-[260px] bg-white z-50 shadow-xl transform transition-transform duration-300 ${
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
        <ul className="flex flex-col gap-6 p-6 font-baloo font-semibold text-neutral-700">

          <li>
            <a href="#home" onClick={closeMenu}>Home</a>
          </li>

          <li>
            <a href="#about" onClick={closeMenu}>About</a>
          </li>

          <li>
            <a href="#courses" onClick={closeMenu}>Program</a>
          </li>

          <li>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </li>

          <button
            onClick={closeMenu}
            className="bg-[#2D5B60] text-white py-2 rounded-full"
          >
            Enroll Now
          </button>

        </ul>
      </aside>
    </>
  );
};

export default Navbar;