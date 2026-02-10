package com.duanweb.video_service.controller;

import com.duanweb.video_service.model.Video;
import com.duanweb.video_service.model.User;
import com.duanweb.video_service.model.Favorite;
import com.duanweb.video_service.repository.VideoRepository;
import com.duanweb.video_service.repository.UserRepository;
import com.duanweb.video_service.repository.FavoriteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.*;
import org.springframework.web.util.HtmlUtils;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = "*") 
public class VideoController {
    
    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    private final String YOUTUBE_API_KEY = "AIzaSyD3W6vkAhxKtUWxfFhXku3Rz1Cml4Awaxc";
    private final String RAPID_API_KEY = "1b444beb42msha062986be12a8f3p1363aejsn8976f46a9297";

    @GetMapping
    public List<Video> getAllVideos() {
        return videoRepository.findAll();
    }

    @GetMapping("/filter")
    public List<Video> filterVideos(@RequestParam String platform) {
        if (platform.equalsIgnoreCase("ALL")) {
            return videoRepository.findAll();
        }
        return videoRepository.findByPlatformIgnoreCase(platform);
    }

    // --- CHỨC NĂNG LƯU VIDEO YÊU THÍCH ---
    @PostMapping("/favorites/add")
    public ResponseEntity<?> addToFavorite(@RequestParam Long userId, @RequestParam Long videoId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            Optional<Video> videoOpt = videoRepository.findById(videoId);

            if (userOpt.isEmpty() || videoOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng hoặc video.");
            }

            User user = userOpt.get();
            Video video = videoOpt.get();

            // Kiểm tra nếu video đã được lưu trước đó
            if (favoriteRepository.findByUserAndVideo(user, video).isPresent()) {
                return ResponseEntity.badRequest().body("Video này đã có trong danh sách yêu thích.");
            }

            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setVideo(video);
            favoriteRepository.save(favorite);

            return ResponseEntity.ok("Đã thêm vào mục yêu thích thành công!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    @Transactional 
    public List<Video> searchVideos(@RequestParam String query) {
        RestTemplate restTemplate = new RestTemplate();

        // 1. GỌI YOUTUBE API
        try {
            String youtubeUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=" 
                                + query + "&key=" + YOUTUBE_API_KEY + "&type=video";
            
            Map<String, Object> ytResponse = restTemplate.getForObject(youtubeUrl, Map.class);
            if (ytResponse != null && ytResponse.containsKey("items")) {
                List<Map<String, Object>> items = (List<Map<String, Object>>) ytResponse.get("items");
                for (Map<String, Object> item : items) {
                    String vId = (String) ((Map<String, Object>) item.get("id")).get("videoId");
                    if (vId != null && !videoRepository.existsByVideoId(vId)) {
                        Map<String, Object> snippet = (Map<String, Object>) item.get("snippet");
                        Video video = new Video();
                        video.setVideoId(vId);
                        video.setTitle(HtmlUtils.htmlUnescape((String) snippet.get("title")));
                        video.setPlatform("YOUTUBE");
                        video.setThumbnailUrl((String) ((Map<String, Object>) ((Map<String, Object>) snippet.get("thumbnails")).get("medium")).get("url"));
                        video.setVideoUrl("https://www.youtube.com/watch?v=" + vId);
                        videoRepository.save(video);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi YouTube API: " + e.getMessage());
        }

        // 2. GỌI TIKTOK API
        try {
            String tiktokUrl = "https://tiktok-all-in-one-working.p.rapidapi.com/search?keywords=" + query;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-RapidAPI-Key", RAPID_API_KEY);
            headers.set("X-RapidAPI-Host", "tiktok-all-in-one-working.p.rapidapi.com");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> ttResponse = restTemplate.exchange(tiktokUrl, HttpMethod.GET, entity, Map.class);
            
            if (ttResponse.getBody() != null && ttResponse.getBody().containsKey("data")) {
                List<Map<String, Object>> ttVideos = (List<Map<String, Object>>) ttResponse.getBody().get("data");
                for (Map<String, Object> ttItem : ttVideos) {
                    String ttId = (String) ttItem.get("video_id");
                    if (ttId != null && !videoRepository.existsByVideoId(ttId)) {
                        Video video = new Video();
                        video.setVideoId(ttId);
                        video.setTitle((String) ttItem.get("title"));
                        video.setPlatform("TIKTOK");
                        video.setThumbnailUrl((String) ttItem.get("cover"));
                        video.setVideoUrl("https://www.tiktok.com/video/" + ttId);
                        videoRepository.save(video);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi TikTok API: " + e.getMessage());
        }

        return videoRepository.findByTitleContainingIgnoreCase(query);
    }
    @GetMapping("/favorites")
public ResponseEntity<?> getUserFavorites(@RequestParam Long userId) {
    try {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng.");
        }

        // Tìm tất cả các bản ghi trong bảng favorites của user này
        List<Favorite> favorites = favoriteRepository.findByUser(userOpt.get());
        
        // Chuyển đổi danh sách Favorite thành danh sách Video để hiển thị
        List<Video> favoriteVideos = favorites.stream()
                                              .map(Favorite::getVideo)
                                              .toList();
                                              
        return ResponseEntity.ok(favoriteVideos);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi: " + e.getMessage());
    }
}
}

