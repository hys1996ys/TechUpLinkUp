import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', bio: '', interests: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('User not logged in');

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...profile,
    });

    if (error) alert(error.message);
    else alert('Profile saved!');
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      {loading ? <p>Loading...</p> : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
          <textarea
            placeholder="Bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full border p-2 rounded"
            rows={4}
          />
          <input
            type="text"
            placeholder="Interests (e.g. AI, leadership)"
            value={profile.interests}
            onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
            className="w-full border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Profile
          </button>
        </form>
      )}
    </main>
  );
}
