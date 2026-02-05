package com.duanweb.video_service.controller;

import com.duanweb.video_service.model.Video;
import com.duanweb.video_service.repository.VideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = "*") 
public class VideoController {
    
    @Autowired
    private VideoRepository videoRepository;

    // Lấy danh sách video để hiển thị lên trang chủ
    @GetMapping
    public List<Video> getAllVideos() {
        return videoRepository.findAll();
    }

    // THÊM MỚI: Hàm để lưu video từ giao diện web vào Database
    @PostMapping
    public Video addVideo(@RequestBody Video video) {
        // Tự động xử lý nếu là link YouTube
        if ("YOUTUBE".equalsIgnoreCase(video.getPlatform()) && video.getVideoUrl() != null) {
            if (video.getVideoUrl().contains("v=")) {
                // Tách ID sau "v=" (ví dụ: b6S6K0E1GSw)
                String id = video.getVideoUrl().split("v=")[1].split("&")[0];
                video.setVideoId(id);
                
                // Tự động tạo link thumbnail chuẩn nếu người dùng để trống
                if (video.getThumbnailUrl() == null || video.getThumbnailUrl().isEmpty()) {
                    video.setThumbnailUrl("https://img.youtube.com/vi/" + id + "/mqdefault.jpg");
                }
            }
        } 
        // Tự động xử lý nếu là link TikTok
        else if ("TIKTOK".equalsIgnoreCase(video.getPlatform()) && video.getVideoUrl() != null) {
            // Tách ID là dãy số cuối cùng của link TikTok
            String[] parts = video.getVideoUrl().split("/");
            String id = parts[parts.length - 1];
            video.setVideoId(id);
        }

        return videoRepository.save(video);
    }
}