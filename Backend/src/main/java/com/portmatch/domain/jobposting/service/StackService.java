package com.portmatch.domain.jobposting.service;

import com.portmatch.domain.jobposting.dto.TechStackDto;
import com.portmatch.domain.jobposting.entity.PostingStackEntity;

import java.util.List;

public interface StackService {
    void createStack(Long id, String s);

    List<TechStackDto> getAllTechStacks();

    List<TechStackDto> getPostingStacks(Long posting_id);

    TechStackDto getTechStackById(Long id);

    List<TechStackDto> getTechStackByName(String name);
}
