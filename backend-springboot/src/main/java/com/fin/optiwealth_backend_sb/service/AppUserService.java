package com.fin.optiwealth_backend_sb.service;


import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppUserService {

    @Autowired
    private AppUserRepository appUserRepository;

    public AppUser saveUser(AppUser user) {
        return appUserRepository.save(user);
    }

    public List<AppUser> getAllUsers() {
        return appUserRepository.findAll();
    }

    public AppUser getUserById(Long id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

}
