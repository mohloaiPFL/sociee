
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, EyeOff, Trash2, Search, MessageSquare } from "lucide-react";
import api from "../services/Api";

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComments = useCallback(async (isActive = () => true) => {
    setLoading(true);
    try {
      const res = await api.get("/comments");
      if (!Array.isArray(res.data)) {
        throw new Error("The comments response was not a list.");
      }
      if (isActive()) {
        setComments(res.data.filter(item => item && typeof item === "object" && !Array.isArray(item)));
        setError("");
      }
    } catch {
      if (isActive()) setError("We couldn't load viewer comments.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadComments(() => active);
    return () => {
      active = false;
    };
  }, [loadComments]);

  async function moderate(id, status) {
    try {
      await api.patch(`/comments/${id}`, { status });
      setComments(items => items.map(item => item._id === id ? { ...item, status } : item));
    } catch { setError("Unable to update this comment."); }
  }

  async function deleteComment(id) {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      await api.delete(`/comments/${id}`);
      setComments(items => items.filter(item => item._id !== id));
    } catch { setError("Unable to delete this comment."); }
  }

  const visibleComments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return comments.filter(item => {
      const name = item.displayName || item.name || "Viewer";
      const text = item.text || item.comment || "";
      const statusMatches = filter === "All" || item.status === filter;
      const searchMatches = !normalizedQuery || `${name} ${text}`.toLowerCase().includes(normalizedQuery);
      return statusMatches && searchMatches;
    });
  }, [comments, filter, query]);

  const counts = {
    All: comments.length,
    Approved: comments.filter(item => item.status === "Approved").length,
    Hidden: comments.filter(item => item.status === "Hidden").length,
    Pending: comments.filter(item => item.status === "Pending").length,
  };

  return (
    <main className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">Community</span>
          <h1>Viewer comments</h1>
          <p>Review conversations and keep your community welcoming.</p>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="comment-toolbar">
        <div className="filter-tabs" aria-label="Filter comments">
          {["All", "Approved", "Pending", "Hidden"].map(status => (
            <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>
              {status} <span>{counts[status] || 0}</span>
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search comments" />
        </label>
      </div>

      <section className="comment-list" aria-live="polite">
        {loading ? <div className="loading-state">Loading comments…</div> : visibleComments.length === 0 ? (
          <div className="empty-state">
            <span><MessageSquare size={24} /></span>
            <h2>No comments found</h2>
            <p>Try another filter or search term.</p>
          </div>
        ) : visibleComments.map((item, index) => {
          const name = String(item.displayName || item.name || "Viewer");
          const text = String(item.text || item.comment || "");
          const status = String(item.status || "Approved");
          const title = typeof item.contentId === "object"
            ? String(item.contentId?.title || "Viewer response")
            : "Viewer response";
          const statusClass = String(status).toLowerCase();
          return (
            <article className="comment-row" key={item._id || `${name}-${text}-${index}`}>
              <div className="comment-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</div>
              <div className="comment-content">
                <div className="comment-meta"><strong>{name}</strong><span>{title}</span></div>
                <p>{text}</p>
                <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Recently submitted"}</small>
              </div>
              <div className="comment-actions">
                <span className={`status-pill ${statusClass}`}>{String(status)}</span>
                {status !== "Approved" && <button className="icon-action approve" title="Approve comment" onClick={() => moderate(item._id, "Approved")}><Check size={17} /></button>}
                {status !== "Hidden" && <button className="icon-action" title="Hide comment" onClick={() => moderate(item._id, "Hidden")}><EyeOff size={17} /></button>}
                <button className="icon-action danger" title="Delete comment" onClick={() => deleteComment(item._id)}><Trash2 size={17} /></button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
