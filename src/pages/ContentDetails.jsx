
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/Api";

export default function ContentDetails() {
  const { id } = useParams();

  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const mediaUrls = Array.isArray(content?.mediaUrls) && content.mediaUrls.length
    ? content.mediaUrls
    : content?.mediaUrl ? [content.mediaUrl] : [];

  async function loadComments() {
    const res = await api.get(`/comments/${id}`);
    if (!Array.isArray(res.data)) {
      throw new Error("The comments response was not a list.");
    }
    setComments(res.data);
  }

  useEffect(() => {
    let active = true;
    setContent(null);
    setComments([]);
    setMessage("");

    api.get(`/contents/${id}`)
      .then(res => {
        if (!res.data || typeof res.data !== "object" || Array.isArray(res.data)) {
          throw new Error("The content response was invalid.");
        }
        if (active) setContent(res.data);
        api.post(`/contents/${id}/view`)
          .then(viewRes => {
            if (active && Number.isFinite(Number(viewRes.data?.views))) {
              setContent(current => current ? { ...current, views: Number(viewRes.data.views) } : current);
            }
          })
          .catch(() => {});
      })
      .catch(() => {
        if (active) setMessage("Content not found.");
      });

    api.get(`/comments/${id}`)
      .then(res => {
        if (!Array.isArray(res.data)) {
          throw new Error("The comments response was not a list.");
        }
        if (active) {
          setComments(res.data.filter(item => item && typeof item === "object" && !Array.isArray(item)));
        }
      })
      .catch(() => {
        if (active) setMessage("Unable to load comments.");
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function likeContent() {
    try {
      let viewerKey = localStorage.getItem("creatorViewerKey");
      if (!viewerKey) {
        viewerKey = window.crypto?.randomUUID?.() ||
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("creatorViewerKey", viewerKey);
      }
      const res = await api.post("/likes", { contentId: id, viewerKey });
      setContent(current => current
        ? { ...current, likesCount: Number(res.data?.count) || current.likesCount || 0 }
        : current);
      setMessage("Thank you for liking this content!");
    } catch {
      setMessage("Unable to like content.");
    }
  }

  async function submitComment(e) {
    e.preventDefault();

    try {
      await api.post("/comments", {
        contentId: id,
        displayName: name,
        text: comment
      });

      setComment("");
      setName("");
      setMessage("Comment submitted for approval.");
      await loadComments();
    } catch {
      setMessage("Unable to submit comment.");
    }
  }

  async function shareContent() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Content link copied!");
    } catch {
      setMessage(`Unable to copy the link. Copy this URL: ${window.location.href}`);
    }
  }

  if (!content) return <p className="container">{message || "Loading..."}</p>;

  return (
    <div className="container details">
      {(content.contentType === "image" || content.contentType === "article") && mediaUrls.length > 0 ? (
        <div className="media-gallery">
          {mediaUrls.map((url, index) => (
            <img
              src={url}
              alt={`${String(content.title || "Content")} ${index + 1}`}
              className="detail-image"
              key={url}
            />
          ))}
        </div>
      ) : (
        <img
          src={content.thumbnail || "https://placehold.co/900x400?text=Sociee"}
          alt={String(content.title || "Content")}
          className="detail-image"
        />
      )}

      <h1>{String(content.title || "Untitled content")}</h1>
      <p>{String(content.description || "")}</p>
      {content.articleContent && <p>{String(content.articleContent)}</p>}

      <p>Category: {String(content.category || "Uncategorized")}</p>
      <p>Published: {content.publicationDate
        ? Number.isNaN(new Date(content.publicationDate).getTime())
          ? "Not specified"
          : new Date(content.publicationDate).toLocaleDateString()
        : "Not specified"}</p>

      <p>Views: {Number.isFinite(Number(content.views)) ? Number(content.views) : 0}</p>
      <p>Likes: {Number.isFinite(Number(content.likesCount)) ? Number(content.likesCount) : 0}</p>

      {content.contentType === "video" && mediaUrls.length > 0 && (
        <div className="media-player-list">
          {mediaUrls.map(url => <video key={url} src={url} controls playsInline />)}
        </div>
      )}
      {content.contentType === "podcast" && mediaUrls.length > 0 && (
        <div className="media-player-list">
          {mediaUrls.map(url => <audio key={url} src={url} controls />)}
        </div>
      )}
      {mediaUrls.length === 0 && content.mediaUrl && (
        <a href={content.mediaUrl} target="_blank" rel="noreferrer">
          Open Media
        </a>
      )}

      <div className="action-buttons">
        <button onClick={likeContent}>❤️ Like</button>
        <button onClick={shareContent}>Share Content</button>
      </div>

      {message && <p>{message}</p>}

      <h2>Viewer Comments</h2>

      {comments.map(item => (
        <div className="comment-card" key={item._id || `${item.name}-${item.comment}`}>
          <strong>{String(item.displayName || item.name || "Viewer")}</strong>
          <p>{String(item.text || item.comment || "")}</p>
        </div>
      ))}

      <form onSubmit={submitComment} className="comment-form">
        <h3>Leave a Comment</h3>

        <input
          placeholder="Your display name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Write your comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          required
        />

        <button type="submit">Submit Comment</button>
      </form>
    </div>
  );
}
