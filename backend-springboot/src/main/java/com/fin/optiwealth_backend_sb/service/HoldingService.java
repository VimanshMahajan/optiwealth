package com.fin.optiwealth_backend_sb.service;


import com.fin.optiwealth_backend_sb.entity.Holding;
import com.fin.optiwealth_backend_sb.repository.HoldingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HoldingService {

    @Autowired
    private HoldingRepository holdingRepository;

    public Holding saveHolding(Holding holding) {
        return holdingRepository.save(holding);
    }

    public List<Holding> getAllHoldings() {
        return holdingRepository.findAll();
    }

    public Holding getHoldingById(Long id) {
        return holdingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holding not found"));
    }

    public void deleteHolding(Long id) {
        holdingRepository.deleteById(id);
    }
}
