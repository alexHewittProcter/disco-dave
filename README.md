# Spotify Disco Dive

A Node.js script that interacts with the Spotify API to access a playlist from your account, fetch the discography for each artist in the playlist, and create a new playlist called "Disco Dive" with all the songs.

## Features

- Authenticate with Spotify API
- Fetch a playlist by ID
- Retrieve the discography of each artist in the playlist
- Create a new playlist and add all tracks from the artists' discographies

## Requirements

- Node.js
- Spotify Developer Account

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/alexHewittProcter/disco-dave.git
   cd disco-dave
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Spotify API credentials:

   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
   ```

## Usage

1. Start the server:

   ```bash
   node spotify.js
   ```

2. Open your browser and navigate to `http://localhost:8888/login` to authenticate with Spotify.

3. After authentication, navigate to:

   ```plaintext
   http://localhost:8888/start?playlistId=your_playlist_id
   ```

   Replace `your_playlist_id` with the ID of the playlist you want to process.

## How It Works

1. **Authentication**: The user logs in to Spotify and grants the app permission to read and modify playlists.
2. **Fetch Playlist Tracks**: The script fetches all tracks from the specified playlist.
3. **Fetch Artist Discographies**: For each artist in the playlist, the script retrieves all albums and their tracks.
4. **Create New Playlist**: The script creates a new playlist called "Disco Dive" and adds all tracks from the artists' discographies to this new playlist.

## Project Structure

- `spotify.js`: Main script containing all logic for interacting with the Spotify API.
- `.env`: Environment variables for storing Spotify API credentials.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
