
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/Api";

export default function Dashboard() {
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({ name: "", bio: "", profileImage: "" });
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [stats, setStats] = useState({
    totalContent: 0,
    published: 0,
    drafts: 0,
    comments: 0,
    views: 0,
    likes: 0
  });

  useEffect(() => {
    let active = true;
    api.get("/dashboard/stats")
      .then(res => {
        if (!res.data || typeof res.data !== "object" || Array.isArray(res.data)) {
          throw new Error("The dashboard response was invalid.");
        }
        if (active) setStats(current => ({ ...current, ...res.data }));
      })
      .catch(() => {
        if (active) setError("Unable to load dashboard statistics.");
      });

    api.get("/profile/me")
      .then(res => {
        if (active && res.data && typeof res.data === "object") setProfile(res.data);
      })
      .catch(() => {
        if (active) setProfileMessage("Unable to load creator profile.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (profilePreview) URL.revokeObjectURL(profilePreview);
  }, [profilePreview]);

  function chooseProfileImage(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    if (!/^(image\/(jpeg|png|webp|gif))$/.test(file.type)) {
      setProfileMessage("Choose a JPG, PNG, WebP, or GIF profile picture.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setProfileMessage("Profile pictures must be 3 MB or smaller.");
      return;
    }
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setProfileMessage("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    try {
      let profileImage = profile.profileImage;
      if (profileFile) {
        const formData = new FormData();
        formData.append("files", profileFile);
        const uploadResponse = await api.post("/media/upload", formData);
        const uploadedFile = uploadResponse.data?.files?.[0];
        if (!uploadedFile?.url) {
          throw new Error("The server did not confirm the profile picture upload.");
        }
        profileImage = new URL(uploadedFile.url, api.defaults.baseURL).toString();
      }

      const response = await api.put("/profile/me", {
        displayName: profile.name,
        bio: profile.bio,
        profileImage
      });
      setProfile(response.data.profile);
      setProfileFile(null);
      setProfilePreview("");
      setProfileMessage("Profile saved successfully.");
      window.dispatchEvent(new Event("sociee:profile-updated"));
    } catch (requestError) {
      setProfileMessage(requestError.response?.data?.message || requestError.message || "Unable to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  const cards = [
    ["Total Content", stats.totalContent, "📚"],
    ["Published", stats.published, "🌍"],
    ["Drafts", stats.drafts, "📝"],
    ["Comments", stats.comments, "💬"],
    ["Total Views", stats.views, "👁️"],
    ["Total Likes", stats.likes, "❤️"]
  ];

  return (
    <div className="container dashboard">
      <h1>Creator Dashboard</h1>
      <p>Welcome back! Manage your content and track performance.</p>
      {error && <p className="error" role="alert">{error}</p>}

      <div className="stats-grid">
        {cards.map(([title, number, icon]) => (
          <div className="stat-card" key={title}>
            <span>{icon}</span>
            <h3>{Number.isFinite(Number(number)) ? Number(number) : 0}</h3>
            <p>{title}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-actions">
        <Link to="/manage-content" className="primary-btn">
          + Manage Content
        </Link>

        <Link to="/comments" className="primary-btn">
          View Comments
        </Link>
      </div>

      <section className="profile-editor">
        <h2>Creator profile</h2>
        <p>Update your public name, bio, and profile picture shown with your posts.</p>
        <form className="content-form" onSubmit={saveProfile}>
          <label htmlFor="creator-name">Display name</label>
          <input
            id="creator-name"
            value={profile.name}
            maxLength={100}
            required
            onChange={event => setProfile(current => ({ ...current, name: event.target.value }))}
          />

          <label htmlFor="creator-bio">Bio</label>
          <textarea
            id="creator-bio"
            value={profile.bio}
            maxLength={1000}
            rows={3}
            onChange={event => setProfile(current => ({ ...current, bio: event.target.value }))}
          />

          <label htmlFor="creator-profile-image">Profile picture</label>
          {(profilePreview || profile.profileImage) && (
            <img
              className="profile-editor-image"
              src={profilePreview || profile.profileImage}
              alt="Creator avatar preview"
            />
          )}
          <input
            id="creator-profile-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={chooseProfileImage}
          />
          {profileMessage && <p role="status">{profileMessage}</p>}
          <button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving profile..." : "Save profile"}
          </button>
        </form>
      </section>
    </div>
  );
}
