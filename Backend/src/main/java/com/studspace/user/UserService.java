package com.studspace.user;

import com.studspace.common.BadRequestException;
import com.studspace.common.ConflictException;
import com.studspace.common.NotFoundException;
import com.studspace.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserHandleRepository handleRepository;
    private final ModelMapper mapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),
                user.getPasswordHash() != null ? user.getPasswordHash() : "",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Transactional
    public User findOrCreateGoogleUser(String email, String name, String googleSub) {
        // Already linked to this Google account
        return userRepository.findByGoogleSub(googleSub).orElseGet(() ->
            // Same email registered with password — link the Google sub
            userRepository.findByEmail(email.toLowerCase()).map(existing -> {
                existing.setGoogleSub(googleSub);
                return userRepository.save(existing);
            }).orElseGet(() -> {
                // Brand-new user via Google
                String base = email.split("@")[0].replaceAll("[^a-z0-9._-]", "").toLowerCase();
                String username = base;
                int suffix = 1;
                while (userRepository.existsByUsername(username)) username = base + suffix++;

                return userRepository.save(User.builder()
                        .email(email.toLowerCase())
                        .username(username)
                        .fullName(name)
                        .googleSub(googleSub)
                        .passwordHash(null)
                        .build());
            })
        );
    }

    public User register(String fullName, String username, String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already registered");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username already taken");
        }
        User user = User.builder()
                .fullName(fullName)
                .username(username.toLowerCase())
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .build();
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username.toLowerCase())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public UserProfileDto getProfile(UUID userId) {
        User user = findById(userId);
        return toProfileDto(user);
    }

    @Transactional
    public UserProfileDto updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = findById(userId);
        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getCollege() != null) user.setCollege(req.getCollege());
        if (req.getBranch() != null) user.setBranch(req.getBranch());
        if (req.getYear() != null) user.setYear(req.getYear());
        if (req.getBio() != null) user.setBio(req.getBio());
        return toProfileDto(userRepository.save(user));
    }

    @Transactional
    public List<HandleDto> updateHandles(UUID userId, List<UpdateHandlesRequest.HandleItem> items) {
        User user = findById(userId);
        handleRepository.deleteByUserId(userId);
        handleRepository.flush();

        List<UserHandle> handles = items.stream()
                .map(item -> UserHandle.builder()
                        .user(user)
                        .platform(item.getPlatform())
                        .url(item.getUrl())
                        .displayOrder(item.getDisplayOrder())
                        .build())
                .toList();
        return handleRepository.saveAll(handles).stream()
                .map(h -> mapper.map(h, HandleDto.class))
                .toList();
    }

@Transactional
    public UserProfileDto updatePhoto(UUID userId, String photo) {
        User user = findById(userId);
        user.setProfilePhoto(photo);
        return toProfileDto(userRepository.save(user));
    }

    @Transactional
    public UserProfileDto updateCover(UUID userId, String photo) {
        User user = findById(userId);
        user.setCoverPhoto(photo);
        return toProfileDto(userRepository.save(user));
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = findById(userId);
        if (user.getPasswordHash() != null) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                throw new BadRequestException("Current password is incorrect");
            }
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        userRepository.deleteById(userId);
    }

    public UserProfileDto toProfileDto(User user) {
        UserProfileDto dto = mapper.map(user, UserProfileDto.class);
        dto.setHasPassword(user.getPasswordHash() != null);
        dto.setHandles(handleRepository.findByUserIdOrderByDisplayOrderAsc(user.getId())
                .stream().map(h -> mapper.map(h, HandleDto.class)).toList());
        return dto;
    }
}
