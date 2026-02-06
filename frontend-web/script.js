// 1. Khai báo các biến trỏ tới các phần tử HTML
const videoGrid = document.getElementById('video-container');
const modal = document.getElementById("videoModal");
const closeBtn = document.querySelector(".close-btn");
const playerContainer = document.getElementById("player-container");
const searchInput = document.querySelector('.search-box input');
const searchBtn = document.getElementById('search-btn');

/**
 * 2. Hàm dùng chung để hiển thị danh sách video lên giao diện
 * Giúp đồng bộ giao diện cho cả lúc tải trang, tìm kiếm và lọc.
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
        
        // QUAN TRỌNG: Luôn sử dụng v.videoId từ Database để mở player
        // Điều này tránh việc phải dùng Regex tách ID nhiều lần dễ gây lỗi.
        card.onclick = () => openPlayer(v.videoId, v.platform);

        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${v.thumbnailUrl}" alt="${v.title}" onerror="this.src='https://picsum.photos/300/170'">
                <span class="badge ${v.platform.toLowerCase()}">${v.platform}</span>
            </div>
            <div class="video-meta">
                <h3>${v.title}</h3>
                <p>Nền tảng: ${v.platform}</p>
            </div>
        `;
        videoGrid.appendChild(card);
    });
}

/**
 * 3. Hàm lấy danh sách video từ Backend (Dùng chung cho Load/Search/Filter)
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
 * 4. Hàm mở Modal và nhúng Iframe để phát video
 * Cập nhật thuộc tính allow để sửa lỗi "Mã lượt phát" trên Chrome/Edge.
 */
function openPlayer(videoId, platform) {
    if (!videoId) {
        alert("Không tìm thấy ID video hợp lệ!");
        return;
    }

    let embedHtml = '';
    if (platform === 'YOUTUBE') {
        embedHtml = `
            <iframe width="100%" height="500" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
            </iframe>`;
    } else if (platform === 'TIKTOK') {
    // Đảm bảo videoId không chứa ký tự lạ
    const cleanId = videoId.trim();
        embedHtml = `
            <iframe 
                src="https://www.tiktok.com/embed/v2/${cleanId}" 
                style="width: 100%; height: 750px; border: none;" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
            </iframe>`;
    }

    playerContainer.innerHTML = embedHtml;
    modal.style.display = "block"; 
}

// 5. Xử lý đóng Modal
function closeModal() {
    modal.style.display = "none";
    playerContainer.innerHTML = ""; 
}

closeBtn.onclick = closeModal;
window.onclick = (event) => { if (event.target == modal) closeModal(); };

// 6. Xử lý Tìm kiếm (Gọi API search để Java cào dữ liệu từ YouTube về)
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        loadVideos();
        return;
    }
    // Hiển thị trạng thái đang xử lý vì gọi API YouTube mất thời gian
    videoGrid.innerHTML = '<p style="color: white; padding: 20px;">Đang tìm kiếm trên YouTube...</p>';
    loadVideos(`http://localhost:8080/api/videos/search?query=${query}`);
}

searchBtn.onclick = handleSearch;
searchInput.onkeypress = (e) => { if (e.key === 'Enter') handleSearch(); };

// 7. Xử lý bộ lọc Sidebar (Lọc theo nền tảng)
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        // 1. Đổi màu nút được chọn
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        // 2. Lấy tên mục vừa bấm
        const platformName = this.innerText.trim();

        // 3. Logic lọc
        if (platformName === 'Trang chủ') {
            loadVideos(); // Gọi hàm lấy tất cả video ban đầu của bạn
        } else if (platformName === 'YouTube') {
            fetchFilteredVideos('YOUTUBE');
        } else if (platformName === 'TikTok') {
            fetchFilteredVideos('TIKTOK');
        } else if (platformName === 'Video đã lưu') {
            // Chức năng này bạn có thể làm sau (lấy từ LocalStorage hoặc DB riêng)
            alert("Chức năng Video đã lưu đang phát triển!");
        }
    });
});

// Hàm bổ trợ để gọi API lọc
function fetchFilteredVideos(platform) {
    fetch(`http://localhost:8080/api/videos/filter?platform=${platform}`)
        .then(response => response.json())
        .then(data => {
            displayVideos(data); // Dùng hàm vẽ video có sẵn của bạn
        })
        .catch(error => console.error('Lỗi khi lọc video:', error));
}

// Chạy lần đầu khi trang web tải xong
document.addEventListener('DOMContentLoaded', () => loadVideos());

// Hàm hiện khung đăng nhập
function showLoginModal() {
    document.getElementById('authModal').style.display = 'block';
}

// Hàm đóng khung đăng nhập
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

// Hàm xử lý gửi dữ liệu đăng nhập tới Spring Boot
async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        });

        if (response.ok) {
            const user = await response.json();
            alert("Đăng nhập thành công! Chào " + user.username);
            closeAuthModal();
            // Cập nhật giao diện sau khi đăng nhập thành công
            document.querySelector('.user-profile').innerHTML = `<span>${user.username}</span>`;
        } else {
            alert("Sai tên đăng nhập hoặc mật khẩu!");
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
    }
}