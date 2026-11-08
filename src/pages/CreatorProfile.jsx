import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import api from "../services/Api";

function mediaSource(value) {
  if (!value) return "";
  try {
    return new URL(value, api.defaults.baseURL).toString();
  } catch {
    return "";
  }
}

function postImage(post) {
  const image = post.thumbnail || (
    post.contentType === "image" ? post.mediaUrls?.[0] || post.mediaUrl : ""
  );
  return mediaSource(image);
}

export default function CreatorProfile() {
  const { creatorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setProfile(null);
    setPosts([]);
    setError("");

    api.get(`/profile/${creatorId}`)
      .then(response => {
        if (!response.data?.profile || !Array.isArray(response.data.posts)) {
          throw new Error("The creator profile response was invalid.");
        }
        if (active) {
          setProfile(response.data.profile);
          setPosts(response.data.posts);
        }
      })
      .catch(requestError => {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load this creator profile.");
        }
      });

    return () => {
      active = false;
    };
  }, [creatorId]);

  if (error) {
    return (
      <main className="container creator-profile-page">
        <p className="error" role="alert">{error}</p>
        <Link className="primary-btn" to="/">Explore Sociee</Link>
      </main>
    );
  }

  if (!profile) {
    return <main className="container creator-profile-page"><p role="status">Loading creator profile...</p></main>;
  }

  const avatar = mediaSource(profile.profileImage);

  return (
    <main className="container creator-profile-page">
      <section className="creator-profile-heading">
        {avatar ? (
          <img className="creator-profile-avatar" src={avatar} alt={`${profile.name} profile`} />
        ) : (
          <span className="creator-profile-avatar creator-profile-avatar-fallback" aria-hidden="true">
            {String(profile.name || "S").charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="section-kicker">Creator profile</p>
          <h1>{String(profile.name || "Sociee Creator")}</h1>
          <p className="creator-profile-bio">{String(profile.bio || "Discover this creator's latest posts.")}</p>
          <p className="creator-profile-post-count">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </section>

      <section className="creator-posts-section">
        <h2>Posts</h2>
        {posts.length ? (
          <div className="creator-post-grid">
            {posts.map(post => {
              const postId = post._id || post.id;
              const image = postImage(post);
              return (
                <article className="creator-post-card" key={postId}>
                  <Link className="creator-post-media" to={`/content/${postId}`}>
                    {image ? (
                      <img src={image} alt={String(post.title || "Creator post")} />
                    ) : (
                      <span className="creator-post-placeholder">
                        {String(post.contentType || post.type || "Post")}
                      </span>
                    )}
                  </Link>
                  <div className="creator-post-content">
                    <span className="category">{String(post.category || "Uncategorized")}</span>
                    <h3>{String(post.title || "Untitled post")}</h3>
                    <p>{String(post.description || "")}</p>
                    <div className="creator-post-engagement" aria-label="Post engagement">
                      <span><Heart size={17} aria-hidden="true" /> {Number(post.likesCount) || 0} likes</span>
                      <span><MessageCircle size={17} aria-hidden="true" /> {Number(post.commentsCount) || 0} comments</span>
                    </div>
                    <Link className="primary-btn" to={`/content/${postId}`}>
                      View post &amp; comments
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="creator-profile-empty">This creator hasn’t published any posts yet.</p>
        )}
      </section>
    </main>
  );
}
