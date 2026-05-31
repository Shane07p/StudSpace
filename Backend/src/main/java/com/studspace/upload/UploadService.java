package com.studspace.upload;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.studspace.common.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class UploadService {

    private static final Logger log = LoggerFactory.getLogger(UploadService.class);

    private final Cloudinary cloudinary;

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    public UploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    private void checkConfigured() {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            throw new BadRequestException("File upload is not configured. Add CLOUDINARY_URL to your .env file.");
        }
    }

    public String uploadPdf(MultipartFile file) {
        checkConfigured();
        try {
            String ext = ".pdf";
            String original = file.getOriginalFilename();
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf('.'));
            }
            log.info("Uploading {} ({} bytes) to Cloudinary", ext, file.getSize());
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "resource_type", "raw",
                            "type", "upload",
                            "access_mode", "public",
                            "public_id", UUID.randomUUID().toString() + ext
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Upload success: {}", url);
            return url;
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file");
        } catch (Exception e) {
            throw new BadRequestException("Upload failed: " + e.getMessage());
        }
    }

    public String uploadImage(MultipartFile file) {
        checkConfigured();
        try {
            log.info("Uploading image ({} bytes) to Cloudinary", file.getSize());
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "resource_type", "image",
                            "type", "upload",
                            "access_mode", "public",
                            "public_id", UUID.randomUUID().toString()
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Image upload success: {}", url);
            return url;
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file");
        } catch (Exception e) {
            throw new BadRequestException("Image upload failed: " + e.getMessage());
        }
    }
}
