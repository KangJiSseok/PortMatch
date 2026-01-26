package com.portmatch.domain.scrap.service;

import com.portmatch.domain.scrap.dto.ScrapDto;

import java.util.List;

public interface ScrapService {
    public List<ScrapDto> getMyScraps(Long uid);
    public boolean toggleScrap(Long uid, String pid);
}