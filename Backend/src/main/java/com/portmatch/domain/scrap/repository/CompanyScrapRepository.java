package com.portmatch.domain.scrap.repository;

import com.portmatch.domain.scrap.entity.CompanyScrapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface CompanyScrapRepository extends JpaRepository<CompanyScrapEntity, Long> {

    // 1. findByUidAndCid -> findByUser_IdAndCompany_Cid
    // user 객체 안의 id와 company 객체 안의 cid를 보겠다는 뜻!
    Optional<CompanyScrapEntity> findByUser_IdAndCompany_Cid(Long uid, String cid);

    // 2. findAllByUid... -> findAllByUser_Id...
    List<CompanyScrapEntity> findAllByUser_IdOrderByCreatedAtDesc(Long uid);

    // 3. existsByUidAndCid -> existsByUser_IdAndCompany_Cid
    boolean existsByUser_IdAndCompany_Cid(Long uid, String cid);

    // 4. countByCid -> countByCompany_Cid
    long countByCompany_Cid(String cid);
}