
import { useCallback, useEffect, useState } from "react";
import api from "../services/Api";

const initialForm = {
  title: "",
  description: "",
  category: "Education",
  contentType: "video",
  thumbnail: "",
  mediaUrl: "",
  mediaUrls: [],
  articleContent: "",
  status: "Draft",
  publicationDate: ""
};

export default function ManageContent() {
  const [contents, setContents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => {
    mediaPreviews.forEach(preview => URL.revokeObjectURL(preview.url));
  }, [mediaPreviews]);

  const loadContent = useCallback(async () => {
    const res = await api.get("/contents?all=true");
    if (!Array.isArray(res.data)) {
      throw new Error("The content response was not a list.");
    }
    setContents(res.data.filter(item => item && typeof item === "object" && !Array.isArray(item)));
  }, []);

  useEffect(() => {
    let active = true;
    loadContent().catch(() => {
      if (active) setMessage("Unable to load content.");
    });
    return () => {
      active = false;
    };
  }, [loadContent]);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function editContent(item) {
    setEditingId(item._id);
    const publicationDate = item.publicationDate ? new Date(item.publicationDate) : null;

    setForm({
      title: String(item.title || ""),
      description: String(item.description || ""),
      category: String(item.category || "Education"),
      contentType: String(item.contentType || item.type || "video").toLowerCase(),
      thumbnail: String(item.thumbnail || ""),
      mediaUrl: String(item.mediaUrl || ""),
      mediaUrls: Array.isArray(item.mediaUrls)
        ? item.mediaUrls
        : [],
      articleContent: String(item.articleContent || ""),
      status: String(item.status || "Draft"),
      publicationDate: publicationDate && !Number.isNaN(publicationDate.getTime())
        ? publicationDate.toISOString().slice(0, 16)
        : ""
    });
    setMediaFiles([]);
    setMediaPreviews([]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseMedia(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length > 10) {
      setMessage("Choose no more than 10 media files.");
      return;
    }
    if (files.some(file => !/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp4|wav|ogg|webm))$/.test(file.type))) {
      setMessage("Choose supported photos, videos, or audio files.");
      return;
    }
    if (files.some(file => file.size > 12 * 1024 * 1024)) {
      setMessage("Each media file must be 12 MB or smaller.");
      return;
    }
    setMessage("");
    setMediaFiles(files);
    setMediaPreviews(files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name
    })));
  }

  async function saveContent(e) {
    e.preventDefault();
    setUploading(true);

    try {
      let mediaUrls = form.mediaUrls || [];
      if (mediaFiles.length) {
        const upload = new FormData();
        mediaFiles.forEach(file => upload.append("files", file));
        const uploadResponse = await api.post("/media/upload", upload);
        const uploaded = uploadResponse.data?.files;
        if (!Array.isArray(uploaded) || uploaded.length !== mediaFiles.length) {
          throw new Error("The server did not confirm every uploaded file.");
        }
        mediaUrls = [
          ...mediaUrls,
          ...uploaded.map(file => new URL(file.url, api.defaults.baseURL).toString())
        ];
      }

      const firstUploadedImage = mediaFiles.find(file => file.type.startsWith("image"));
      const uploadedImageUrl = firstUploadedImage
        ? mediaUrls[mediaUrls.length - mediaFiles.length + mediaFiles.indexOf(firstUploadedImage)]
        : "";
      const contentData = {
        ...form,
        mediaUrls,
        mediaUrl: mediaUrls[0] || form.mediaUrl || "",
        thumbnail: form.thumbnail || uploadedImageUrl || ""
      };

      if (editingId) {
        await api.put(`/contents/${editingId}`, contentData);
      } else {
        await api.post("/contents", contentData);
      }
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || requestError.message || "Unable to save content.");
      setUploading(false);
      return;
    }

    setForm(initialForm);
    setEditingId(null);
    setMediaFiles([]);
    setMediaPreviews([]);
    try {
      await loadContent();
      setMessage(editingId ? "Content updated successfully!" : "Content added successfully!");
    } catch {
      setMessage("Content saved, but the list could not be refreshed.");
    }
    setUploading(false);
  }

  async function deleteContent(id) {
    if (!window.confirm("Are you sure you want to delete this content?")) {
      return;
    }

    try {
      await api.delete(`/contents/${id}`);
    } catch {
      setMessage("Unable to delete content.");
      return;
    }

    try {
      await loadContent();
      setMessage("Content deleted successfully!");
    } catch {
      setMessage("Content deleted, but the list could not be refreshed.");
    }
  }

  return (
    <div className="container">
      <h1>Manage Content</h1>

      <form className="content-form" onSubmit={saveContent}>
        <h2>{editingId ? "Edit Content" : "Add New Content"}</h2>

        <label>Content Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter title"
          required
        />

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your content"
          required
        />

        <label>Category</label>
        <select name="category" value={form.category} onChange={handleChange}>
          <option>Education</option>
          <option>Technology</option>
          <option>Entertainment</option>
          <option>Lifestyle</option>
          <option>Business</option>
        </select>

        <label>Content Type</label>
        <select
          name="contentType"
          value={form.contentType}
          onChange={handleChange}
        >
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="image">Image</option>
          <option value="podcast">Podcast</option>
        </select>

        <label>Upload photos or media from this device</label>
        <input
          type="file"
          name="mediaFiles"
          accept={
            form.contentType === "image"
              ? "image/*"
              : form.contentType === "video"
                ? "video/*"
                : form.contentType === "podcast"
                  ? "audio/*"
                    : form.contentType === "article"
                      ? "image/*"
                      : "image/*,video/*,audio/*"
          }
          multiple
          onChange={chooseMedia}
        />
        <small>Choose up to 10 photos or media files, up to 12 MB each. On phones, choose from your gallery or camera when available.</small>
        {mediaPreviews.length > 0 && (
          <div className="media-previews">
            {mediaPreviews.map(preview => preview.type.startsWith("image") ? (
              <img src={preview.url} alt={`Preview of ${preview.name}`} key={preview.url} />
            ) : preview.type.startsWith("video") ? (
              <video src={preview.url} controls key={preview.url} />
            ) : (
              <audio src={preview.url} controls key={preview.url} />
            ))}
          </div>
        )}

        <label>Thumbnail URL (optional)</label>
        <input
          name="thumbnail"
          value={form.thumbnail}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />

        <label>External media URL (optional)</label>
        <input
          name="mediaUrl"
          value={form.mediaUrl}
          onChange={handleChange}
          placeholder="Video or article URL"
        />

        <label>Article Content</label>
        <textarea
          name="articleContent"
          value={form.articleContent}
          onChange={handleChange}
          placeholder="Optional written article content"
          maxLength={100000}
        />

        <label>Publication Date</label>
        <input
          type="datetime-local"
          name="publicationDate"
          value={form.publicationDate}
          onChange={handleChange}
        />

        <label>Content Status</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Scheduled">Scheduled</option>
        </select>

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading and saving..." : editingId ? "Update Content" : "Save Content"}
        </button>

        {editingId && (
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
            }}
          >
            Cancel Editing
          </button>
        )}

        {message && <p>{message}</p>}
      </form>

      <h2>Existing Content</h2>

      <div className="content-list">
        {contents.map((item, index) => (
          <div className="manage-card" key={item._id || index}>
            <div>
              {item.thumbnail && <img className="manage-thumbnail" src={item.thumbnail} alt="" />}
              <h3>{String(item.title || "Untitled content")}</h3>
              <p>{String(item.category || "Uncategorized")} | {String(item.contentType || item.type || "")}</p>
              <span className="category">{String(item.status || "Draft")}</span>
            </div>

            <div className="action-buttons">
              <button disabled={!item._id} onClick={() => editContent(item)}>
                Edit
              </button>

              <button
                className="delete-btn"
                disabled={!item._id}
                onClick={() => deleteContent(item._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
