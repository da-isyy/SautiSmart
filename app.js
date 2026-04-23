/**
 * ========================================================================
 * SautiSmart Vanilla JS Handler
 * Handles Auth, Navigation, and Dynamic Multi-Tier Data Rendering
 * ========================================================================
 */

// Global variables to store data
let communitiesMap = {};
let allSongs = [];
let isLoginMode = true;

// Wait for the HTML to be fully parsed before starting
document.addEventListener('DOMContentLoaded', () => {
    console.log("SautiSmart Application Initialized. Waiting for login...");
});

/* ========================================================================
   1. AUTHENTICATION & ROLE-BASED ACCESS
   ======================================================================== */

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const toggleText = document.getElementById('auth-toggle-text');
    const signupFields = document.getElementById('signup-only');

    if (title) title.innerText = isLoginMode ? "Login to SautiSmart" : "Create Account";
    if (signupFields) signupFields.classList.toggle('d-none');
    if (toggleText) toggleText.innerText = isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login";
}

async function handleAuth() {
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const role_id = document.getElementById('auth-role')?.value || 3;
    
    const endpoint = isLoginMode ? '/api/login' : '/api/signup';
    const payload = isLoginMode ? { username, password } : { username, password, role_id };

    try {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            alert("Welcome, " + username + "!");
            
            document.getElementById('auth-section').classList.add('d-none');
            document.getElementById('main-content').classList.remove('d-none');

            await initializeData();

            showSection('theory-section');
        } else {
            alert("Access Denied: " + (result.error || "Invalid Credentials"));
        }
    } catch (error) {
        console.error("Auth error:", error);
        alert("Server connection failed. Ensure your Flask app.py is running on port 5000.");
    }
}

/* ========================================================================
   2. NAVIGATION
   ======================================================================== */

function showSection(sectionId) {
    const sections = ['theory-section', 'instruments-section', 'songs-section', 'auth-section'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('d-none');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/* ========================================================================
   3. DATA INITIALIZATION & FETCHING
   ======================================================================== */

async function initializeData() {
    await fetchCommunities();
    await fetchInstruments();
    await fetchSongs();
}

async function fetchCommunities() {
    try {
        const response = await fetch('http://localhost:5000/api/communities');
        const data = await response.json();
        communitiesMap = {};
        data.forEach(c => communitiesMap[c.id] = c);
    } catch (e) { 
        console.error("Failed to fetch communities", e); 
    }
}

function getInstrumentIcon(type) {
    const icons = { 
        'Drum': '🥁', 'Flute': '🪈', 'Horn': '📯', 'Lyre': '🎻', 
        'Fiddle': '🎻', 'Rattle': '🪇', 'Harp': '🎻', 'Oboe': '🎺🎵'
    };
    return icons[type] || '🎵';
}

async function fetchInstruments() {
    try {
        const response = await fetch('http://localhost:5000/api/instruments');
        const instruments = await response.json();
        const grid = document.getElementById('instruments-grid');
        
        if (!grid) return;
        grid.innerHTML = "";

        instruments.forEach(inst => {
            const communityData = communitiesMap[inst.community_id] || { description: "Cultural context info is being updated." };
            const icon = getInstrumentIcon(inst.instrument_type);
            
            grid.innerHTML += `
                <div class="col-12 mb-4">
                    <div class="card theory-card shadow-sm border-top-plum">
                        <div class="bg-light text-center p-4 d-flex align-items-center justify-content-center" style="border-bottom: 1px solid #eee;">
                            <span class="display-1">${icon}</span>
                            <div class="ms-4 text-start">
                                <span class="badge bg-plum mb-1">${inst.instrument_type || 'Traditional'}</span>
                                <h2 class="fw-bold text-deep-dark-blue mb-0">${inst.name}</h2>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8 border-end">
                                    <h6 class="fw-bold text-magenta">Cultural Heritage (${inst.community}):</h6>
                                    <p class="text-muted small">${communityData.description}</p>
                                    <p class="mb-0 small"><strong>Material:</strong> ${inst.material || 'Natural materials'}</p>
                                    <p class="mb-0 small"><strong>Played by:</strong> ${inst.played_by || 'Traditional musicians'}</p>
                                </div>
                                <div class="col-md-4 ps-md-4">
                                    <div class="p-3 rounded h-100" style="border-left:4px solid #F84AA7; background-color:rgba(248,74,167,0.05);">
                                        <h6 class="fw-bold" style="color:#F84AA7;">Did you know?</h6>
                                        <p class="small mb-0">${inst.fun_fact || 'This instrument is a vital part of Kenyan history.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) { 
        console.error("Failed to load instruments", e); 
    }
}

async function fetchSongs() {
    try {
        const response = await fetch('http://localhost:5000/api/songs');
        allSongs = await response.json();
        renderSongs(allSongs);
    } catch (e) { 
        console.error("Failed to load songs", e); 
    }
}

/* ========================================================================
   4. DYNAMIC RENDERING & FILTERING
   ======================================================================== */

function renderSongs(songs) {
    const grid = document.getElementById('songs-grid');
    if (!grid) return;
    
    grid.innerHTML = songs.length ? "" : "<h5 class='text-center mt-4'>No songs found for this selection.</h5>";
    
    songs.forEach(song => {
        const communityData = communitiesMap[song.community_id] || { name: "Traditional" };
        grid.innerHTML += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card theory-card shadow-sm h-100 border-top-magenta">
                    <div class="card-body text-center d-flex flex-column">
                        <div class="module-icon bg-plum mx-auto mb-3" style="width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white;">🎵</div>
                        <h5 class="fw-bold text-deep-dark-blue mb-1">${song.title}</h5>
                        <p class="text-muted small mb-3">${communityData.name} • ${song.occasion}</p>
                        <div class="mt-auto">
                            <a href="${song.youtube_link}" target="_blank" class="btn w-100 fw-bold text-white shadow-sm" style="background-color:#FF3562; border-radius:8px;">
                                Listen on YouTube ▶
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

function filterSongs() {
    const val = document.getElementById('occasion-filter').value;
    const filtered = val === "All" ? allSongs : allSongs.filter(s => s.occasion === val);
    renderSongs(filtered);
}