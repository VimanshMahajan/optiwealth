package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.entity.TopPick;
import com.fin.optiwealth_backend_sb.repository.TopPicksRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TopPicksService {

    private final TopPicksRepository topPicksRepository;

    public List<TopPick> getLatestTopPicks() {
        return topPicksRepository.findLatestTopPicks();
    }
}
