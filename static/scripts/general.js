const BASE_URL = window.location.origin

// Get Profile
async function getProfile() {
	const data = await fetch(`${BASE_URL}/general/user`, {
		method: "GET",
		headers: { "Content-Type": "application/json" }
	});

	const profile = await data.json()

	// Redirect if not authenticated
	if (!data.ok) {
		if (data.status === 401) {
			// Redirect to login page if unauthorized
			window.location.href = '/login';
			return;
		}
		throw new Error(`HTTP error! Status: ${response.status}`);
	}

	return profile.profile
}

// Logout Function
async function logout() {
	await fetch(`${BASE_URL}/auth/logout`, { method: "POST" });
	localStorage.clear() // Remove local storage entirely
	// localStorage.removeItem("user");  // Remove user info
	// localStorage.removeItem("playableGames");  // Remove user info
	window.location.href = '/login';
}

/*
HEADER CODE
*/
function createHeader(includeSidebar = false) {
	const body = document.body;

	// Create the sidebar
	if (includeSidebar) {
		const sidebar = document.createElement('div')
		sidebar.className = 'sidebar'
		sidebar.id = 'sidebar'
		body.appendChild(sidebar)
	}

	const sidebarHTML = (includeSidebar) ? `<button id="menu-btn" class="menu-btn">☰</button>` : ``

	const header = document.createElement('header')
	header.id = 'header'
	header.className = 'header'
	header.innerHTML = `<div class="header-content" id="header-content">
			${sidebarHTML}
			<div class="header-right">
				<div class="active-games-menu">
					Active Games
					<ul class="active-games-list">
					</ul>
				</div>
				<img src="https://www.svgrepo.com/show/316857/profile-simple.svg"
					style="height: 1.5em; background-color: white; border-radius: 50%;">
				<button onclick="logout()">Logout</button>
				<div id="collapse-btn" style="color: white; cursor: pointer;">❮❮</div>
				<div id="expand-btn" style="color: white; cursor: pointer; display: none;">❯❯</div>
			</div>
		</div>`
	body.appendChild(header)

	const menuBtn = document.getElementById('menu-btn');
	const collapseBtn = document.getElementById('collapse-btn');
	const expandBtn = document.getElementById('expand-btn');

	if (includeSidebar) {
		// Start with the sidebar open
		body.classList.add('sidebar-open');

		// Update the side bar width
		function updateSidebarWidth() {
			const computedWidth = `${sidebar.offsetWidth}px`;
			document.documentElement.style.setProperty('--sidebar-width', computedWidth);
		}

		// Open / close the side bard
		menuBtn.addEventListener('click', () => {
			body.classList.toggle('sidebar-open');
			// Wait for DOM to apply sidebar open styles
			requestAnimationFrame(updateSidebarWidth);
		});

		// update on resize for max-content limits
		window.addEventListener('resize', () => {
			if (body.classList.contains('sidebar-open')) {
				updateSidebarWidth();
			}
		});

		// resize listener if sidebar is open
		window.addEventListener('resize', () => {
			if (body.classList.contains('sidebar-open')) {
				const computedWidth = `${sidebar.offsetWidth}px`;
				document.documentElement.style.setProperty('--sidebar-width', computedWidth);
			}
		});
	}
	else {
		document.documentElement.style.setProperty('--header-justification', 'right')
	}

	// Collapse the header
	collapseBtn.addEventListener('click', () => {
		header.classList.add('header-collapsed');
		if (includeSidebar) { body.classList.remove('sidebar-open') }
	});

	// Expand the header
	expandBtn.addEventListener('click', () => {
		header.classList.remove('header-collapsed');
	});
}