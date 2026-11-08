export default async function handler(req, res) {
  const username = String(req.query.username || "").trim();

  if (!username || username.length > 20) {
    return res.status(400).json({ error: "Invalid username" });
  }

  try {
    const lookup = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: true
        })
      }
    );

    if (!lookup.ok) {
      return res.status(502).json({ error: "Roblox lookup failed" });
    }

    const result = await lookup.json();
    const user = result.data?.[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profileResponse = await fetch(
      `https://users.roblox.com/v1/users/${user.id}`
    );

    if (!profileResponse.ok) {
      return res.status(502).json({ error: "Profile unavailable" });
    }

    const profile = await profileResponse.json();

    const avatarResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
    );

    const avatarData = await avatarResponse.json();

    return res.status(200).json({
      id: user.id,
      username: profile.name,
      displayName: profile.displayName,
      avatar: avatarData.data?.[0]?.imageUrl || null,
      profileUrl: `https://www.roblox.com/users/${user.id}/profile`
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}
