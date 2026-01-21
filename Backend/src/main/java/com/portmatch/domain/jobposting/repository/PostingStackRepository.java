package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.entity.PostingStackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostingStackRepository extends JpaRepository<PostingStackEntity, String> {
}
