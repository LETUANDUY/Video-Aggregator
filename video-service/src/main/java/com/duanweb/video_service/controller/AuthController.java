package com.duanweb.video_service.controller;

import com.duanweb.video_service.model.User;
import com.duanweb.video_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // Endpoint Đăng ký
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Tên đăng nhập đã tồn tại!");
        }
        // Trong thực tế hãy dùng BCryptPasswordEncoder để mã hóa mật khẩu ở đây
        return ResponseEntity.ok(userRepository.save(user));
    }

    // Endpoint Đăng nhập (Hiện tại đã có)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        try {
            Optional<User> user = userRepository.findByUsername(loginRequest.getUsername());
            if (user.isPresent() && user.get().getPassword().equals(loginRequest.getPassword())) {
                return ResponseEntity.ok(user.get());
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai tên đăng nhập hoặc mật khẩu");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi hệ thống: " + e.getMessage());
        }
    }
}
