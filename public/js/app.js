// Global variables
let map;
let markers = [];
let selectedLandmarks = [];
let currentMarker = null;
let activeTab = 'map-tab';

// DOM elements - Main UI
const mapContainer = document.getElementById('map');
const tabLinks = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// DOM elements - Map Tab
const landmarkNameInput = document.getElementById('landmark-name');
const landmarkDescriptionInput = document.getElementById('landmark-description');
const landmarkCategorySelect = document.getElementById('landmark-category');
const addLandmarkBtn = document.getElementById('addLandmarkBtn');
const searchNameInput = document.getElementById('search-name');
const filterCategorySelect = document.getElementById('filter-category');
const searchBtn = document.getElementById('searchBtn');
const resetSearchBtn = document.getElementById('resetSearchBtn');

// DOM elements - Landmarks Tab
const landmarksGrid = document.getElementById('landmarksGrid');
const landmarkSearchName = document.getElementById('landmark-search-name');
const landmarkFilterCategory = document.getElementById('landmark-filter-category');
const landmarkSearchBtn = document.getElementById('landmarkSearchBtn');
const landmarkResetBtn = document.getElementById('landmarkResetBtn');

// DOM elements - Visited Tab
const visitedGrid = document.getElementById('visitedGrid');
const visitedSearchName = document.getElementById('visited-search-name');
const visitedFilterDate = document.getElementById('visited-filter-date');
const visitedSearchBtn = document.getElementById('visitedSearchBtn');
const visitedResetBtn = document.getElementById('visitedResetBtn');

// DOM elements - Plans Tab
const plansGrid = document.getElementById('plansGrid');
const createNewPlanBtn = document.getElementById('createNewPlanBtn');

// DOM elements - Modal
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close');
const visitModal = document.getElementById('modal');

// Templates
const visitModalTemplate = document.getElementById('visit-modal-template');
const visitPlanModalTemplate = document.getElementById('visit-plan-modal-template');
const landmarkCardTemplate = document.getElementById('landmark-card-template');
const visitedCardTemplate = document.getElementById('visited-card-template');
const planCardTemplate = document.getElementById('plan-card-template');

// API endpoints
const API_URL = '/api';
const LANDMARKS_ENDPOINT = `${API_URL}/landmarks`;
const VISITED_ENDPOINT = `${API_URL}/visited`;
const VISITPLANS_ENDPOINT = `${API_URL}/visitplans`;

// Run when page loads
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();

    // Check if we're on the logged-in state already
    if (document.getElementById('app-content').style.display === 'block') {
        initializeAfterLogin();
    } else {
        // Add an event listener for when the app content becomes visible
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.target.style.display === 'block') {
                    initializeAfterLogin();
                    observer.disconnect(); // Stop observing once we've initialized
                }
            });
        });

        // Start observing app-content for display changes
        observer.observe(document.getElementById('app-content'), {
            attributes: true,
            attributeFilter: ['style']
        });
    }
});

// Initialize app elements after login
function initializeAfterLogin() {
    // Initialize tab system
    tabLinks.forEach(tab => {
        if (tab) {
            tab.addEventListener('click', () => {
                changeTab(tab.dataset.tab);
            });
        }
    });

    // Initialize the active tab
    if (activeTab === 'map-tab') {
        setTimeout(initMap, 500); // Give a bit more time for elements to load
    } else {
        changeTab(activeTab);
    }
}

// Initialize map
function initMap() {
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    try {
        // If map already exists, don't reinitialize
        if (map) {
            console.log('Map already initialized');
            return;
        }

        // Clear any previous map instances
        if (mapContainer._leaflet_id) {
            mapContainer._leaflet_id = null;
        }

        // Initialize the map with a slight delay to ensure the container is ready
        setTimeout(() => {
            map = L.map('map').setView([39.0, 35.0], 6); // Center on Turkey

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Make sure add landmark button is disabled initially
            if (addLandmarkBtn) {
                addLandmarkBtn.disabled = true;
            }

            // Map click event
            map.on('click', function (e) {
                const lat = e.latlng.lat.toFixed(6);
                const lng = e.latlng.lng.toFixed(6);

                // Clear previous marker if exists
                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }

                // Create new marker
                currentMarker = L.marker([lat, lng]).addTo(map)
                    .bindPopup(`Lat: ${lat}, Lng: ${lng}`)
                    .openPopup();

                // Enable add landmark button
                if (addLandmarkBtn) {
                    addLandmarkBtn.disabled = false;
                }
            });

            console.log('Map initialized successfully');

            // Load landmarks after map is initialized
            fetchLandmarks();
        }, 300);
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Change active tab
function changeTab(tabId) {
    activeTab = tabId;

    // Update active tab UI
    tabLinks.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update active content UI
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });

    // Load tab-specific data
    if (tabId === 'map-tab') {
        // Initialize map if not already initialized
        if (!map) {
            setTimeout(initMap, 100);
        }
    } else if (tabId === 'landmarks-tab') {
        loadLandmarks();
    } else if (tabId === 'visited-tab') {
        loadVisited();
    } else if (tabId === 'plans-tab') {
        loadVisitPlans();
    }
}

// Event listeners
function setupEventListeners() {
    try {
        // Modal close
        if (closeModal) {
            closeModal.addEventListener('click', function () {
                if (modal) modal.style.display = 'none';
            });
        }

        if (window && modal) {
            window.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Add landmark button
        if (addLandmarkBtn) {
            addLandmarkBtn.addEventListener('click', function () {
                if (!currentMarker) {
                    alert('Please click on the map to add a landmark');
                    return;
                }

                if (!landmarkNameInput) return;

                const name = landmarkNameInput.value.trim();
                if (!name) {
                    alert('Please enter a name!');
                    return;
                }

                // Create and save landmark
                const landmark = {
                    name: name,
                    location: {
                        latitude: currentMarker.getLatLng().lat.toFixed(6),
                        longitude: currentMarker.getLatLng().lng.toFixed(6)
                    },
                    description: landmarkDescriptionInput ? landmarkDescriptionInput.value.trim() : '',
                    category: landmarkCategorySelect ? landmarkCategorySelect.value : 'other'
                };

                saveLandmark(landmark);
            });
        }

        // Search button
        if (searchBtn && searchNameInput && filterCategorySelect) {
            searchBtn.addEventListener('click', function () {
                const name = searchNameInput.value.trim();
                const category = filterCategorySelect.value;

                searchLandmarks(name, category);
            });
        }

        // Reset search button
        if (resetSearchBtn && searchNameInput && filterCategorySelect) {
            resetSearchBtn.addEventListener('click', function () {
                searchNameInput.value = '';
                filterCategorySelect.selectedIndex = 0;
                fetchLandmarks();
            });
        }

        // Create new plan button
        if (createNewPlanBtn) {
            createNewPlanBtn.addEventListener('click', function () {
                showCreatePlanModal();
            });
        }

        // Landmark tab search button
        if (landmarkSearchBtn && landmarkSearchName && landmarkFilterCategory) {
            landmarkSearchBtn.addEventListener('click', function () {
                loadLandmarks(landmarkSearchName.value.trim(), landmarkFilterCategory.value);
            });
        }

        // Landmark tab reset button
        if (landmarkResetBtn && landmarkSearchName && landmarkFilterCategory) {
            landmarkResetBtn.addEventListener('click', function () {
                landmarkSearchName.value = '';
                landmarkFilterCategory.selectedIndex = 0;
                loadLandmarks();
            });
        }

        // Visited tab search button
        if (visitedSearchBtn && visitedSearchName && visitedFilterDate) {
            visitedSearchBtn.addEventListener('click', function () {
                const name = visitedSearchName.value.trim();
                const date = visitedFilterDate.value;
                loadVisited(name, date);
            });
        }

        // Visited tab reset button
        if (visitedResetBtn && visitedSearchName && visitedFilterDate) {
            visitedResetBtn.addEventListener('click', function () {
                visitedSearchName.value = '';
                visitedFilterDate.value = '';
                loadVisited();
            });
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Fetch landmarks from database
async function fetchLandmarks() {
    try {
        const token = getAuthToken();
        const response = await fetch(LANDMARKS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch landmark data');

        const landmarks = await response.json();
        displayLandmarks(landmarks);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Search landmarks
async function searchLandmarks(name, category) {
    try {
        let url = LANDMARKS_ENDPOINT;
        const params = [];

        if (name) params.push(`name=${encodeURIComponent(name)}`);
        if (category) params.push(`category=${encodeURIComponent(category)}`);

        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        const token = getAuthToken();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to search landmarks');

        const landmarks = await response.json();
        displayLandmarks(landmarks);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Display landmarks on map
function displayLandmarks(landmarks) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    if (landmarks.length === 0) {
        return;
    }

    // Add new landmarks to map
    landmarks.forEach(landmark => {
        // Add to map
        const marker = L.marker([
            landmark.location.latitude,
            landmark.location.longitude
        ]).addTo(map)
            .bindPopup(`<b>${landmark.name}</b><br>${landmark.description}`);

        // Add click handler to marker
        marker.on('click', () => {
            marker.openPopup();
        });

        // Add context menu to marker
        marker.on('contextmenu', () => {
            showVisitModal(landmark);
        });

        markers.push(marker);
    });
}

// Load landmarks for Landmarks tab
async function loadLandmarks(name, category) {
    try {
        let url = LANDMARKS_ENDPOINT;
        const params = [];

        if (name) params.push(`name=${encodeURIComponent(name)}`);
        if (category) params.push(`category=${encodeURIComponent(category)}`);

        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        const token = getAuthToken();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch landmarks');

        const landmarks = await response.json();
        displayLandmarksGrid(landmarks);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Display landmarks in grid format
function displayLandmarksGrid(landmarks) {
    landmarksGrid.innerHTML = '';

    if (landmarks.length === 0) {
        landmarksGrid.innerHTML = '<p>No landmarks found</p>';
        return;
    }

    landmarks.forEach(landmark => {
        const template = landmarkCardTemplate.content.cloneNode(true);

        // Set landmark details
        template.querySelector('.card-title').textContent = landmark.name;
        template.querySelector('.badge').textContent = landmark.category;

        // Set details for each section
        template.querySelector('.landmark-details').textContent = `${landmark.category} landmark`;
        template.querySelector('.coordinates').textContent = `${landmark.location.latitude}, ${landmark.location.longitude}`;
        template.querySelector('.landmark-description').textContent = landmark.description || 'No description available';

        // Add event listeners

        template.querySelector('.visit-btn').addEventListener('click', () => {
            showVisitModal(landmark);
        });


        template.querySelector('.view-on-map-btn').addEventListener('click', () => {
            // Switch to map tab and focus on the landmark
            changeTab('map-tab');
            const marker = markers.find(m =>
                m.getLatLng().lat == landmark.location.latitude &&
                m.getLatLng().lng == landmark.location.longitude
            );

            if (marker) {
                map.setView(marker.getLatLng(), 14);
                marker.openPopup();
            }
        });



        template.querySelector('.edit-btn').addEventListener('click', () => {
            showEditLandmarkModal(landmark);
        });

        /*
        template.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this landmark?')) {
                deleteLandmark(landmark._id);
            }
        });
        */

        landmarksGrid.appendChild(template);
    });
}

// Load visited places
async function loadVisited(name, date) {
    try {
        let url = VISITED_ENDPOINT;
        const params = [];


        if (name) {

            let landmarks = await searchLandmarksByName(name);

            if (landmarks && landmarks.length > 0) {

                let landmarkIds = landmarks.map(l => l._id);


                const allVisits = await fetchAllVisits();


                const filteredVisits = allVisits.filter(visit =>
                    landmarkIds.includes(visit.landmark_id._id));


                displayVisitedGrid(filteredVisits);
                return;
            }


            params.push(`visitor=${encodeURIComponent(name)}`);
        }

        if (date) params.push(`date=${encodeURIComponent(date)}`);

        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        const token = getAuthToken();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch visited data');

        const visited = await response.json();
        displayVisitedGrid(visited);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Display visited places in grid
function displayVisitedGrid(visitedPlaces) {
    visitedGrid.innerHTML = '';

    if (visitedPlaces.length === 0) {
        visitedGrid.innerHTML = '<p>No visited places found</p>';
        return;
    }

    visitedPlaces.forEach(visit => {
        const template = visitedCardTemplate.content.cloneNode(true);

        // Set visit details
        template.querySelector('.card-title').textContent = visit.landmark_id.name;
        template.querySelector('.visit-date').textContent = new Date(visit.visited_date).toLocaleDateString();
        template.querySelector('.visitor-name').textContent = `Visitor: ${visit.visitor_name}`;
        template.querySelector('.visit-notes').textContent = visit.notes || 'No notes';

        // Add rating stars
        if (visit.rating > 0) {
            const ratingDisplay = template.querySelector('.rating-display');
            ratingDisplay.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const star = document.createElement('span');
                star.className = i < visit.rating ? 'filled-star' : 'empty-star';
                star.innerHTML = i < visit.rating ? '★' : '☆';
                ratingDisplay.appendChild(star);
            }
        }

        // Add event listener
        template.querySelector('.view-details-btn').addEventListener('click', () => {
            viewVisitDetails(visit);
        });

        visitedGrid.appendChild(template);
    });
}

// Load visit plans
async function loadVisitPlans() {
    try {
        const token = getAuthToken();
        const response = await fetch(VISITPLANS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch visit plans');

        const plans = await response.json();
        displayPlansGrid(plans);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Display visit plans in grid
function displayPlansGrid(plans) {
    plansGrid.innerHTML = '';

    if (plans.length === 0) {
        plansGrid.innerHTML = '<p>No visit plans found</p>';
        return;
    }

    plans.forEach(plan => {
        const template = planCardTemplate.content.cloneNode(true);

        // Set plan details
        template.querySelector('.card-title').textContent = plan.name;
        template.querySelector('.plan-date').textContent = new Date(plan.planned_date).toLocaleDateString();
        template.querySelector('.plan-landmarks-count').textContent = `Places: ${plan.landmarks.length}`;
        template.querySelector('.plan-notes').textContent = plan.overall_notes || 'No notes';

        // Add event listener
        template.querySelector('.view-plan-btn').addEventListener('click', () => {
            viewPlanDetails(plan);
        });

        plansGrid.appendChild(template);
    });
}

// Save new landmark
async function saveLandmark(landmark) {
    try {
        const token = getAuthToken();
        const response = await fetch(LANDMARKS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(landmark)
        });

        if (!response.ok) throw new Error('Failed to save landmark');

        const savedLandmark = await response.json();
        alert('Landmark saved successfully!');


        landmarkNameInput.value = '';
        landmarkDescriptionInput.value = '';
        landmarkCategorySelect.selectedIndex = 0;


        addLandmarkBtn.disabled = true;

        if (currentMarker) {
            currentMarker.remove();
            currentMarker = null;
        }


        fetchLandmarks();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save landmark!');
    }
}

// Show modal to record a visit
function showVisitModal(landmark) {
    if (!visitModalTemplate) {
        console.error('Visit modal template not found');
        return;
    }

    currentLandmark = landmark;


    modalBody.innerHTML = '';


    const template = visitModalTemplate.content.cloneNode(true);

    // Update content
    const landmarkNameElement = template.querySelector('.landmark-name');
    const landmarkLocationElement = template.querySelector('.landmark-location');
    const landmarkDescriptionElement = template.querySelector('.landmark-description');
    const landmarkCategoryElement = template.querySelector('.landmark-category');
    const visitDateInput = template.querySelector('#visitDate');
    const visitorNameInput = template.querySelector('#visitorName');

    if (landmarkNameElement) landmarkNameElement.textContent = landmark.name;
    if (landmarkLocationElement) landmarkLocationElement.textContent =
        `${landmark.location.latitude}, ${landmark.location.longitude}`;
    if (landmarkDescriptionElement) landmarkDescriptionElement.textContent =
        landmark.description || 'No description available';
    if (landmarkCategoryElement) landmarkCategoryElement.textContent = landmark.category;

    // Set default date to today
    if (visitDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        visitDateInput.value = `${year}-${month}-${day}`;
    }

    // Set default visitor name to current username
    if (visitorNameInput) {
        const username = document.getElementById('username')?.textContent || '';
        visitorNameInput.value = username;
    }

    // Add form submission event listener
    const saveVisitBtn = template.querySelector('#save-visit-btn');
    if (saveVisitBtn) {
        saveVisitBtn.addEventListener('click', function () {
            const visitDate = document.getElementById('visitDate').value;
            const visitNote = document.getElementById('visitNote').value;
            const rating = document.getElementById('rating').value;
            const visitorName = document.getElementById('visitorName').value;

            if (!visitDate) {
                alert('Please enter visit date');
                return;
            }

            // Create visit data
            const visitData = {
                landmark_id: landmark._id,
                visited_date: visitDate,
                notes: visitNote || '',
                rating: rating || 0,
                visitor_name: visitorName || ''
            };

            // Save the visit
            recordVisit(visitData);
        });
    }

    // Add the template to modal body
    modalBody.appendChild(template);

    // Show modal
    modal.style.display = 'block';
}

// Record a visit to a landmark
async function recordVisit(visitData) {
    try {
        // Create data format expected by the backend API
        const visitPayload = {
            landmark_id: visitData.landmark_id,
            visited_date: visitData.visited_date,
            notes: visitData.notes || '',
            visitor_name: visitData.visitor_name || document.getElementById('username')?.textContent || '',
            rating: visitData.rating || 0
        };

        const token = getAuthToken();
        const response = await fetch(VISITED_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(visitPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to record visit');
        }

        alert('Visit recorded successfully!');
        modal.style.display = 'none';

        // Refresh visited tab if active
        if (activeTab === 'visited-tab') {
            loadVisited();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to record visit: ' + error.message);
    }
}

// View visit details
function viewVisitDetails(visit) {
    modalBody.innerHTML = `
        <h3>Visit Details</h3>
        <div class="card">
            <div class="card-header">
                <h3>${visit.landmark_id.name}</h3>
                <span>${new Date(visit.visited_date).toLocaleDateString()}</span>
            </div>
            <div class="card-body">
                <p><strong>Location:</strong> ${visit.landmark_id.location.latitude}, ${visit.landmark_id.location.longitude}</p>
                <p><strong>Category:</strong> ${visit.landmark_id.category}</p>
                <p><strong>Visitor:</strong> ${visit.visitor_name || 'Not specified'}</p>
                <p><strong>Notes:</strong> ${visit.notes || 'No notes'}</p>
                <p><strong>Rating:</strong> ${getRatingStars(visit.rating)}</p>
            </div>
            <div class="card-footer">
                <button id="view-on-map-btn">View on Map</button>
                <button id="edit-visit-btn">Edit Visit</button>
                <button id="delete-visit-btn" class="danger">Delete Visit</button>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // View on map button
    document.getElementById('view-on-map-btn').addEventListener('click', function () {
        modal.style.display = 'none';
        changeTab('map-tab');

        // Find the marker and center map on it
        setTimeout(() => {
            const landmark = visit.landmark_id;
            const latlng = [landmark.location.latitude, landmark.location.longitude];
            map.setView(latlng, 14);

            // Find marker
            const marker = markers.find(m =>
                m.getLatLng().lat == landmark.location.latitude &&
                m.getLatLng().lng == landmark.location.longitude
            );

            if (marker) {
                marker.openPopup();
            }
        }, 100);
    });

    // Edit visit button
    document.getElementById('edit-visit-btn').addEventListener('click', function () {
        showEditVisitModal(visit);
    });

    // Delete visit button
    document.getElementById('delete-visit-btn').addEventListener('click', function () {
        if (confirm('Are you sure you want to delete this visit?')) {
            deleteVisit(visit._id);
        }
    });
}

// Delete visit
async function deleteVisit(visitId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${VISITED_ENDPOINT}/${visitId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to delete visit');

        alert('Visit deleted successfully!');
        modal.style.display = 'none';

        // Refresh data
        loadVisited();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete visit!');
    }
}

// Show create plan modal
async function showCreatePlanModal() {
    try {
        // First fetch all landmarks
        const token = getAuthToken();
        const response = await fetch(LANDMARKS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch landmarks');

        const landmarks = await response.json();


        const template = visitPlanModalTemplate.content.cloneNode(true);


        const dateInput = template.querySelector('#plan-date');
        dateInput.valueAsDate = new Date();


        const landmarksContainer = template.querySelector('#plan-landmarks');

        if (landmarks.length === 0) {
            landmarksContainer.innerHTML = '<p>No landmarks available. Please add landmarks first.</p>';
        } else {
            landmarks.forEach(landmark => {
                const landmarkItemDiv = document.createElement('div');
                landmarkItemDiv.className = 'landmark-item';

                // Create checkbox and label
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `landmark-${landmark._id}`;
                checkbox.value = landmark._id;
                checkbox.dataset.name = landmark.name;

                const label = document.createElement('label');
                label.htmlFor = `landmark-${landmark._id}`;
                label.textContent = landmark.name;

                // Create notes textarea (initially hidden)
                const notesContainer = document.createElement('div');
                notesContainer.className = 'landmark-item-notes';
                notesContainer.style.display = 'none';

                const notesTextarea = document.createElement('textarea');
                notesTextarea.placeholder = 'Notes for this place';
                notesTextarea.id = `notes-${landmark._id}`;

                // Show/hide notes textarea when checkbox changes
                checkbox.addEventListener('change', function () {
                    notesContainer.style.display = this.checked ? 'block' : 'none';
                });

                notesContainer.appendChild(notesTextarea);
                landmarkItemDiv.appendChild(checkbox);
                landmarkItemDiv.appendChild(label);
                landmarksContainer.appendChild(landmarkItemDiv);
                landmarksContainer.appendChild(notesContainer);
            });
        }

        // Show the modal
        modalBody.innerHTML = '';
        modalBody.appendChild(template);
        modal.style.display = 'block';

        // Save plan button
        document.getElementById('save-plan-btn').addEventListener('click', function () {
            const planName = document.getElementById('plan-name').value.trim();
            const planDate = document.getElementById('plan-date').value;
            const overallNotes = document.getElementById('plan-overall-notes').value.trim();

            // Get selected landmarks with notes
            const selectedLandmarks = [];
            landmarks.forEach(landmark => {
                const checkbox = document.getElementById(`landmark-${landmark._id}`);
                if (checkbox && checkbox.checked) {
                    const notes = document.getElementById(`notes-${landmark._id}`).value.trim();
                    selectedLandmarks.push({
                        landmark_id: landmark._id,
                        notes: notes
                    });
                }
            });

            // Validate inputs
            if (!planName) {
                alert('Please enter a plan name');
                return;
            }

            if (!planDate) {
                alert('Please select a planned date');
                return;
            }

            if (selectedLandmarks.length === 0) {
                alert('Please select at least one place');
                return;
            }

            savePlan(planName, planDate, selectedLandmarks, overallNotes);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create plan!');
    }
}

// Save visit plan
async function savePlan(name, plannedDate, landmarks, overallNotes) {
    try {
        const token = getAuthToken();
        const response = await fetch(VISITPLANS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                name: name,
                planned_date: plannedDate,
                landmarks: landmarks,
                overall_notes: overallNotes
            })
        });

        if (!response.ok) throw new Error('Failed to save plan');

        alert('Visit plan saved successfully!');
        modal.style.display = 'none';

        // Refresh plans if on plans tab
        if (activeTab === 'plans-tab') {
            loadVisitPlans();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save visit plan!');
    }
}

// View plan details
async function viewPlanDetails(plan) {
    modalBody.innerHTML = `
        <h3>Visit Plan Details</h3>
        <div class="card">
            <div class="card-header">
                <h3>${plan.name}</h3>
                <span>${new Date(plan.planned_date).toLocaleDateString()}</span>
            </div>
            <div class="card-body">
                <h4>Places to Visit:</h4>
                <ul id="plan-landmarks-list"></ul>
                <p><strong>Overall Notes:</strong> ${plan.overall_notes || 'No notes'}</p>
            </div>
            <div class="card-footer">
                <button id="view-plan-on-map-btn">View on Map</button>
                <button id="edit-plan-btn">Edit Plan</button>
                <button id="delete-plan-btn" class="danger">Delete Plan</button>
            </div>
        </div>
    `;

    // Populate landmarks list
    const landmarksList = document.getElementById('plan-landmarks-list');
    plan.landmarks.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.landmark_id.name}</strong>`;
        if (item.notes) {
            li.innerHTML += `<br><em>Notes: ${item.notes}</em>`;
        }
        landmarksList.appendChild(li);
    });

    modal.style.display = 'block';

    // View on map button
    document.getElementById('view-plan-on-map-btn').addEventListener('click', function () {
        modal.style.display = 'none';
        changeTab('map-tab');

        // Add all landmarks to a group to zoom to fit them all
        setTimeout(() => {
            if (plan.landmarks.length > 0) {
                const latlngs = plan.landmarks.map(item => [
                    item.landmark_id.location.latitude,
                    item.landmark_id.location.longitude
                ]);

                if (latlngs.length === 1) {
                    map.setView(latlngs[0], 14);
                } else {
                    map.fitBounds(latlngs);
                }
            }
        }, 100);
    });

    // Edit plan button
    document.getElementById('edit-plan-btn').addEventListener('click', function () {
        showEditPlanModal(plan);
    });

    // Delete plan button
    document.getElementById('delete-plan-btn').addEventListener('click', function () {
        if (confirm('Are you sure you want to delete this plan?')) {
            deletePlan(plan._id);
        }
    });
}

// Delete plan
async function deletePlan(planId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${VISITPLANS_ENDPOINT}/${planId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to delete plan');

        alert('Plan deleted successfully!');
        modal.style.display = 'none';

        // Refresh data
        loadVisitPlans();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete plan!');
    }
}

// Helper function to display rating stars
function getRatingStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? '★' : '☆';
    }
    return stars;
}

// Helper function to get auth token from auth.js
function getAuthToken() {
    if (window.localStorage.getItem('authToken')) {
        return window.localStorage.getItem('authToken');
    }
    return null;
}

// Show modal to edit landmark
function showEditLandmarkModal(landmark) {
    modalBody.innerHTML = `
        <h3>Edit Landmark</h3>
        <div class="modal-form">
            <div class="form-group">
                <label for="edit-landmark-name">Name:</label>
                <input type="text" id="edit-landmark-name" value="${landmark.name}" required>
            </div>
            <div class="form-group">
                <label for="edit-landmark-description">Description:</label>
                <textarea id="edit-landmark-description">${landmark.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-landmark-category">Category:</label>
                <select id="edit-landmark-category">
                    <option value="historical" ${landmark.category === 'historical' ? 'selected' : ''}>Historical</option>
                    <option value="natural" ${landmark.category === 'natural' ? 'selected' : ''}>Natural</option>
                    <option value="cultural" ${landmark.category === 'cultural' ? 'selected' : ''}>Cultural</option>
                    <option value="other" ${landmark.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button id="update-landmark-btn">Update Landmark</button>
                <button id="delete-landmark-btn" class="danger">Delete Landmark</button>
                <button id="cancel-edit-btn">Cancel</button>
            </div>
        </div>
    `;

    // Show modal
    modal.style.display = 'block';

    // Update landmark button
    document.getElementById('update-landmark-btn').addEventListener('click', function () {
        const name = document.getElementById('edit-landmark-name').value.trim();
        const description = document.getElementById('edit-landmark-description').value.trim();
        const category = document.getElementById('edit-landmark-category').value;

        if (!name) {
            alert('Landmark name is required');
            return;
        }

        const updatedLandmark = {
            name: name,
            description: description,
            category: category
        };

        updateLandmark(landmark._id, updatedLandmark);
    });

    // Delete landmark button
    document.getElementById('delete-landmark-btn').addEventListener('click', function () {
        if (confirm('Are you sure you want to delete this landmark?')) {
            deleteLandmark(landmark._id);
        }
    });

    // Cancel button
    document.getElementById('cancel-edit-btn').addEventListener('click', function () {
        modal.style.display = 'none';
    });
}

// Update landmark
async function updateLandmark(landmarkId, landmarkData) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${LANDMARKS_ENDPOINT}/${landmarkId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(landmarkData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update landmark');
        }

        alert('Landmark updated successfully!');
        modal.style.display = 'none';


        if (activeTab === 'landmarks-tab') {
            loadLandmarks();
        } else {

            fetchLandmarks();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update landmark: ' + error.message);
    }
}

// Delete landmark
async function deleteLandmark(landmarkId) {
    try {

        const token = getAuthToken();
        const plansResponse = await fetch(VISITPLANS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!plansResponse.ok) throw new Error('Planları getirirken hata oluştu');

        const allPlans = await plansResponse.json();


        const affectedPlans = allPlans.filter(plan =>
            plan.landmarks && plan.landmarks.some(item =>
                item && item.landmark_id && item.landmark_id._id === landmarkId
            )
        );


        const response = await fetch(`${LANDMARKS_ENDPOINT}/${landmarkId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'İşaret silinirken hata oluştu');
        }


        if (affectedPlans.length > 0) {
            let deletedPlansCount = 0;


            for (const plan of affectedPlans) {
                const deleteResponse = await fetch(`${VISITPLANS_ENDPOINT}/${plan._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });

                if (deleteResponse.ok) {
                    deletedPlansCount++;
                }
            }

            // Sonuç mesajını güncelleyelim
            alert(`Landmark Deleted Successfully! ${deletedPlansCount} visiting plans are also deleted.`);
        } else {
            alert('Landmark Deleted Successfully!');
        }

        modal.style.display = 'none';


        if (activeTab === 'landmarks-tab') {
            loadLandmarks();
        } else if (activeTab === 'plans-tab') {

            loadVisitPlans();
        } else {

            fetchLandmarks();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Landmark Deleted Failed: ' + error.message);
    }
}

// Show modal to edit a visit
function showEditVisitModal(visit) {
    modalBody.innerHTML = `
        <h3>Edit Visit to ${visit.landmark_id.name}</h3>
        <div class="modal-form">
            <div class="form-group">
                <label for="edit-visit-date">Visit Date:</label>
                <input type="date" id="edit-visit-date" value="${visit.visited_date.substring(0, 10)}" required>
            </div>
            <div class="form-group">
                <label for="edit-visitor-name">Visitor Name:</label>
                <input type="text" id="edit-visitor-name" value="${visit.visitor_name || ''}" placeholder="Enter visitor name">
            </div>
            <div class="form-group">
                <label for="edit-visit-notes">Notes:</label>
                <textarea id="edit-visit-notes">${visit.notes || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-visit-rating">Rating:</label>
                <select id="edit-visit-rating">
                    <option value="0" ${visit.rating == 0 ? 'selected' : ''}>No Rating</option>
                    <option value="1" ${visit.rating == 1 ? 'selected' : ''}>★☆☆☆☆</option>
                    <option value="2" ${visit.rating == 2 ? 'selected' : ''}>★★☆☆☆</option>
                    <option value="3" ${visit.rating == 3 ? 'selected' : ''}>★★★☆☆</option>
                    <option value="4" ${visit.rating == 4 ? 'selected' : ''}>★★★★☆</option>
                    <option value="5" ${visit.rating == 5 ? 'selected' : ''}>★★★★★</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button id="update-visit-btn">Update Visit</button>
                <button id="cancel-edit-visit-btn">Cancel</button>
            </div>
        </div>
    `;

    // Show modal
    modal.style.display = 'block';

    // Update visit button
    document.getElementById('update-visit-btn').addEventListener('click', function () {
        const visitDate = document.getElementById('edit-visit-date').value;
        const notes = document.getElementById('edit-visit-notes').value.trim();
        const rating = document.getElementById('edit-visit-rating').value;
        const visitorName = document.getElementById('edit-visitor-name').value.trim();

        if (!visitDate) {
            alert('Visit date is required');
            return;
        }

        const updatedVisit = {
            visited_date: visitDate,
            notes: notes,
            rating: parseInt(rating) || 0,
            visitor_name: visitorName
        };

        updateVisit(visit._id, updatedVisit);
    });

    // Cancel button
    document.getElementById('cancel-edit-visit-btn').addEventListener('click', function () {
        modal.style.display = 'none';
    });
}

// Update visit
async function updateVisit(visitId, visitData) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${VISITED_ENDPOINT}/${visitId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(visitData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update visit');
        }

        alert('Visit updated successfully!');
        modal.style.display = 'none';


        loadVisited();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update visit: ' + error.message);
    }
}

// Show modal to edit a visit plan
async function showEditPlanModal(plan) {
    try {
        // First fetch all landmarks to allow adding new ones
        const token = getAuthToken();
        const response = await fetch(LANDMARKS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch landmarks');

        const landmarks = await response.json();

        // Prepare modal content
        modalBody.innerHTML = `
            <h3>Edit Visit Plan</h3>
            <div class="modal-form">
                <div class="form-group">
                    <label for="edit-plan-name">Plan Name:</label>
                    <input type="text" id="edit-plan-name" value="${plan.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-plan-date">Planned Date:</label>
                    <input type="date" id="edit-plan-date" value="${plan.planned_date.substring(0, 10)}" required>
                </div>
                <div class="form-group">
                    <label>Places to Visit:</label>
                    <div id="edit-plan-landmarks" class="landmarks-list"></div>
                </div>
                <div class="form-group">
                    <label for="edit-plan-overall-notes">Overall Notes:</label>
                    <textarea id="edit-plan-overall-notes">${plan.overall_notes || ''}</textarea>
                </div>
                <div class="modal-buttons">
                    <button id="update-plan-btn">Update Plan</button>
                    <button id="cancel-edit-plan-btn">Cancel</button>
                </div>
            </div>
        `;

        // Show modal
        modal.style.display = 'block';

        // Create landmark checkboxes
        const landmarksContainer = document.getElementById('edit-plan-landmarks');

        if (landmarks.length === 0) {
            landmarksContainer.innerHTML = '<p>No landmarks available.</p>';
        } else {
            // Track currently selected landmarks
            const selectedLandmarks = plan.landmarks.map(item => item.landmark_id._id);

            landmarks.forEach(landmark => {
                const isSelected = selectedLandmarks.includes(landmark._id);
                const landmarkNotes = isSelected
                    ? plan.landmarks.find(item => item.landmark_id._id === landmark._id)?.notes || ''
                    : '';

                const landmarkItemDiv = document.createElement('div');
                landmarkItemDiv.className = 'landmark-item';

                // Create checkbox and label
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `edit-landmark-${landmark._id}`;
                checkbox.value = landmark._id;
                checkbox.dataset.name = landmark.name;
                checkbox.checked = isSelected;

                const label = document.createElement('label');
                label.htmlFor = `edit-landmark-${landmark._id}`;
                label.textContent = landmark.name;

                // Create notes textarea
                const notesContainer = document.createElement('div');
                notesContainer.className = 'landmark-item-notes';
                notesContainer.style.display = isSelected ? 'block' : 'none';

                const notesTextarea = document.createElement('textarea');
                notesTextarea.placeholder = 'Notes for this place';
                notesTextarea.id = `edit-notes-${landmark._id}`;
                notesTextarea.value = landmarkNotes;

                // Show/hide notes textarea when checkbox changes
                checkbox.addEventListener('change', function () {
                    notesContainer.style.display = this.checked ? 'block' : 'none';
                });

                notesContainer.appendChild(notesTextarea);
                landmarkItemDiv.appendChild(checkbox);
                landmarkItemDiv.appendChild(label);
                landmarksContainer.appendChild(landmarkItemDiv);
                landmarksContainer.appendChild(notesContainer);
            });
        }

        // Update plan button
        document.getElementById('update-plan-btn').addEventListener('click', function () {
            const planName = document.getElementById('edit-plan-name').value.trim();
            const planDate = document.getElementById('edit-plan-date').value;
            const overallNotes = document.getElementById('edit-plan-overall-notes').value.trim();

            // Get selected landmarks with notes
            const updatedLandmarks = [];
            landmarks.forEach(landmark => {
                const checkbox = document.getElementById(`edit-landmark-${landmark._id}`);
                if (checkbox && checkbox.checked) {
                    const notes = document.getElementById(`edit-notes-${landmark._id}`).value.trim();
                    updatedLandmarks.push({
                        landmark_id: landmark._id,
                        notes: notes
                    });
                }
            });

            // Validate inputs
            if (!planName) {
                alert('Please enter a plan name');
                return;
            }

            if (!planDate) {
                alert('Please select a planned date');
                return;
            }

            if (updatedLandmarks.length === 0) {
                alert('Please select at least one place');
                return;
            }

            const updatedPlan = {
                name: planName,
                planned_date: planDate,
                landmarks: updatedLandmarks,
                overall_notes: overallNotes
            };

            updatePlan(plan._id, updatedPlan);
        });

        // Cancel button
        document.getElementById('cancel-edit-plan-btn').addEventListener('click', function () {
            modal.style.display = 'none';
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to prepare edit plan form: ' + error.message);
    }
}

// Update visit plan
async function updatePlan(planId, planData) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${VISITPLANS_ENDPOINT}/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(planData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update visit plan');
        }

        alert('Visit plan updated successfully!');
        modal.style.display = 'none';

        // Refresh plans list
        loadVisitPlans();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update visit plan: ' + error.message);
    }
}

// Helper function to fetch all visits for filtering
async function fetchAllVisits() {
    try {
        const token = getAuthToken();
        const response = await fetch(VISITED_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch visited data');

        return await response.json();
    } catch (error) {
        console.error('Error fetching all visits:', error);
        return [];
    }
}

// Helper function to search landmarks by name
async function searchLandmarksByName(name) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${LANDMARKS_ENDPOINT}?name=${encodeURIComponent(name)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to search landmarks');

        return await response.json();
    } catch (error) {
        console.error('Error searching landmarks:', error);
        return [];
    }
} 