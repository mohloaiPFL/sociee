
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/Api";

function imageSource(value) {
  if (!value) return "";
  try {
    return new URL(value, api.defaults.baseURL).toString();
  } catch {
    return "";
  }
}

function publishedTime(item) {
  const value = item.publicationDate || item.publishedAt || item.createdAt;
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PostHeader({ item }) {
  const creatorName = String(item.creator?.name || "Sociee Creator");
  const profileImage = imageSource(item.creator?.profileImage);
  const creatorLink = item.creator?.id ? `/creator/${item.creator.id}` : null;

  return (
    <div className="post-header">
      {creatorLink ? (
        <Link className="post-creator-link" to={creatorLink} aria-label={`View ${creatorName}'s profile`}>
          {profileImage ? (
            <img className="post-avatar" src={profileImage} alt="" />
          ) : (
            <span className="post-avatar post-avatar-fallback" aria-hidden="true">
              {creatorName.charAt(0).toUpperCase()}
            </span>
          )}
          <strong>{creatorName}</strong>
        </Link>
      ) : profileImage ? (
        <img className="post-avatar" src={profileImage} alt={`${creatorName} profile`} />
      ) : (
        <span className="post-avatar post-avatar-fallback" aria-hidden="true">
          {creatorName.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="post-creator">
        {!creatorLink && <strong>{creatorName}</strong>}
        <time dateTime={item.publicationDate || item.publishedAt || item.createdAt || undefined}>
          {publishedTime(item)}
        </time>
      </div>
    </div>
  );
}

function thumbnailFor(item) {
  const isImage = String(item.contentType || item.type || "").toLowerCase() === "image";
  return imageSource(item.thumbnail ||
    (isImage ? item.mediaUrls?.[0] || item.mediaUrl : "") ||
    "https://placehold.co/900x400?text=Sociee");
}

export default function Home() {
  const [contents, setContents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({
    name: "Sociee",
    bio: "Discover, learn and connect with amazing content.",
    profileImage: ""
  });

  useEffect(() => {
    let active = true;

    api.get("/contents")
      .then(res => {
        if (!Array.isArray(res.data)) {
          throw new Error("The content response was not a list.");
        }
        if (active) {
          setContents(res.data.filter(item => item && typeof item === "object" && !Array.isArray(item)));
        }
      })
      .catch(() => {
        if (active) setError("Unable to load content.");
      });

    api.get("/profile")
      .then(res => {
        if (active && res.data && typeof res.data === "object") {
          setProfile(current => ({ ...current, ...res.data }));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const filtered = contents.filter(item => {
    const title = String(item.title ?? "");
    const description = String(item.description ?? "");
    const matchesSearch = `${title} ${description}`.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || item.category === category;

    return matchesSearch && matchesCategory;
  });
  const featured = contents[0];
  const creatorName = String(featured?.creator?.name || profile.name || "Sociee Creator");
  const creatorBio = String(
    featured?.creator?.bio || profile.bio || "Discover, learn and connect with amazing content."
  );
  const creatorImage = imageSource(featured?.creator?.profileImage || profile.profileImage);

  return (
    <div>
      <section className="hero">
        <h1>Welcome to Sociee</h1>
        <div className="home-creator-profile">
          {creatorImage ? (
            <img src={creatorImage} alt={`${creatorName} profile`} />
          ) : (
            <span className="home-creator-logo" role="img" aria-label={`${creatorName} logo`}>
              S
            </span>
          )}
          <div>
            <strong>{creatorName}</strong>
            <p>{creatorBio}</p>
          </div>
        </div>
        <a href="#content" className="primary-btn">
          Explore Content
        </a>
      </section>

      {featured && (
        <section className="container">
          <h2>Featured Content</h2>
          <div className="content-card">
            <PostHeader item={featured} />
            <img
              src={thumbnailFor(featured)}
              alt={String(featured.title || "Featured content")}
            />
            <div className="card-body">
              <span className="category">{String(featured.category || "Uncategorized")}</span>
              <h3>{String(featured.title || "Untitled content")}</h3>
              <p>{String(featured.description || "")}</p>
              {(featured._id || featured.id) && (
                <Link to={`/content/${featured._id || featured.id}`} className="primary-btn">
                  Explore featured content
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="container" id="content">
        <h2>Explore Content</h2>

        <input
          className="search-input"
          placeholder="Search content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="search-input"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option>All</option>
          <option>Education</option>
          <option>Technology</option>
          <option>Entertainment</option>
          <option>Lifestyle</option>
          <option>Business</option>
        </select>

        {error && <p>{error}</p>}

        <div className="content-grid">
          {filtered.map((item, index) => {
            const id = item._id ?? item.id;
            const title = String(item.title ?? "Untitled content");
            const description = String(item.description ?? "");
            const likesCount = Number(item.likesCount);

            return (
              <div className="content-card" key={id ?? index}>
                <PostHeader item={item} />
                <img
                  src={thumbnailFor(item)}
                  alt={title}
                />

                <div className="card-body">
                  <span className="category">{String(item.category ?? "Uncategorized")}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>

                  <p>❤️ {Number.isFinite(likesCount) ? likesCount : 0} Likes</p>

                  {id != null && (
                    <Link to={`/content/${id}`} className="primary-btn">
                      View Content
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p>No content found.</p>
        )}
      </section>
    </div>
  );
}
