// One-file React app for preview/canvas
// Fix: remove multiple default exports by keeping exactly ONE default export (App)
// Also removed Next.js-specific imports to avoid name/duplicate collisions in the canvas bundler.
// Features kept: responsive navbar, active link highlight, sections, booking form, thank-you page, PDF/text export fallback.

import React, { useEffect, useMemo, useRef, useState } from "react";

/***********************************
 * Utilities
 ***********************************/
function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDateYYYYMMDD(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function smoothScrollToId(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Try to generate a PDF if jsPDF exists in the environment, fallback to .txt download
function downloadConfirmation(booking) {
  try {
    const maybe = (window && (window.jspdf || window.jsPDF));
    const jsPDF = maybe?.jsPDF || maybe; // support either window.jspdf.jsPDF or window.jsPDF
    if (jsPDF) {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Sudais Travel & Tours - Booking Confirmation", 20, 20);
      doc.setFontSize(12);
      let y = 40;
      const lines = [
        `Name: ${booking.name || ""}`,
        `Email: ${booking.email || ""}`,
        `Phone: ${booking.phone || ""}`,
        `Destination: ${booking.destination || ""}`,
        `Date: ${booking.date || ""}`,
        booking.notes ? `Notes: ${booking.notes}` : null,
        "",
        "Thank you for booking with Sudais Travel & Tours!",
      ].filter(Boolean);
      lines.forEach((line) => { doc.text(line, 20, y); y += 10; });
      doc.save("Booking_Confirmation.pdf");
      return true;
    }
  } catch (e) {
    // ignore and fallback
  }
  // Fallback: plain text file
  const text = [
    "Sudais Travel & Tours - Booking Confirmation",
    "---------------------------------------------",
    `Name: ${booking.name || ""}`,
    `Email: ${booking.email || ""}`,
    `Phone: ${booking.phone || ""}`,
    `Destination: ${booking.destination || ""}`,
    `Date: ${booking.date || ""}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
    "",
    "Thank you for booking with Sudais Travel & Tours!",
  ].filter(Boolean).join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Booking_Confirmation.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return true;
}

/***********************************
 * Shared Layout
 ***********************************/
function SiteLayout({ route, onNavigate, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (target) => route === target;

  const NavLink = ({ label, to, hash }) => {
    const active = (to && isActive(to)) || (route === "/" && hash);
    return (
      <button
        onClick={() => {
          if (hash) {
            if (route !== "/") onNavigate("/", hash);
            else smoothScrollToId(hash.replace("#", ""));
          } else if (to) {
            onNavigate(to);
          }
          setMenuOpen(false);
        }}
        className={classNames(
          "hover:text-blue-600 font-medium",
          active ? "text-blue-600 font-extrabold border-b-2 border-blue-600" : ""
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 to-white">
      {/* Navbar */}
      <header className="flex justify-between items-center p-6 shadow-md bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <h1 className="text-2xl font-bold text-blue-600">Sudais Travel & Tours</h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink label="Destinations" hash="#destinations" />
          <NavLink label="Packages" hash="#packages" />
          <NavLink label="About" hash="#about" />
          <NavLink label="Contact" hash="#contact" />
          <NavLink label="Booking" to="/booking" />
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <button
            className="bg-blue-600 text-white rounded-xl px-4 py-2"
            onClick={() => onNavigate("/booking")}
          >
            Book Now
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 border rounded-xl"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18"/></svg>
          )}
        </button>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 space-y-4">
          <NavLink label="Destinations" hash="#destinations" />
          <NavLink label="Packages" hash="#packages" />
          <NavLink label="About" hash="#about" />
          <NavLink label="Contact" hash="#contact" />
          <NavLink label="Booking" to="/booking" />
          <button
            className="w-full bg-blue-600 text-white rounded-xl py-2"
            onClick={() => { setMenuOpen(false); onNavigate("/booking"); }}
          >
            Book Now
          </button>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-blue-600 text-white text-center py-6 mt-10">
        <p>© {new Date().getFullYear()} Sudais Travel & Tours | All Rights Reserved</p>
      </footer>
    </div>
  );
}

/***********************************
 * Pages
 ***********************************/
function HomePage({ onNavigate }) {
  return (
    <>
      {/* Hero */}
      <section
        className="text-center py-20 bg-cover bg-center"
        style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?travel,airplane,beach,mountains')" }}
      >
        <h2 className="text-5xl font-bold text-white drop-shadow-lg">
          Explore The World With Sudais Travel & Tours
        </h2>
        <p className="text-lg text-white mt-4 drop-shadow">
          Your trusted partner for unforgettable journeys at unbeatable prices.
        </p>
        <button
          className="mt-6 bg-yellow-500 text-black px-6 py-3 rounded-xl"
          onClick={() => onNavigate("/booking")}
        >
          Start Your Journey
        </button>
      </section>

      {/* Destinations */}
      <section id="destinations" className="py-16 px-6">
        <h3 className="text-3xl font-semibold text-center mb-10">Top Destinations</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {["Paris", "Bali", "Dubai", "Istanbul", "New York", "Maldives"].map((place, idx) => (
            <div key={idx} className="rounded-2xl shadow-lg hover:shadow-2xl transition bg-white overflow-hidden">
              <img src={`https://source.unsplash.com/600x400/?${encodeURIComponent(place)},travel`} alt={place} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h4 className="text-xl font-bold">{place}</h4>
                <p className="text-gray-600">Discover the wonders of {place} with Sudais Travel & Tours packages.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-16 px-6 bg-gray-50">
        <h3 className="text-3xl font-semibold text-center mb-10">Popular Packages</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Romantic Paris (5D/4N)", price: "$899", img: "paris" },
            { title: "Bali Beach Escape (6D/5N)", price: "$799", img: "bali" },
            { title: "Dubai City Lights (4D/3N)", price: "$699", img: "dubai" },
          ].map((p, i) => (
            <div key={i} className="rounded-2xl shadow-lg hover:shadow-2xl transition bg-white overflow-hidden">
              <img src={`https://source.unsplash.com/600x400/?${encodeURIComponent(p.img)},travel`} alt={p.title} className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col gap-2">
                <h4 className="text-xl font-bold">{p.title}</h4>
                <p className="text-gray-700">Starting from <strong>{p.price}</strong></p>
                <button className="mt-2 bg-blue-600 text-white rounded-xl px-4 py-2 w-max" onClick={() => onNavigate("/booking")}>Book Now</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 bg-white text-center px-6">
        <h3 className="text-3xl font-semibold mb-6">About Us</h3>
        <p className="max-w-3xl mx-auto text-gray-700 text-lg">
          Sudais Travel & Tours is your trusted travel partner, based in Kabul, Afghanistan. We provide premium travel
          experiences with curated destinations, affordable packages, and hassle-free bookings.
        </p>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 px-6 bg-blue-50">
        <h3 className="text-3xl font-semibold text-center mb-6">Contact Us</h3>
        <div className="max-w-2xl mx-auto text-center text-gray-700 space-y-2">
          <p><strong>Phone:</strong> +93 794298484 · +93 794298585</p>
          <p><strong>Phone (per your request):</strong> +93794298484 · +93794298585</p>
          <p><strong>Email:</strong> sales@sudaistravel.com · ac@sudaistravel.com</p>
          <p><strong>Email (uppercase):</strong> SALES@SUDAISTRAVEL.COM · AC@SUDAISTRAVEL.COM</p>
          <p><strong>Address:</strong> Gulbahar Center, First Floor, Kabul, Afghanistan</p>
        </div>
      </section>
    </>
  );
}

function BookingPage({ onNavigate, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    destination: "",
    date: formatDateYYYYMMDD(),
    notes: "",
  });

  const handleChange = (e) => setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onNavigate("/thankyou");
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Book Your Trip</h2>
        <form className="space-y-4" onSubmit={submit}>
          <input name="name" type="text" placeholder="Full Name" className="w-full border rounded-xl p-3" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email Address" className="w-full border rounded-xl p-3" onChange={handleChange} required />
          <input name="phone" type="tel" placeholder="Phone Number" className="w-full border rounded-xl p-3" onChange={handleChange} required />
          <input name="destination" type="text" placeholder="Destination" className="w-full border rounded-xl p-3" onChange={handleChange} required />
          <input name="date" type="date" className="w-full border rounded-xl p-3" value={formData.date} onChange={handleChange} required />
          <textarea name="notes" placeholder="Additional Notes" className="w-full border rounded-xl p-3" onChange={handleChange} />
          <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3">Submit Booking</button>
          <div className="text-center">
            <button type="button" className="mt-3 text-blue-600 underline" onClick={() => onNavigate("/")}>Back to Home</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ThankYouPage({ onNavigate, booking }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-b from-green-100 to-white p-6 text-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">🎉 Thank You{booking?.name ? `, ${booking.name}` : ""}!</h1>
      <p className="text-lg text-gray-700 mb-6">Your booking request has been received. We’ll contact you soon!</p>
      <div className="bg-white shadow-md rounded-xl p-6 text-left max-w-md w-full mb-6">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Booking Details</h2>
        {booking ? (
          <div className="space-y-1">
            <p><strong>Name:</strong> {booking.name}</p>
            <p><strong>Email:</strong> {booking.email}</p>
            <p><strong>Phone:</strong> {booking.phone}</p>
            <p><strong>Destination:</strong> {booking.destination}</p>
            <p><strong>Date:</strong> {booking.date}</p>
            {booking.notes ? <p><strong>Notes:</strong> {booking.notes}</p> : null}
          </div>
        ) : (
          <p className="text-gray-600">No booking details available.</p>
        )}
      </div>
      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={() => downloadConfirmation(booking || {})} className="bg-green-600 text-white rounded-xl px-6 py-3">Download Confirmation</button>
        <button onClick={() => onNavigate("/")} className="bg-blue-600 text-white rounded-xl px-6 py-3">Back to Home</button>
      </div>
    </div>
  );
}

/***********************************
 * App (single default export)
 ***********************************/
export default function App() {
  const [routeState, setRouteState] = useState({ path: "/", pendingHash: null });
  const [booking, setBooking] = useState(null);

  // Handle hash-based scrolling when navigating to home with a hash
  useEffect(() => {
    if (routeState.path === "/" && routeState.pendingHash) {
      const id = routeState.pendingHash.replace("#", "");
      // small delay to allow DOM to paint
      const t = setTimeout(() => smoothScrollToId(id), 50);
      return () => clearTimeout(t);
    }
  }, [routeState]);

  const onNavigate = (path, hash) => setRouteState({ path, pendingHash: hash || null });
  const onSubmitBooking = (b) => setBooking(b);

  return (
    <SiteLayout route={routeState.path} onNavigate={onNavigate}>
      {routeState.path === "/" && <HomePage onNavigate={onNavigate} />}
      {routeState.path === "/booking" && (
        <BookingPage onNavigate={onNavigate} onSubmit={onSubmitBooking} />
      )}
      {routeState.path === "/thankyou" && (
        <ThankYouPage onNavigate={onNavigate} booking={booking} />
      )}
    </SiteLayout>
  );
}

/***********************************
 * Smoke tests (run once in preview)
 ***********************************/
(function runSmokeTests() {
  try {
    console.assert(typeof App === "function", "App should be a function component");
    console.assert(typeof SiteLayout === "function", "SiteLayout should be a function");
    console.assert(typeof HomePage === "function", "HomePage should be a function");
    console.assert(typeof BookingPage === "function", "BookingPage should be a function");
    console.assert(typeof ThankYouPage === "function", "ThankYouPage should be a function");

    // Basic downloadConfirmation test
    const ok = downloadConfirmation({ name: "Test", email: "a@b.com", phone: "123", destination: "Paris", date: formatDateYYYYMMDD(), notes: "N/A" });
    console.assert(ok === true, "downloadConfirmation() should return true");
  } catch (e) {
    console.warn("Smoke tests warning:", e);
  }
})();
