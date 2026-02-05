// 1. Khai báo các biến trỏ tới các phần tử HTML
const videoGrid = document.getElementById('video-container');
const modal = document.getElementById("videoModal");
const closeBtn = document.querySelector(".close-btn");
const playerContainer = document.getElementById("player-container");

// 2. Hàm lấy danh sách video từ Backend (Spring Boot)
async function loadVideos() {
    try {
        // Gọi API từ Backend
        const response = await fetch('http://localhost:8080/api/videos');
        const videos = await response.json();
        
        // Xóa nội dung cũ trong lưới video
        videoGrid.innerHTML = '';

        // Duyệt qua từng video và tạo giao diện thẻ (Card)
        videos.forEach(v => {
            const card = document.createElement('div');
            card.className = 'video-card';
            
            // Lắng nghe sự kiện click để mở trình phát video
            card.onclick = () => openPlayer(v.videoUrl, v.platform);

            card.innerHTML = `
                <div class="thumb-wrapper">
                    <img src="${v.thumbnailUrl}" alt="${v.title}">
                    <span class="badge ${v.platform.toLowerCase()}">${v.platform}</span>
                </div>
                <div class="video-meta">
                    <h3>${v.title}</h3>
                    <p>Nền tảng: ${v.platform}</p>
                </div>
            `;
            videoGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Lỗi kết nối API hoặc Backend chưa chạy:", error);
    }
}

// 3. Hàm mở Modal và nhúng Iframe để phát video
function openPlayer(url, platform) {
    let embedHtml = '';

    if (platform === 'YOUTUBE') {
        // Tách ID video từ URL YouTube (ví dụ: v=dQw4w9WgXcQ)
        const videoId = url.split('v=')[1]?.split('&')[0];
        embedHtml = `
            <iframe width="100%" height="500" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
            </iframe>`;
    } else if (platform === 'TIKTOK') {
        // Tách ID video từ URL TikTok (thường là dãy số cuối cùng)
        const videoId = url.split('/').pop();
        embedHtml = `
            <iframe src="https://www.tiktok.com/embed/v2/${videoId}" 
                style="width: 100%; height: 700px;" 
                frameborder="0" allowfullscreen>
            </iframe>`;
    }

    // Chèn đoạn mã Iframe vào container và hiển thị Modal
    playerContainer.innerHTML = embedHtml;
    modal.style.display = "block"; 
}

// 4. Hàm đóng Modal và dừng video
function closeModal() {
    modal.style.display = "none";
    playerContainer.innerHTML = ""; // Quan trọng: Xóa Iframe để video ngừng phát nhạc ngầm
}

// 5. Gán các sự kiện đóng Modal
closeBtn.onclick = closeModal;

// Đóng khi nhấn ra ngoài vùng nội dung video (vào vùng nền đen)
window.onclick = (event) => {
    if (event.target == modal) {
        closeModal();
    }
};

// 6. Chạy hàm loadVideos ngay khi trang web tải xong
document.addEventListener('DOMContentLoaded', loadVideos);

// Lấy các phần tử của thanh tìm kiếm
const searchInput = document.querySelector('.search-box input');
const searchBtn = document.getElementById('search-btn');

// Hàm thực hiện tìm kiếm
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        loadVideos(); // Nếu để trống thì hiện lại tất cả video
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/videos/search?query=${query}`);
        const results = await response.json();
        
        displayVideos(results); // Gọi hàm hiển thị kết quả
    } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
    }
}

// Hàm bổ trợ để tái sử dụng việc vẽ giao diện video
function displayVideos(videos) {
    videoGrid.innerHTML = '';
    if (videos.length === 0) {
        videoGrid.innerHTML = '<p style="color: white; padding: 20px;">Không tìm thấy video nào phù hợp.</p>';
        return;
    }

    videos.forEach(v => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => openPlayer(v.videoId, v.platform);
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${v.thumbnailUrl}" alt="${v.title}">
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

// Lắng nghe sự kiện click nút tìm kiếm
searchBtn.addEventListener('click', handleSearch);

// Lắng nghe sự kiện nhấn phím Enter trong ô nhập
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});