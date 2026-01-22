package com.portmatch.domain.jobposting.service;

import com.portmatch.domain.jobposting.dto.TechStackDto;
import com.portmatch.domain.jobposting.entity.PostingStackEntity;

import java.util.List;

public interface StackService {
    void createStack(String s);

    void createPosingStack(PostingStackEntity ps);

    List<TechStackDto> getAllTechStacks();

    List<TechStackDto> getPostingStacks(String posting_id);
}
