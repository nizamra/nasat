import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RELATION_TYPES, IMPLIED_SEX, type Sex } from "../constants/relations";

type SocialLink = {
  platform: string;
  url: string;
};

type RelatedPerson = {
  first_name: string;
  last_name: string;
  sex: Sex;
  relation_type: string;
  height_cm: number | null;
  weight_kg: number | null;
  start_date?: string;
  end_date?: string;
  date_precision?: string;
};

type UserFormData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  sex: Sex;
  title: string;
  bio: string;
  location: string;
  birth_date: string;
  birth_date_precision: string;
  death_date: string;
  death_date_precision: string;
  place_of_birth: string;
  current_city: string;
  height_cm: string;
  weight_kg: string;
  avatar: File | null;
  social_links: SocialLink[];
  relations: RelatedPerson[];
};

export default function AddUser() {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    sex: "",
    title: "",
    bio: "",
    location: "",
    birth_date: "",
    birth_date_precision: "exact",
    death_date: "",
    death_date_precision: "exact",
    place_of_birth: "",
    current_city: "",
    height_cm: "",
    weight_kg: "",
    avatar: null,
    social_links: [],
    relations: [],
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newSocialLink, setNewSocialLink] = useState<SocialLink>({ platform: "instagram", url: "" });
  const [newRelation, setNewRelation] = useState<RelatedPerson>({
    first_name: "",
    last_name: "",
    sex: "",
    relation_type: "mother",
    height_cm: null,
    weight_kg: null,
    start_date: "",
    end_date: "",
    date_precision: "exact",
  });
  const [relationError, setRelationError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  const impliedSex = IMPLIED_SEX[newRelation.relation_type] || "";

  const handleRelationTypeChange = (relation_type: string) => {
    setNewRelation(prev => ({
      ...prev,
      relation_type,
      // keep sex in sync when the relation implies it (mother -> female)
      sex: IMPLIED_SEX[relation_type] || prev.sex,
    }));
  };

  const handleAddRelation = () => {
    if (!newRelation.first_name.trim()) {
      setRelationError("Name is required.");
      return;
    }
    if (!newRelation.sex) {
      setRelationError("Please choose a sex.");
      return;
    }
    setRelationError("");
    setFormData(prev => ({
      ...prev,
      relations: [
        ...prev.relations,
        { ...newRelation, first_name: newRelation.first_name.trim(), last_name: newRelation.last_name.trim() },
      ],
    }));
    setNewRelation({ first_name: "", last_name: "", sex: "", relation_type: "mother", height_cm: null, weight_kg: null, start_date: "", end_date: "", date_precision: "exact" });
  };

  const handleRemoveRelation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      relations: prev.relations.filter((_, i) => i !== index),
    }));
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
      submitData.append("first_name", formData.first_name);
      submitData.append("last_name", formData.last_name);
      submitData.append("sex", formData.sex);
      submitData.append("title", formData.title);
      submitData.append("bio", formData.bio);
      submitData.append("location", formData.location);
      submitData.append("birth_date", formData.birth_date);
      submitData.append("birth_date_precision", formData.birth_date_precision);
      submitData.append("death_date", formData.death_date);
      submitData.append("death_date_precision", formData.death_date_precision);
      submitData.append("place_of_birth", formData.place_of_birth);
      submitData.append("current_city", formData.current_city);
      submitData.append("height_cm", formData.height_cm);
      submitData.append("weight_kg", formData.weight_kg);
      if (formData.avatar) {
        submitData.append("avatar", formData.avatar);
      }
      // Related people are created by the backend in the same transaction
      if (formData.relations.length > 0) {
        submitData.append("relations", JSON.stringify(formData.relations.map(relation => ({
          ...relation,
          start_date: relation.start_date || null,
          end_date: relation.end_date || null,
        }))));
      }

      const response = await fetch("/api/users/", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const fieldErrors = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
          .join("; ");
        throw new Error(
          errorData.detail || errorData.message || fieldErrors || "Failed to create user"
        );
      }

      const userData = await response.json();

      // Add social links after user is created
      if (formData.social_links.length > 0) {
        for (const link of formData.social_links) {
          const socialLinkData = new FormData();
          socialLinkData.append("user", userData.id);
          socialLinkData.append("platform", link.platform);
          socialLinkData.append("url", link.url);

          const socialResponse = await fetch("/api/social-links/", {
            method: "POST",
            body: socialLinkData,
          });

          if (!socialResponse.ok) {
            console.error("Failed to add social link:", link.platform);
          }
        }
      }

      setSuccess(true);
      setError("");
      
      // Redirect after short delay
      setTimeout(() => {
        navigate("/explore");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-container">
      <h2>Add New Person</h2>
      
      {success && (
        <div className="success-banner">
          ✓ Person added successfully! Redirecting...
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
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="birth_date_precision">Birth date precision</label>
              <select id="birth_date_precision" name="birth_date_precision" className="input-field" value={formData.birth_date_precision} onChange={handleInputChange}>
                <option value="exact">Exact</option><option value="day_approximate">Approximate day</option>
                <option value="month">Month only</option><option value="year">Year only</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="death_date">Date of death</label>
              <input type="date" id="death_date" name="death_date" value={formData.death_date} onChange={handleInputChange} className="input-field" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="death_date_precision">Death date precision</label>
              <select id="death_date_precision" name="death_date_precision" className="input-field" value={formData.death_date_precision} onChange={handleInputChange}>
                <option value="exact">Exact</option><option value="day_approximate">Approximate day</option>
                <option value="month">Month only</option><option value="year">Year only</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="place_of_birth">Place of birth</label>
              <input id="place_of_birth" name="place_of_birth" value={formData.place_of_birth} onChange={handleInputChange} className="input-field" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="current_city">Current city</label>
            <input id="current_city" name="current_city" value={formData.current_city} onChange={handleInputChange} className="input-field" />
          </div>

          <div className="form-group">
            <label htmlFor="sex">Sex</label>
            <select
              id="sex"
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="">-- Select --</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Leave empty to generate automatically"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field"
              placeholder="john@example.com"
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
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="height_cm">Height (cm)</label>
              <input
                type="number" id="height_cm" name="height_cm"
                min="1" step="1" value={formData.height_cm}
                onChange={handleInputChange} className="input-field"
              />
            </div>
            <div className="form-group">
              <label htmlFor="weight_kg">Weight (kg)</label>
              <input
                type="number" id="weight_kg" name="weight_kg"
                min="0.1" step="0.1" value={formData.weight_kg}
                onChange={handleInputChange} className="input-field"
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

        {/* Relations */}
        <div className="form-section">
          <h3>Relations</h3>
          <p className="text-muted" style={{ marginBottom: '12px' }}>
            Add family members or contacts. Each one is created as a simple profile
            (name and sex, with optional measurements) linked to this person.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rel-first-name">First Name *</label>
              <input
                type="text"
                id="rel-first-name"
                value={newRelation.first_name}
                onChange={(e) => setNewRelation(prev => ({ ...prev, first_name: e.target.value }))}
                className="input-field"
                placeholder="Jane"
              />
            </div>
            <div className="form-group">
              <label htmlFor="rel-last-name">Last Name</label>
              <input
                type="text"
                id="rel-last-name"
                value={newRelation.last_name}
                onChange={(e) => setNewRelation(prev => ({ ...prev, last_name: e.target.value }))}
                className="input-field"
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rel-type">Relation to this person</label>
              <select
                id="rel-type"
                value={newRelation.relation_type}
                onChange={(e) => handleRelationTypeChange(e.target.value)}
                className="input-field"
              >
                {RELATION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="rel-sex">Sex *</label>
              <select
                id="rel-sex"
                value={newRelation.sex}
                onChange={(e) => setNewRelation(prev => ({ ...prev, sex: e.target.value as Sex }))}
                className="input-field"
                disabled={!!impliedSex}
              >
                <option value="">-- Select --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rel-height">Height (cm)</label>
              <input
                type="number" id="rel-height" min="1" step="1"
                value={newRelation.height_cm ?? ""}
                onChange={e => setNewRelation(prev => ({
                  ...prev, height_cm: e.target.value ? Number(e.target.value) : null,
                }))}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label htmlFor="rel-weight">Weight (kg)</label>
              <input
                type="number" id="rel-weight" min="0.1" step="0.1"
                value={newRelation.weight_kg ?? ""}
                onChange={e => setNewRelation(prev => ({
                  ...prev, weight_kg: e.target.value ? Number(e.target.value) : null,
                }))}
                className="input-field"
              />
            </div>
          </div>
          {relationError && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '8px' }}>{relationError}</p>
          )}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="relation-start-date">Relationship start date</label>
              <input id="relation-start-date" type="date" className="input-field" value={newRelation.start_date || ""} onChange={e => setNewRelation(prev => ({ ...prev, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="relation-end-date">Relationship end date</label>
              <input id="relation-end-date" type="date" className="input-field" value={newRelation.end_date || ""} onChange={e => setNewRelation(prev => ({ ...prev, end_date: e.target.value }))} />
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleAddRelation}>
            Add Relation
          </button>

          {formData.relations.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>Added Relations:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.relations.map((rel, index) => (
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
                      <strong>{`${rel.first_name} ${rel.last_name}`.trim()}</strong>
                      {" · "}{rel.sex}{" · "}
                      {RELATION_TYPES.find(t => t.value === rel.relation_type)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRelation(index)}
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
            disabled={loading}
          >
            {loading ? "Adding Person..." : "Add Person"}
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
