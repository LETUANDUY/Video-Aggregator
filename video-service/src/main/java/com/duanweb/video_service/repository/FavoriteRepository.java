package com.duanweb.video_service.repository;

import com.duanweb.video_service.model.Favorite;
import com.duanweb.video_service.model.User;
import com.duanweb.video_service.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser(User user);
    Optional<Favorite> findByUserAndVideo(User user, Video video);
}