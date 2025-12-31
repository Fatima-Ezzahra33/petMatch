import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTheme } from "~/contexts/themeContext";

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme(); // Use the context!

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside or on a link
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Main Navbar */}
      <div
        className={`
          flex justify-between items-center p-4 fixed top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out
          ${
            isScrolled
              ? "backdrop-blur-md mx-0 mt-0 rounded-none shadow-lg"
              : "rounded-2xl mx-4 mt-4"
          }
        `}
        style={{
          backgroundColor: isScrolled
            ? isDarkMode
              ? "rgba(54, 51, 46, 0.95)"
              : "rgba(243, 240, 232, 0.95)"
            : isDarkMode
              ? "rgb(243, 240, 232,0.1)" // increased opacity
              : "rgba(146, 137, 124, 0.08)",
        }}
      >
        <Link to={"/"}>
          <img
            src={
              isDarkMode
                ? "/pet-MatchWhite.png"
                : "/pet-MatchBlack.png"
            }
            alt="pet"
            className="w-30"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="md:block hidden">
          <div className="flex gap-4 font-raleway text-lg">
            <Link
              to="/#about"
              className="hover:text-btnPrimary transition-colors"
              style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
            >
              about
            </Link>
            <a
              href="/#reviews"
              className="hover:text-btnPrimary transition-colors"
              style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
            >
              reviews
            </a>
            <Link
              to={"/#FAQ"}
              className="hover:text-btnPrimary transition-colors"
              style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
            >
              FAQ
            </Link>
            <Link
              to={"/our-pets"}
              className="hover:text-btnPrimary transition-colors"
              style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
            >
              our pets
            </Link>
            <Link
              to={"/contact"}
              className="hover:text-btnPrimary transition-colors"
              style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
            >
              contact
            </Link>
          </div>
        </div>

        {/* Right Side Buttons */}
        <div className="flex gap-4 items-center">
          {/* Desktop Buttons */}
          <div>
            <Link to="/login">
              <button className="bg-btnPrimary px-10 py-2 text-BgLight text-lg rounded-lg hover:bg-[#cb763a] hover:transition-colors active:bg-[#b26228] hover:cursor-pointer md:block hidden">
                sign in
              </button>
            </Link>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-full hover:cursor-pointer sm:w-10 sm:h-10 w-9 h-9 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: isDarkMode ? "#D9915B" : "#CCBFB1",
            }}
          >
            {isDarkMode ? (
              <i
                className="ri-sun-line sm:text-lg text-md"
                style={{ color: "#F7F5EA" }}
              ></i>
            ) : (
              <i className="ri-moon-clear-line text-moon sm:text-lg text-md"></i>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden block hover:cursor-pointer w-10 h-10"
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ color: isDarkMode ? "#F7F5EA" : "#36332E" }}
          >
            <i className="ri-menu-3-line text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 backdrop-blur-xs z-30 md:hidden"
          onClick={closeMobileMenu}
          style={{
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Sidebar */}
          <div
            className={`
              fixed top-0 right-0 h-full w-80 backdrop-blur-md 
              shadow-2xl transform transition-transform duration-300 ease-in-out
              ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
            `}
            style={{
              backgroundColor: isDarkMode
                ? "rgba(54, 51, 46, 0.98)"
                : "rgba(243, 240, 232, 0.98)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div
              className="flex justify-between items-center p-6 border-b transition-colors"
              style={{
                borderColor: isDarkMode
                  ? "rgba(247, 245, 234, 0.2)"
                  : "rgba(0, 0, 0, 0.1)",
              }}
            >
              <img
                src={
              isDarkMode
                ? "/pet-MatchWhite.png"
                : "/pet-MatchBlack.png"
            }
                alt="petMatch"
                className="w-16"
              />
              <div className="flex gap-4 items-center">
                <button
                  onClick={closeMobileMenu}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{
                    color: isDarkMode ? "#F7F5EA" : "#36332E",
                    backgroundColor: isDarkMode
                      ? "rgba(247, 245, 234, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="flex flex-col p-6 space-y-6">
              {/* Navigation Links */}
              <div className="flex flex-col space-y-4 font-raleway text-lg">
                <Link
                  to={"/"}
                  onClick={closeMobileMenu}
                  className="py-2 px-3 rounded-lg transition-colors"
                  style={{
                    color: isDarkMode ? "#F7F5EA" : "#36332E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isDarkMode
                      ? "rgba(247, 245, 234, 0.1)"
                      : "rgba(0, 0, 0, 0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  about
                </Link>
                <Link
                  to={"/#reviews"}
                  onClick={closeMobileMenu}
                  className="py-2 px-3 rounded-lg transition-colors"
                  style={{
                    color: isDarkMode ? "#F7F5EA" : "#36332E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isDarkMode
                      ? "rgba(247, 245, 234, 0.1)"
                      : "rgba(0, 0, 0, 0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  reviews
                </Link>
                <Link
                  to={"/our-pets"}
                  onClick={closeMobileMenu}
                  className="py-2 px-3 rounded-lg transition-colors"
                  style={{
                    color: isDarkMode ? "#F7F5EA" : "#36332E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isDarkMode
                      ? "rgba(247, 245, 234, 0.1)"
                      : "rgba(0, 0, 0, 0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  our pets
                </Link>
                <Link
                  to={"/contact"}
                  onClick={closeMobileMenu}
                  className="py-2 px-3 rounded-lg transition-colors"
                  style={{
                    color: isDarkMode ? "#F7F5EA" : "#36332E",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isDarkMode
                      ? "rgba(247, 245, 234, 0.1)"
                      : "rgba(0, 0, 0, 0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  contact
                </Link>
              </div>

              {/* Divider */}
              <div
                className="border-t my-4 transition-colors"
                style={{
                  borderColor: isDarkMode
                    ? "rgba(247, 245, 234, 0.2)"
                    : "rgba(0, 0, 0, 0.1)",
                }}
              ></div>
              {/* sign in button */}
              <div className="flex justify-center">
                <Link to="/login">
                  <button className="bg-btnPrimary px-10 py-2 text-BgLight text-lg rounded-lg hover:bg-[#cb763a] hover:transition-colors active:bg-[#b26228] hover:cursor-pointer">
                    sign in
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
