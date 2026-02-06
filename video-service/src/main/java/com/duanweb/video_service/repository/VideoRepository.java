package com.duanweb.video_service.repository;

import com.duanweb.video_service.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    // Tìm kiếm video theo tiêu đề để hiển thị kết quả
    List<Video> findByTitleContainingIgnoreCase(String title);
    
    // Rất quan trọng: Kiểm tra xem videoId đã tồn tại chưa để thực hiện lệnh lưu
    boolean existsByVideoId(String videoId);
    List<Video> findByPlatformIgnoreCase(String platform);

}
