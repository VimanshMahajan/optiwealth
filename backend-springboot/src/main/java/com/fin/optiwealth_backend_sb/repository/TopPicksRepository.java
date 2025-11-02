package com.fin.optiwealth_backend_sb.repository;

import com.fin.optiwealth_backend_sb.entity.TopPick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TopPicksRepository extends JpaRepository<TopPick, Long> {

    @Query(value = """
        SELECT * FROM top_picks
        WHERE updated_at >= (SELECT MAX(updated_at) FROM top_picks) - INTERVAL '1 minute'
        ORDER BY score DESC
        """, nativeQuery = true)
    List<TopPick> findLatestTopPicks();


}
