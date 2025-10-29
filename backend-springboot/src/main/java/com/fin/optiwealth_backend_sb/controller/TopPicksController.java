package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.security.TopPicksService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/top-picks")
public class TopPicksController {

    @Autowired
    private TopPicksService topPicksService;

    @GetMapping
    public ResponseEntity<?> getLatestTopPicks() {
        return ResponseEntity.ok(topPicksService.getLatestTopPicks());
    }
}
