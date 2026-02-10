/**
 * 1. Khai báo các biến trỏ tới các phần tử HTML
 */
const videoGrid = document.getElementById('video-container');
const modal = document.getElementById("videoModal");
const closeBtn = document.querySelector(".close-btn");
const playerContainer = document.getElementById("player-container");
const searchInput = document.querySelector('.search-box input');
const searchBtn = document.getElementById('search-btn');

let isLoginMode = true;

/**
 * 2. Hàm hiển thị danh sách video lên giao diện
 */
function displayVideos(videos) {
    videoGrid.innerHTML = '';
    if (!videos || videos.length === 0) {
        videoGrid.innerHTML = '<p style="color: white; padding: 20px;">Không tìm thấy video nào.</p>';
        return;
    }

    videos.forEach(v => {
        const card = document.createElement('div');
        card.className = 'video-card';
        
        // Cấu trúc thẻ video bao gồm nút yêu thích riêng biệt
        card.innerHTML = `
            <div class="thumb-wrapper" onclick="openPlayer('${v.videoId}', '${v.platform}')">
                <img src="${v.thumbnailUrl}" alt="${v.title}" onerror="this.src='https://picsum.photos/300/170'">
                <span class="badge ${v.platform.toLowerCase()}">${v.platform}</span>
                <button class="save-btn" onclick="saveToFavorite(event, ${v.id})" title="Lưu vào yêu thích">
                    ❤️
                </button>
            </div>
            <div class="video-meta" onclick="openPlayer('${v.videoId}', '${v.platform}')">
                <h3>${v.title}</h3>
                <p>Nền tảng: ${v.platform}</p>
            </div>
        `;
        videoGrid.appendChild(card);
    });
}

/**
 * 3. Chức năng lưu video vào mục yêu thích
 */
async function saveToFavorite(event, videoId) {
    // Ngăn chặn mở trình phát video khi nhấn nút lưu
    event.stopPropagation();

    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        alert("Vui lòng đăng nhập để lưu video yêu thích!");
        showLoginModal();
        return;
    }

    const user = JSON.parse(savedUser);
    
    try {
        // Gọi API add favorite đã thêm trong VideoController
        const response = await fetch(`http://localhost:8080/api/videos/favorites/add?userId=${user.id}&videoId=${videoId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert("Đã thêm vào mục yêu thích!");
        } else {
            const errorMsg = await response.text();
            alert(errorMsg || "Lỗi khi lưu video.");
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
    }
}

/**
 * 4. Hàm lấy danh sách video từ Backend (Mặc định hoặc Tìm kiếm)
 */
async function loadVideos(url = 'http://localhost:8080/api/videos') {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Lỗi kết nối Server");
        const videos = await response.json();
        displayVideos(videos);
    } catch (error) {
        console.error("Lỗi:", error);
        videoGrid.innerHTML = '<p style="color: red; padding: 20px;">Không thể kết nối đến máy chủ Backend!</p>';
    }
}

/**
 * 5. Hàm mở Modal và nhúng Iframe phát video
 */
function openPlayer(videoId, platform) {
    if (!videoId) return;

    let embedHtml = '';
    if (platform === 'YOUTUBE') {
        embedHtml = `
            <iframe width="100%" height="500" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" allowfullscreen>
            </iframe>`;
    } else if (platform === 'TIKTOK') {
        embedHtml = `
            <iframe src="https://www.tiktok.com/embed/v2/${videoId}" 
                style="width: 100%; height: 750px; border: none;" allowfullscreen>
            </iframe>`;
    }

    playerContainer.innerHTML = embedHtml;
    modal.style.display = "block"; 
}

function closeModal() {
    modal.style.display = "none";
    playerContainer.innerHTML = ""; 
}

closeBtn.onclick = closeModal;
window.onclick = (e) => { if (e.target == modal) closeModal(); };

/**
 * 6. Xử lý Tìm kiếm
 */
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        loadVideos();
        return;
    }
    videoGrid.innerHTML = '<p style="color: white; padding: 20px;">Đang tìm kiếm...</p>';
    loadVideos(`http://localhost:8080/api/videos/search?query=${query}`);
}

searchBtn.onclick = handleSearch;
searchInput.onkeypress = (e) => { if (e.key === 'Enter') handleSearch(); };

/**
 * 7. Xử lý bộ lọc Sidebar và Video đã lưu
 */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        const platformName = this.innerText.trim();
        if (platformName === 'Trang chủ') {
            loadVideos();
        } else if (platformName === 'YouTube') {
            fetchFilteredVideos('YOUTUBE');
        } else if (platformName === 'TikTok') {
            fetchFilteredVideos('TIKTOK');
        } else if (platformName === 'Video đã lưu') {
            handleViewFavorites();
        }
    });
});

async function handleViewFavorites() {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        alert("Vui lòng đăng nhập để xem danh sách yêu thích!");
        showLoginModal();
        return;
    }
    const user = JSON.parse(savedUser);
    // Bạn cần tạo thêm một Endpoint GET /api/videos/favorites?userId=... ở Backend để dùng hàm này
    loadVideos(`http://localhost:8080/api/videos/favorites?userId=${user.id}`);
}

function fetchFilteredVideos(platform) {
    fetch(`http://localhost:8080/api/videos/filter?platform=${platform}`)
        .then(response => response.json())
        .then(data => displayVideos(data))
        .catch(err => console.error('Lỗi lọc video:', err));
}

/**
 * 8. XỬ LÝ ĐĂNG KÝ / ĐĂNG NHẬP
 */
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Đăng nhập hệ thống" : "Đăng ký tài khoản mới";
    document.getElementById('register-email').style.display = isLoginMode ? "none" : "block";
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? "Xác nhận Đăng nhập" : "Xác nhận Đăng ký";
    document.getElementById('auth-toggle-text').innerText = isLoginMode ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập ngay";
}

function showLoginModal() { document.getElementById('authModal').style.display = 'block'; }
function closeAuthModal() { document.getElementById('authModal').style.display = 'none'; }

async function handleAuth() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const email = document.getElementById('register-email').value;

    const endpoint = isLoginMode ? '/login' : '/register';
    const payload = isLoginMode ? { username, password } : { username, password, email };

    try {
        const response = await fetch(`http://localhost:8080/api/auth${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            if (isLoginMode) {
                alert("Chào mừng " + result.username);
                localStorage.setItem('currentUser', JSON.stringify(result));
                updateUserUI(result.username);
                closeAuthModal();
            } else {
                alert("Đăng ký thành công!");
                toggleAuthMode();
            }
        } else {
            alert("Lỗi xác thực thông tin!");
        }
    } catch (err) {
        console.error(err);
    }
}

function updateUserUI(username) {
    const userProfile = document.getElementById('user-profile-section');
    if (userProfile) {
        userProfile.innerHTML = `
            <span style="color: white; margin-right: 15px;">Chào, ${username}</span>
            <button onclick="handleLogout()" class="logout-btn">Thoát</button>
        `;
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', () => {
    loadVideos();
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        updateUserUI(JSON.parse(savedUser).username);
    }
});