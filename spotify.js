import axios from "axios";
import express from "express";
import open from "open";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

const app = express();

let accessToken = "";

// Step 1: Authenticate and get access token
app.get("/login", (req, res) => {
  const scopes =
    "playlist-read-private playlist-modify-private playlist-modify-public";
  res.redirect(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}`
  );
});

app.get("/callback", (req, res) => {
  const code = req.query.code || null;
  axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    data: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  })
    .then((response) => {
      accessToken = response.data.access_token;
      res.send("Authentication successful! You can now close this window.");
      console.log("Access Token:", accessToken);
    })
    .catch((error) => {
      res.send("Authentication failed.");
      console.error(error);
    });
});

// Step 2: Get user profile
const getUserProfile = async () => {
  const response = await axios.get("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

// Step 3: Get playlist tracks
const getPlaylistTracks = async (playlistId) => {
  const response = await axios.get(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.items;
};

// Step 4: Get artist's albums
const getArtistAlbums = async (artistId) => {
  console.log("Called getArtistAlbums");
  const response = await axios.get(
    `https://api.spotify.com/v1/artists/${artistId}/albums`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.items;
};

// Step 5: Create new playlist
const createPlaylist = async (userId, name) => {
  const response = await axios.post(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      name: name,
      public: false,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

// Step 6: Add tracks to the new playlist
const addTracksToPlaylist = async (playlistId, trackUris) => {
  try {
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        uris: trackUris,
        position: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    console.log(error);
  }
};

// Step 7: Get playlist name by ID
const getPlaylistName = async (playlistId) => {
  const response = await axios.get(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.name;
};

let active = 0;

// Main function to execute the workflow
const main = async (playlistId) => {
  console.log("Playlist ID:", playlistId);
  const userProfile = await getUserProfile();
  console.log("User Profile:", userProfile);
  const userId = userProfile.id;
  const playlistTracks = await getPlaylistTracks(playlistId);
  const playlistName = await getPlaylistName(playlistId);
  // Check if the process is already running, if more than 2, loop and wait for 1 second until it's less than 2
  if (active >= 2) {
    while (active >= 2) {
      await new Promise((r) =>
        setTimeout(() => {
          console.log(
            `Waiting for active processes to finish... to process ${playlistName}`
          );
          r();
        }, 10000)
      );
    }
  }
  active++;
  console.log(`Processing playlist: ${playlistName}`);
  await new Promise((r) => setTimeout(r, 1000));

  console.log("Playlist Tracks:", playlistTracks);

  const artists = new Set();
  let allTrackUris = [];
  for (let item of playlistTracks) {
    console.log("Processing track:", item.track.name);
    for (let index = 0; index < item.track.artists.length; index++) {
      const artist = item.track.artists[index].id;
      artists.add(artist);
    }
  }

  console.log("Artists:", artists);

  let count = 1;
  for (let artistId of artists) {
    console.log(`Processing artist: ${count++}/${artists.size}`);
    const artistName =
      playlistTracks.find((t) => t.track.artists.find((a) => a.id === artistId))
        .track.name || `Can't find artist name`;

    console.log("Processing artist:", artistName);
    const artistAlbums = await getArtistAlbums(artistId);
    await new Promise((r) => setTimeout(r, 1000));

    // let count = 1;
    for (let album of artistAlbums) {
      console.log("Processing album:", album.name);
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const albumTracks = await axios.get(
          `https://api.spotify.com/v1/albums/${album.id}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        allTrackUris.push(...albumTracks.data.items.map((track) => track.uri));
      } catch (error) {
        console.log("Error processing album:", album);
      }
    }
  }

  const newPlaylist = await createPlaylist(
    userId,
    "Disco Dive : " + playlistName
  );

  // Make sure no duplicate songs
  allTrackUris = [...new Set(allTrackUris)];
  console.log(
    `Total tracks to add: ${allTrackUris.length} for Playlist: ${playlistName}`
  );
  // Loop through allTrackUris and add 100 tracks at a time
  while (allTrackUris.length > 0) {
    await addTracksToPlaylist(newPlaylist.id, allTrackUris.slice(0, 100));
    allTrackUris = allTrackUris.slice(100);
  }

  console.log("Disco Dive playlist created successfully!");
};

app.get("/start", (req, res) => {
  const playlistId = req.query.playlistId;

  main(playlistId)
    .then(() => {
      active--;
      res.send(
        "Process completed. Check your Spotify account for the new playlist."
      );
    })
    .catch((error) => {
      active--;
      console.error(error);
      res.send("An error occurred.");
    });
});

app.listen(8888, () => {
  console.log(
    "Listening on port 8888. Open http://localhost:8888/login to authenticate."
  );
  open("http://localhost:8888/login");
});
