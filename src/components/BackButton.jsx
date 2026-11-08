import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastPath = useRef(null);
  const previousPath = useRef(null);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    if (lastPath.current && lastPath.current !== currentPath) {
      previousPath.current = lastPath.current;
    }
    lastPath.current = currentPath;
  }, [location.pathname, location.search, location.hash]);

  if (location.pathname === "/") return null;

  const previous = previousPath.current;
  const protectedRedirect = location.pathname === "/login" &&
    ["/dashboard", "/manage-content", "/comments"].includes(previous);
  const target = protectedRedirect ? "/" : previous || "/";
  const canGoBack = Boolean(previous) || location.key !== "default" || location.pathname !== "/";

  return (
    <div className="back-button-wrap">
      <button
        type="button"
        className="back-button"
        disabled={!canGoBack}
        onClick={() => {
          if (previous) navigate(target);
          else if (location.key !== "default") navigate(-1);
          else navigate("/");
        }}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Back
      </button>
    </div>
  );
}
