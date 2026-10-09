/* ==========================================================================
   HRTC DELUXE BUS 90S HIGHWAY RADIO - JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. REALTIME CLOCK
  // ==========================================
  const clockElement = document.getElementById('realtime-clock');

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');

    clockElement.textContent = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ==========================================
  // 2. LIVE ONLINE USERS ("सवारी") WEBSOCKET
  // ==========================================
  const sawariCountElement = document.getElementById('sawari-count');

  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let socket;

    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'USER_COUNT' && data.count) {
            sawariCountElement.textContent = data.count;
          }
        } catch (e) {
          console.log('WS msg error:', e);
        }
      };

      socket.onclose = () => {
        setTimeout(initWebSocket, 5000);
      };

      socket.onerror = () => {
        sawariCountElement.textContent = "1";
      };
    } catch (err) {
      sawariCountElement.textContent = "1";
    }
  }

  initWebSocket();

  // ==========================================
  // 3. MUSIC TRACKS & RANDOM PLAYBACK ENGINE
  // ==========================================
  
  let playlist = [];
  let currentTrackIndex = -1;
  let isPlaying = false;

  // DOM Elements
  const audioElement = document.getElementById('audio-element');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const albumArt = document.getElementById('album-art');
  const eqWaves = document.getElementById('eq-waves');

  const timeDisplayEl = document.getElementById('time-display');
  const seekbarContainer = document.getElementById('seekbar-container');
  const seekbarFill = document.getElementById('seekbar-fill');

  const volumeSlider = document.getElementById('volume-slider');
  const muteBtn = document.getElementById('mute-btn');
  const volIcon = document.getElementById('vol-icon');

  // Load local songs from Node server `/api/songs`
  async function fetchLocalSongs() {
    try {
      const response = await fetch('/api/songs');
      if (response.ok) {
        const data = await response.json();
        if (data.songs && data.songs.length > 0) {
          playlist = data.songs;
          console.log(`Loaded ${data.songs.length} local song(s) from music/ folder!`);
        }
      }
    } catch (err) {
      console.log('Error fetching local songs:', err);
    }
  }

  // Load a specific track
  function loadTrack(index) {
    if (!playlist || playlist.length === 0) {
      trackTitle.textContent = "No music in music/ folder";
      trackArtist.textContent = "Add MP3 / MP4 files to play";
      return;
    }

    currentTrackIndex = index;
    const track = playlist[currentTrackIndex];

    audioElement.src = track.url;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;

    // Display embedded artwork photo if available
    const icon = albumArt.querySelector('.cd-icon');
    if (track.coverUrl) {
      albumArt.style.backgroundImage = `url('${track.coverUrl}')`;
      albumArt.style.backgroundSize = 'cover';
      albumArt.style.backgroundPosition = 'center';
      if (icon) icon.style.display = 'none';
    } else {
      albumArt.style.backgroundImage = 'none';
      if (icon) icon.style.display = 'block';
    }

    seekbarFill.style.width = '0%';
    if (timeDisplayEl) timeDisplayEl.textContent = '0:00 / 0:00';
  }

  // Play random track logic
  function playRandomTrack() {
    if (playlist.length === 0) return;

    let newIndex;
    if (playlist.length === 1) {
      newIndex = 0;
    } else {
      do {
        newIndex = Math.floor(Math.random() * playlist.length);
      } while (newIndex === currentTrackIndex);
    }

    loadTrack(newIndex);
    playAudio();
  }

  function playAudio() {
    if (playlist.length === 0) return;

    audioElement.play()
      .then(() => {
        isPlaying = true;
        playIcon.className = 'fas fa-pause';
        albumArt.classList.add('playing');
        eqWaves.classList.add('playing');
      })
      .catch(err => {
        console.log('Browser waiting for first user click to play audio:', err);
      });
  }

  function pauseAudio() {
    audioElement.pause();
    isPlaying = false;
    playIcon.className = 'fas fa-play';
    albumArt.classList.remove('playing');
    eqWaves.classList.remove('playing');
  }

  // Toggle Play / Pause
  playPauseBtn.addEventListener('click', () => {
    if (currentTrackIndex === -1 && playlist.length > 0) {
      loadTrack(0);
      playAudio();
    } else if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  });

  // Next Button -> Plays Random Track
  nextBtn.addEventListener('click', () => {
    playRandomTrack();
  });

  // Prev Button -> Restart track or previous random
  prevBtn.addEventListener('click', () => {
    if (audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
    } else {
      playRandomTrack();
    }
  });

  // When track finishes playing, automatically pick a RANDOM track!
  audioElement.addEventListener('ended', () => {
    playRandomTrack();
  });

  // Update Time and Seekbar
  audioElement.addEventListener('timeupdate', () => {
    if (isNaN(audioElement.duration)) return;
    
    const current = audioElement.currentTime;
    const duration = audioElement.duration;
    const pct = (current / duration) * 100;

    seekbarFill.style.width = `${pct}%`;
    if (timeDisplayEl) {
      timeDisplayEl.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    }
  });

  // Click on Seekbar to jump to time
  seekbarContainer.addEventListener('click', (e) => {
    if (isNaN(audioElement.duration)) return;
    const rect = seekbarContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * audioElement.duration;
    audioElement.currentTime = newTime;
  });

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Volume Controls
  volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    audioElement.volume = vol;
    updateVolIcon(vol);
  });

  let lastVolume = 0.8;
  muteBtn.addEventListener('click', () => {
    if (audioElement.volume > 0) {
      lastVolume = audioElement.volume;
      audioElement.volume = 0;
      volumeSlider.value = 0;
      updateVolIcon(0);
    } else {
      audioElement.volume = lastVolume;
      volumeSlider.value = lastVolume;
      updateVolIcon(lastVolume);
    }
  });

  function updateVolIcon(vol) {
    if (vol === 0) {
      volIcon.className = 'fas fa-volume-mute';
    } else if (vol < 0.5) {
      volIcon.className = 'fas fa-volume-down';
    } else {
      volIcon.className = 'fas fa-volume-up';
    }
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      playPauseBtn.click();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      nextBtn.click();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      muteBtn.click();
    }
  });

  // First interaction autoplay trigger
  const handleFirstInteraction = () => {
    if (!isPlaying && playlist.length > 0) {
      playAudio();
    }
    document.removeEventListener('click', handleFirstInteraction);
  };
  document.addEventListener('click', handleFirstInteraction);

  // Initialize page
  fetchLocalSongs().then(() => {
    if (playlist.length > 0) {
      loadTrack(0);
      playAudio();
    }
  });

});
