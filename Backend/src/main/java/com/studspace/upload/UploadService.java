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
import java.util.Set;
import java.util.UUID;

@Service
public class UploadService {

    private static final Logger log = LoggerFactory.getLogger(UploadService.class);

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

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
        if (!"application/pdf".equals(file.getContentType())) {
            throw new BadRequestException("Only PDF files are allowed.");
        }
        byte[] bytes = readBytes(file);
        if (!hasPdfMagic(bytes)) {
            throw new BadRequestException("File is not a valid PDF.");
        }
        try {
            // Always store with a .pdf extension — never trust the client filename (double-extension risk).
            log.info("Uploading PDF ({} bytes) to Cloudinary", file.getSize());
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    bytes,
                    ObjectUtils.asMap(
                            "resource_type", "raw",
                            "type", "upload",
                            "access_mode", "public",
                            "public_id", UUID.randomUUID().toString() + ".pdf"
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Upload success: {}", url);
            return url;
        } catch (Exception e) {
            throw new BadRequestException("Upload failed: " + e.getMessage());
        }
    }

    public String uploadImage(MultipartFile file) {
        checkConfigured();
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Only JPEG, PNG, WebP, or GIF images are allowed.");
        }
        byte[] bytes = readBytes(file);
        if (!hasImageMagic(bytes)) {
            throw new BadRequestException("File is not a valid image.");
        }
        try {
            log.info("Uploading image ({} bytes) to Cloudinary", file.getSize());
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    bytes,
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
        } catch (Exception e) {
            throw new BadRequestException("Image upload failed: " + e.getMessage());
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file");
        }
    }

    // Verify the file's actual content (magic bytes), not just the spoofable Content-Type header.
    private boolean hasPdfMagic(byte[] b) {
        return b.length >= 5 && b[0] == 0x25 && b[1] == 0x50 && b[2] == 0x44 && b[3] == 0x46 && b[4] == 0x2D; // %PDF-
    }

    private boolean hasImageMagic(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return true; // JPEG
        if (b.length >= 4 && (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) return true;   // PNG
        if (b.length >= 4 && b[0] == 0x47 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x38) return true;            // GIF8
        if (b.length >= 12 && b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46
                && b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50) return true;                    // RIFF....WEBP
        return false;
    }
}
