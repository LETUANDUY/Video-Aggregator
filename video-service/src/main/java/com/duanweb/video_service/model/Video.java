package com.duanweb.video_service.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Video {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String videoUrl;
    private String platform; // YOUTUBE hoặc TIKTOK
    private String thumbnailUrl;
    private String videoId; // ID video trên nền tảng
}