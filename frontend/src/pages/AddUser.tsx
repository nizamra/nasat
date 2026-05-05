import { useState } from "react";
import { useNavigate } from "react-router-dom";

type UserFormData = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  title: string;
  bio: string;
  location: string;
  birth_date: string;
  avatar: File | null;
};

export default function AddUser() {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    title: "",
    bio: "",
    location: "",
    birth_date: "",
    avatar: null,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append("username", formData.username);
      submitData.append("email", formData.email);
      submitData.append("password", formData.password);
      submitData.append("first_name", formData.first_name);
      submitData.append("last_name", formData.last_name);
      submitData.append("title", formData.title);
      submitData.append("bio", formData.bio);
      submitData.append("location", formData.location);
      submitData.append("birth_date", formData.birth_date);
      if (formData.avatar) {
        submitData.append("avatar", formData.avatar);
      }

      const response = await fetch("/api/users/", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.message || "Failed to create user"
        );
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/explore");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create user. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-container">
      <div className="add-user-header">
        <h1>Add New User</h1>
        <p className="text-muted">Create a new user profile with complete information</p>
      </div>

      {success && (
        <div className="success-banner">
          ✓ User created successfully! Redirecting...
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

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="input-field"
              placeholder="johndoe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field"
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input-field"
              placeholder="••••••••"
              required
            />
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

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Creating User..." : "Create User"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/explore")}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
