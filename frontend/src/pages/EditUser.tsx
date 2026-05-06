import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

type SocialLink = {
  platform: string;
  url: string;
};

type UserFormData = {
  first_name: string;
  last_name: string;
  title: string;
  bio: string;
  location: string;
  birth_date: string;
  avatar: File | null;
  social_links: SocialLink[];
};

export default function EditUser() {
  const { username } = useParams();
  const [formData, setFormData] = useState<UserFormData>({
    first_name: "",
    last_name: "",
    title: "",
    bio: "",
    location: "",
    birth_date: "",
    avatar: null,
    social_links: [],
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newSocialLink, setNewSocialLink] = useState<SocialLink>({ platform: "instagram", url: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://staging.nasat.local/api/users/${username}/`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const data = await response.json();
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          title: data.title || "",
          bio: data.bio || "",
          location: data.location || "",
          birth_date: data.birth_date || "",
          avatar: null,
          social_links: data.social_links || [],
        });
        if (data.avatar) {
          setAvatarPreview(data.avatar);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load user data");
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: file,
      }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSocialLink = () => {
    if (newSocialLink.url.trim()) {
      setFormData(prev => ({
        ...prev,
        social_links: [...prev.social_links, { ...newSocialLink }],
      }));
      setNewSocialLink({ platform: "instagram", url: "" });
    }
  };

  const handleRemoveSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append("first_name", formData.first_name);
      submitData.append("last_name", formData.last_name);
      submitData.append("title", formData.title);
      submitData.append("bio", formData.bio);
      submitData.append("location", formData.location);
      submitData.append("birth_date", formData.birth_date);
      if (formData.avatar) {
        submitData.append("avatar", formData.avatar);
      }

      // Add social links
      formData.social_links.forEach((link, index) => {
        submitData.append(`social_links[${index}][platform]`, link.platform);
        submitData.append(`social_links[${index}][url]`, link.url);
      });

      const response = await fetch(`http://staging.nasat.local/api/users/${username}/`, {
        method: "PATCH",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.message || "Failed to update user"
        );
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/profile/${username}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update user. Please try again.");
      console.error("Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-user-container">
        <div className="add-user-header">
          <h1>Edit Profile</h1>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-user-container">
      <div className="add-user-header">
        <h1>Edit Profile</h1>
        <p className="text-muted">Update your profile information</p>
      </div>

      {success && (
        <div className="success-banner">
          ✓ Profile updated successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="error-banner">
          ✗ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-user-form">
        {/* Avatar Section */}
        <div className="form-section">
          <h3>Profile Picture</h3>
          <div className="avatar-upload-container">
            <div className="avatar-upload-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="avatar-preview-img" />
              ) : (
                <div className="avatar-placeholder">
                  <span className="placeholder-icon">📷</span>
                  <p>No image selected</p>
                </div>
              )}
            </div>
            <div className="avatar-upload-input">
              <label htmlFor="avatar" className="upload-label">
                Choose Avatar
              </label>
              <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="file-input"
              />
              <p className="text-muted">JPG, PNG or GIF (Max 5MB)</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="John"
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="form-section">
          <h3>Personal Details</h3>
          <div className="form-group">
            <label htmlFor="title">Title / Profession</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Software Engineer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="input-field"
                placeholder="New York, USA"
              />
            </div>
            <div className="form-group">
              <label htmlFor="birth_date">Birth Date</label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="form-section">
          <h3>Social Links</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="platform">Platform</label>
              <select
                id="platform"
                value={newSocialLink.platform}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, platform: e.target.value }))}
                className="input-field"
              >
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="X">X (Twitter)</option>
                <option value="facebook">Facebook</option>
                <option value="github">GitHub</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="url">URL / Handle</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <input
                  type="text"
                  id="url"
                  value={newSocialLink.url}
                  onChange={(e) => setNewSocialLink(prev => ({ ...prev, url: e.target.value }))}
                  className="input-field"
                  placeholder="https://instagram.com/username or @username"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddSocialLink}
                  style={{ padding: '12px 16px', marginBottom: 0 }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {formData.social_links.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>Added Links:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.social_links.map((link, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: 'var(--bg-input)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>
                      <strong>{link.platform}:</strong> {link.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialLink(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0 8px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Updating Profile..." : "Update Profile"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/profile/${username}`)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
