document.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================
  // MOBILE HAMBURGER MENU NAVIGATION
  // ==========================================
  const hamburger = document.querySelector(".hamburger-toggle");
  const navLinks = document.querySelector(".nav-ember .links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      // Toggle active classes for CSS animations
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("active");
      
      // Update accessibility attributes
      const isExpanded = hamburger.classList.contains("active");
      hamburger.setAttribute("aria-expanded", isExpanded);
    });

    // Automatically close the full-screen menu drawer when a link is clicked
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ==========================================
  // FEATURE 1: SCROLL REVEAL (INTERSECTION OBSERVER)
  // ==========================================
  const observerOptions = {
    root: null, // Uses the user's screen viewport
    threshold: 0.1, // Triggers when 10% of the element is visible
    rootMargin: "0px 0px -50px 0px" // Triggers slightly before it hits the bottom edge
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-active");
        // Stop watching this element once it's visible so it doesn't re-animate
        observer.unobserve(entry.target); 
      }
    });
  }, observerOptions);

  // Grab every element marked for scroll animation and register it
  const revealElements = document.querySelectorAll(".scroll-reveal");
  revealElements.forEach(el => observer.observe(el));

  // ==========================================
  // COZY AUTOPILOT SHUFFLED PLAYER (WITH SESSION PERSISTENCE)
  // ==========================================
  const playerContainer = document.getElementById('music-player');
  const ambientBtn = document.getElementById('ambient-toggle');
  const ambientAudio = document.getElementById('ambient-audio');
  const playerStatus = document.getElementById('player-status');
  const trackTitleDisplay = document.getElementById('track-title');
  
  // Your collection of cozy tracks
  const originalPlaylist = [
    { title: "Brass & Brewed Memories", src: "audio/bbm.mp3" },
    { title: "Raindrops on the Awning", src: "audio/gentle-rain.mp3" },
    { title: "Toasted Velvet & Ivory", src: "audio/tvi.mp3" },
    { title: "The Midnight Brew", src: "audio/tmb.mp3" },
    { title: "Warm Hearth Whispers", src: "audio/whw.mp3" },
    { title: "Sleepless Solitude", src: "audio/ss.mp3" }
  ];
  
  let shuffledPlaylist = [];
  let currentTrackIndex = 0;
  let isNavigatingToNewPage = false; // Flag to track normal page links

  // Helper function to shuffle array (Fisher-Yates Shuffle)
  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // State Preservation: Save state to sessionStorage
  const savePlayerState = (isUnloading = false) => {
    if (ambientAudio) {
      sessionStorage.setItem('cozyTrackTime', ambientAudio.currentTime);
      sessionStorage.setItem('cozyTrackSrc', ambientAudio.getAttribute('src') || '');
      
      // Determine if we should save as playing or paused:
      // If we are navigating to another page on our site, preserve the exact playing state.
      // If we are manually reloading or closing the tab, save it as paused.
      let isPlaying = !ambientAudio.paused;
      if (isUnloading && !isNavigatingToNewPage) {
        isPlaying = false;
      }
      
      sessionStorage.setItem('cozyTrackPlaying', isPlaying);
      sessionStorage.setItem('cozyTrackTitle', trackTitleDisplay.textContent);
      sessionStorage.setItem('cozyTrackIndex', currentTrackIndex);
      sessionStorage.setItem('cozyShuffledPlaylist', JSON.stringify(shuffledPlaylist));
    }
  };

  if (ambientBtn && ambientAudio && playerContainer) {
    ambientAudio.volume = 0.25; 
    ambientAudio.loop = false; // Disable native loop so the 'ended' trigger works

    // Detect when the user clicks any internal link on the website
    document.querySelectorAll('a').forEach(link => {
      if (link.hostname === window.location.hostname) {
        link.addEventListener('click', () => {
          isNavigatingToNewPage = true;
        });
      }
    });

    // Hook up saving event listeners
    ambientAudio.addEventListener('timeupdate', () => savePlayerState(false));
    window.addEventListener('beforeunload', () => savePlayerState(true));

    // Load and set UI elements helper (Pure CSS class updates only)
    const setUIPlaying = () => {
      playerContainer.classList.add('playing');
      playerStatus.textContent = 'Now Playing';
      playerStatus.style.color = 'var(--color-primary)';
    };

    const setUIPaused = () => {
      playerContainer.classList.remove('playing');
      playerStatus.textContent = 'Paused';
      playerStatus.style.color = 'var(--color-text-muted)';
    };

    // Helper function to load and play a specific track
    const loadAndPlayTrack = (index) => {
      if (shuffledPlaylist.length === 0) return;
      const track = shuffledPlaylist[index];
      
      ambientAudio.src = track.src;
      trackTitleDisplay.textContent = track.title;
      
      ambientAudio.play().then(() => {
        setUIPlaying();
      }).catch(err => console.log("Playback waiting for user interaction: ", err));
    };

    // Auto-advance track logic
    const playNextTrack = () => {
      currentTrackIndex++;
      
      if (currentTrackIndex >= shuffledPlaylist.length) {
        shuffledPlaylist = shuffleArray(originalPlaylist);
        currentTrackIndex = 0;
      }
      
      loadAndPlayTrack(currentTrackIndex);
    };

    // GLOBAL CLICK TOGGLE: Play or pause by clicking anywhere on the document
    const handleGlobalClickToggle = (e) => {
      // Avoid toggling music if the user is clicking on interactive elements
      // (like the guestbook input, submit buttons, links, or the toggle button itself)
      const clickedTagName = e.target.tagName.toLowerCase();
      const isInteractiveElement = 
        clickedTagName === 'input' || 
        clickedTagName === 'textarea' || 
        clickedTagName === 'button' || 
        clickedTagName === 'a' || 
        e.target.closest('#ambient-toggle') ||
        e.target.closest('#thought-form') ||
        e.target.closest('.hamburger-toggle'); // Prevent triggering play/pause when toggle button is clicked

      if (isInteractiveElement) return;

      if (ambientAudio.paused) {
        ambientAudio.play()
          .then(() => setUIPlaying())
          .catch(err => console.log("Play failed: ", err));
      } else {
        ambientAudio.pause();
        setUIPaused();
      }
    };

    // Restore state function
    const restorePlayerState = () => {
      const savedSrc = sessionStorage.getItem('cozyTrackSrc');
      const savedTime = sessionStorage.getItem('cozyTrackTime');
      const savedTitle = sessionStorage.getItem('cozyTrackTitle');
      const savedIndex = sessionStorage.getItem('cozyTrackIndex');
      const savedShuffled = sessionStorage.getItem('cozyShuffledPlaylist');
      const wasPlaying = sessionStorage.getItem('cozyTrackPlaying') === 'true';

      // Check if the user manually REFRESHED/RELOADED the page
      const navigationEntries = performance.getEntriesByType('navigation');
      const isManualRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';

      // 1. If it's a manual refresh, force a clean slate with a brand new shuffle!
      if (isManualRefresh) {
        shuffledPlaylist = shuffleArray(originalPlaylist);
        currentTrackIndex = 0;
        
        // Clear saved tracks so the player doesn't try to load the pre-refresh song
        sessionStorage.removeItem('cozyTrackSrc');
        sessionStorage.removeItem('cozyTrackTitle');
        sessionStorage.removeItem('cozyTrackTime');
      } 
      // Otherwise, restore the normal playlist setup if navigating page-to-page
      else if (savedShuffled && savedIndex !== null) {
        shuffledPlaylist = JSON.parse(savedShuffled);
        currentTrackIndex = parseInt(savedIndex, 10);
      } else {
        shuffledPlaylist = shuffleArray(originalPlaylist);
        currentTrackIndex = 0;
      }

      // 2. Decide what to load and play
      if (savedSrc && savedTitle && wasPlaying && !isManualRefresh) {
        // Normal page-to-page transition: restore progress and auto-resume
        ambientAudio.src = savedSrc;
        trackTitleDisplay.textContent = savedTitle;
        ambientAudio.currentTime = parseFloat(savedTime) || 0;

        ambientAudio.play()
          .then(() => {
            setUIPlaying();
          })
          .catch(err => {
            console.log("Autoplay blocked on load. Waiting for interaction.");
            setUIPaused();
          });
      } else {
        // FRESH START / MANUAL REFRESH:
        // Pick a brand-new random track and wait for the click to play
        const firstRandomTrack = shuffledPlaylist[currentTrackIndex];
        ambientAudio.src = firstRandomTrack.src;
        trackTitleDisplay.textContent = firstRandomTrack.title;
        setUIPaused(); 
      }

      // Bind the persistent global play/pause listener to the page
      document.removeEventListener('click', handleGlobalClickToggle);
      document.addEventListener('click', handleGlobalClickToggle);
    };

    // Run recovery
    restorePlayerState();

    // Play/Pause manual control for the player widget button
    ambientBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop click from bubbling to document to prevent double-triggering

      if (ambientAudio.paused) {
        ambientAudio.play().then(() => {
          setUIPlaying();
        }).catch(err => console.log("Play failed: ", err));
      } else {
        ambientAudio.pause();
        setUIPaused();
      }
    });

    // When the current track ends, automatically play the next shuffled track
    ambientAudio.addEventListener('ended', () => {
      playNextTrack();
    });
  }

  // ==========================================
  // FEATURE 3: DROP A THOUGHT GUESTBOOK (Permanently stored in localStorage)
  // ==========================================
  const thoughtForm = document.getElementById('thought-form');
  const thoughtInput = document.getElementById('thought-input');
  const thoughtsCanvas = document.getElementById('thoughts-canvas');

  // Load any saved thoughts from localStorage when the page loads
  const loadSavedThoughts = () => {
    const saved = JSON.parse(localStorage.getItem('emberThoughts')) || [];
    saved.forEach(thoughtText => {
      createThoughtElement(thoughtText);
    });
  };

  // Helper function to create a thought element with organic random styling
  const createThoughtElement = (text) => {
    const thoughtCard = document.createElement('div');
    thoughtCard.className = 'thought-card'; // Matches your CSS class
    thoughtCard.textContent = text;

    // Give it a subtle, random rotation so they look like scattered sticky notes
    const randomRotation = Math.floor(Math.random() * 12) - 6; // -6deg to +6deg
    
    // Give it a tiny, random position offset so they aren't all perfectly lined up
    const randomX = Math.floor(Math.random() * 20) - 10; // -10px to +10px
    const randomY = Math.floor(Math.random() * 20) - 10; // -10px to +10px

    thoughtCard.style.transform = `rotate(${randomRotation}deg) translate(${randomX}px, ${randomY}px)`;

    // Prepend it so new thoughts show up first on your pinboard
    thoughtsCanvas.prepend(thoughtCard);
  };

  if (thoughtForm && thoughtInput && thoughtsCanvas) {
    // Load existing thoughts instantly
    loadSavedThoughts();

    thoughtForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Stop the page from reloading on form submit
      
      const thoughtText = thoughtInput.value.trim();
      if (thoughtText === '') return;

      // 1. Create and show the new card on the screen
      createThoughtElement(thoughtText);

      // 2. Save it to localStorage so it stays there on refresh
      const saved = JSON.parse(localStorage.getItem('emberThoughts')) || [];
      saved.push(thoughtText);
      localStorage.setItem('emberThoughts', JSON.stringify(saved));

      // 3. Clear the input field and remove active focus
      thoughtInput.value = '';
      thoughtInput.blur();
    });
  }

});