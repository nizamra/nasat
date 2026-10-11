import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import ProfileCard from "../components/ProfileCard";
import AboutCard from "../components/AboutCard";
import Relations from "../components/Relations";
import SocialLinks from "../components/SocialLinks";
import PersonDetails from "../components/PersonDetails";

export default function Profile() {
  const { username } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`/api/users/${username}/`),
      axios.get(`/api/users/${username}/details/`),
    ])
      .then(([profile, details]) => {
        setData({ ...profile.data, ...details.data });
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });
  }, [username]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Person {username} not found.</div>;

  const avatarUrl = data.avatar || null;

  return (
    <>
      <Header avatar={avatarUrl || undefined} />
      <div style={{ marginTop: '24px' }}>
        <ProfileCard
          username={data.username}
          title={data.title}
          bio={data.bio}
          avatar={avatarUrl || null}
          is_verified={data.is_verified}
          notesCount={data.notes?.length || 0}
        />
      </div>

      <div className="grid-3" style={{ marginTop: '20px' }}>
        <AboutCard user={data} />
        <Relations username={data.username} />
        <SocialLinks links={data.social_links} />
      </div>

      <PersonDetails personId={data.id} data={data} />
    </>
  );
}
