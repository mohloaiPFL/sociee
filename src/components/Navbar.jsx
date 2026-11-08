
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, ArrowUpRight } from "lucide-react";
import api from "../services/Api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = !!localStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    let active = true;
    const loadCreator = () => {
      const request = localStorage.getItem("token")
        ? api.get("/profile/me")
        : api.get("/contents")
          .then(response => {
            const featuredCreator = Array.isArray(response.data)
              ? response.data[0]?.creator
              : null;
            return featuredCreator?.name
              ? { data: featuredCreator }
              : api.get("/profile");
          })
          .catch(() => api.get("/profile"));

      request
        .then(response => {
          if (active && response.data && typeof response.data === "object") {
            setCreator({
              id: response.data.id || "",
              name: response.data.name || "Sociee Creator",
              profileImage: response.data.profileImage || ""
            });
          }
        })
        .catch(() => {
          if (active) setCreator(null);
        });
    };

    loadCreator();
    window.addEventListener("sociee:profile-updated", loadCreator);
    return () => {
      active = false;
      window.removeEventListener("sociee:profile-updated", loadCreator);
    };
  }, [location.pathname]);

  const creatorImage = creator?.profileImage
    ? new URL(creator.profileImage, api.defaults.baseURL).toString()
    : "";

  function logout() {
    localStorage.removeItem("token");
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="topbar">
      <Link to="/" className="brand" onClick={() => setOpen(false)}>
        <span className="brand-mark">S</span>
        <span>Sociee</span>
      </Link>

      <button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={`nav-links ${open ? "open" : ""}`}>
        <NavLink to="/" end onClick={() => setOpen(false)}>Discover</NavLink>
        {loggedIn ? (
          <>
            <NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink>
            <NavLink to="/manage-content" onClick={() => setOpen(false)}>Content</NavLink>
            <NavLink to="/comments" onClick={() => setOpen(false)}>Comments</NavLink>
            <button className="nav-action logout-btn" onClick={logout}><LogOut size={16} /> Sign out</button>
          </>
        ) : (
          <Link className="nav-action" to="/login" onClick={() => setOpen(false)}>Creator login <ArrowUpRight size={16} /></Link>
        )}
        {creator && (
          <Link
            className="nav-profile"
            to={creator.id ? `/creator/${creator.id}` : loggedIn ? "/dashboard" : "/"}
            onClick={() => setOpen(false)}
            aria-label={`Creator profile: ${creator.name}`}
          >
            {creatorImage ? (
              <img src={creatorImage} alt="" />
            ) : (
              <span className="nav-profile-fallback" aria-hidden="true">
                {String(creator.name).charAt(0).toUpperCase()}
              </span>
            )}
            <span className="nav-profile-name">{creator.name}</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
