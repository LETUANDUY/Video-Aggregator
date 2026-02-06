package com.duanweb.video_service.repository;

import com.duanweb.video_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Dùng để tìm người dùng khi đăng nhập
    Optional<User> findByUsername(String username);
}