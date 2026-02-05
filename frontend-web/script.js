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
    // Luôn sử dụng định dạng nhúng v2
        embedHtml = `
            <iframe 
                src="https://www.tiktok.com/embed/v2/${videoId}" 
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
    item.onclick = (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const label = item.innerText.trim();
        if (label === 'Trang chủ') {
            loadVideos();
        } else if (label === 'YouTube' || label === 'TikTok') {
            // Lưu ý: Cần thêm Endpoint /filter vào Java VideoController để chạy dòng này
            loadVideos(`http://localhost:8080/api/videos/filter?platform=${label.toUpperCase()}`);
        }
    };
});

// Chạy lần đầu khi trang web tải xong
document.addEventListener('DOMContentLoaded', () => loadVideos());