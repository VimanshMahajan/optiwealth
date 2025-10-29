package com.fin.optiwealth_backend_sb.repository;

import com.fin.optiwealth_backend_sb.entity.TopPick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TopPicksRepository extends JpaRepository<TopPick, Long> {

    @Query(""" 
        SELECT t FROM TopPick t\s
        WHERE t.updatedAt = (SELECT MAX(tp.updatedAt) FROM TopPick tp)
        """)
    List<TopPick> findLatestTopPicks();


}
